import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'
import Banner from '@douyinfe/semi-ui/lib/es/banner'
import Button from '@douyinfe/semi-ui/lib/es/button'
import DatePicker from '@douyinfe/semi-ui/lib/es/datePicker'
import Select from '@douyinfe/semi-ui/lib/es/select'
import Switch from '@douyinfe/semi-ui/lib/es/switch'
import Tag from '@douyinfe/semi-ui/lib/es/tag'
import { MonitorChart } from '../components/overview/MonitorCharts'
import {
  ResourceToolbar,
  ResourceState,
  ResourceMetrics,
} from '../components/management/ResourceLayout'
import type { ModulePageProps } from '../components/management/ResourceLayout'
import { OperationModal } from '../components/management/OperationModal'
import type { ResourceOperation } from '../components/management/OperationModal'
import { usePanelQuery } from '../hooks/usePanelQuery'
import {
  cleanMonitorHistory,
  fetchMonitorHistory,
  fetchMonitorOptions,
} from '../lib/monitorHistory'
import { getPanelPath } from '../routes/panel'
import type { MonitorKind } from '../types/monitor'
import { formatByteRate, formatPercent, formatTimestamp } from '../utils/formatter'

const ranges = [
  { label: '最近 1 小时', value: 1 },
  { label: '最近 6 小时', value: 6 },
  { label: '最近 24 小时', value: 24 },
  { label: '最近 7 天', value: 168 },
]
export function MonitorPage(props: ModulePageProps) {
  const { node } = props
  const navigate = useNavigate()
  const [hours, setHours] = useState(1)
  const [custom, setCustom] = useState<{ start: number; end: number } | null>(null)
  const [network, setNetwork] = useState('all')
  const [disk, setDisk] = useState('all')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [operation, setOperation] = useState<ResourceOperation | null>(null)
  const loadOptions = useCallback(
    (signal: AbortSignal) => fetchMonitorOptions(node, signal),
    [node],
  )
  const options = usePanelQuery(JSON.stringify(node), loadOptions, {
    enabled: Boolean(node.apiKey),
  })
  const load = useCallback(
    async (signal: AbortSignal) => {
      const end = Date.now()
      const range = custom ?? { start: end - hours * 3600000, end }
      return { range, history: await fetchMonitorHistory(node, range, network, disk, signal) }
    },
    [node, custom, hours, network, disk],
  )
  const query = usePanelQuery(JSON.stringify([node, custom, hours, network, disk]), load, {
    enabled: Boolean(node.apiKey),
    interval: autoRefresh && !custom ? 30000 : 0,
  })
  const latest = query.data?.history
  const settings = options.data?.settings
  const refresh = () => {
    options.refresh()
    query.refresh()
  }
  return (
    <div className="mx-auto flex w-full max-w-400 flex-col gap-5 text-(--semi-color-text-0)">
      <ResourceToolbar
        loading={query.loading || options.loading}
        onRefresh={refresh}
        actions={
          <Button onClick={() => navigate(getPanelPath(node.name, 'settings') + '?tab=monitor')}>
            采集设置
          </Button>
        }
      >
        <Select
          aria-label="监控时间范围"
          value={custom ? 0 : hours}
          optionList={[...ranges, { label: '自定义时间', value: 0 }]}
          style={{ width: 160 }}
          onChange={(value) => {
            if (Number(value)) {
              setHours(Number(value))
              setCustom(null)
            } else {
              const end = Date.now()
              setCustom({ start: end - hours * 3600000, end })
            }
          }}
        />
        <Select
          prefix="网卡"
          aria-label="监控网卡"
          value={network}
          style={{ minWidth: 180 }}
          optionList={[...new Set(['all', ...(options.data?.networks ?? [])])].map((value) => ({
            label: value === 'all' ? '全部网卡' : value,
            value,
          }))}
          onChange={(value) => setNetwork(String(value))}
        />
        <Select
          prefix="磁盘"
          aria-label="监控磁盘"
          value={disk}
          style={{ minWidth: 180 }}
          optionList={[...new Set(['all', ...(options.data?.disks ?? [])])].map((value) => ({
            label: value === 'all' ? '全部磁盘' : value,
            value,
          }))}
          onChange={(value) => setDisk(String(value))}
        />
        <div className="flex items-center gap-2 text-xs text-(--semi-color-text-2)">
          <Switch
            size="small"
            aria-label="自动刷新监控"
            checked={autoRefresh && !custom}
            disabled={Boolean(custom)}
            onChange={setAutoRefresh}
          />
          每 30 秒刷新
        </div>
        {custom && (
          <DatePicker
            type="dateTimeRange"
            value={[new Date(custom.start), new Date(custom.end)]}
            needConfirm
            showClear={false}
            style={{ width: '100%', maxWidth: 380 }}
            onChange={(value) => {
              if (
                Array.isArray(value) &&
                value[0] instanceof Date &&
                value[1] instanceof Date &&
                value[1].getTime() > value[0].getTime()
              )
                setCustom({ start: value[0].getTime(), end: value[1].getTime() })
            }}
          />
        )}
        {settings && (
          <Tag color={settings.monitorStatus === 'Enable' ? 'green' : 'grey'}>
            {settings.monitorStatus === 'Enable' ? '正在采集' : '采集已停用'}
          </Tag>
        )}
      </ResourceToolbar>
      {options.error && (
        <Banner
          type="warning"
          closeIcon={null}
          description={`无法读取采集配置：${options.error}`}
        />
      )}
      {settings?.monitorStatus === 'Disable' && (
        <Banner
          type="info"
          closeIcon={null}
          description="节点已暂停监控采集，已有的历史记录仍可查询。可前往采集设置重新启用。"
        />
      )}
      <ResourceState
        {...props}
        loading={query.loading}
        error={query.error}
        hasData={Boolean(query.data)}
        empty={false}
        onRetry={refresh}
        emptyTitle="暂无监控记录"
        emptyDescription="开启监控后，数据会按采集间隔保存。"
      >
        <ResourceMetrics
          items={[
            {
              label: '最近 CPU 使用率',
              value: formatPercent(latest?.usage.at(-1)?.cpu),
              hint: '所选范围的最后一条采样',
            },
            {
              label: '最近内存使用率',
              value: formatPercent(latest?.usage.at(-1)?.memory),
              hint: '所选范围的最后一条采样',
            },
            {
              label: '最近下载速率',
              value: formatByteRate(latest?.network.at(-1)?.networkRecv),
              hint: network === 'all' ? '全部网卡' : network,
            },
            {
              label: '采集间隔',
              value: settings ? `${settings.monitorInterval} 秒` : '—',
              hint: settings
                ? `历史保留 ${settings.monitorStoreDays} 天`
                : '读取节点采集配置后显示',
            },
          ]}
        />
        <section className="grid min-w-0 gap-4 lg:grid-cols-2" aria-label="历史监控趋势">
          {(['usage', 'load', 'network', 'io'] as MonitorKind[]).map((kind) => (
            <MonitorChart
              key={kind}
              kind={kind}
              history={latest?.[kind] ?? []}
              range={query.data?.range}
              rangeLabel={
                custom ? '自定义范围' : ranges.find((item) => item.value === hours)?.label
              }
              emptyDescription="此范围内的采样不足，试试其他时间范围或检查采集设置。"
              footer={`${latest?.[kind].length ?? 0} 条采样 · ${kind === 'load' ? '1 / 5 / 15 分钟平均负载' : '历史采样来自节点监控记录'}`}
            />
          ))}
        </section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-(--semi-color-text-2)">
            {query.receivedAt ? `更新于 ${formatTimestamp(query.receivedAt)}` : ''}
          </span>
          <Button
            type="danger"
            theme="borderless"
            disabled={query.loading || Boolean(query.error)}
            onClick={() =>
              setOperation({
                title: '清空监控记录',
                description: '永久删除该节点的全部历史监控记录。后续采集不受影响。',
                danger: true,
                confirmName: node.name,
                action: (signal) => cleanMonitorHistory(node, signal),
              })
            }
          >
            清空历史记录
          </Button>
        </div>
      </ResourceState>
      {operation && (
        <OperationModal
          operation={operation}
          onClose={() => setOperation(null)}
          onComplete={() => {
            setOperation(null)
            query.refresh()
          }}
        />
      )}
    </div>
  )
}
