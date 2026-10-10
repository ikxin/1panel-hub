import Banner from '@douyinfe/semi-ui/lib/es/banner'
import Button from '@douyinfe/semi-ui/lib/es/button'
import Card from '@douyinfe/semi-ui/lib/es/card'
import Empty from '@douyinfe/semi-ui/lib/es/empty'
import Skeleton from '@douyinfe/semi-ui/lib/es/skeleton'
import Tag from '@douyinfe/semi-ui/lib/es/tag'
import { IconServer } from '@douyinfe/semi-icons'
import type { NodeConfig } from '../../lib/nodes'
import { connectionState } from '../../lib/status'
import type { NodeStatus } from '../../lib/status'
import { formatTimestamp } from '../../utils/formatter'
import { DiskUsage } from './DiskUsage'
import { MonitorCharts } from './MonitorCharts'
import { OverviewCounts } from './OverviewCounts'
import { ResourceStatus } from './ResourceStatus'
import { SystemInfo } from './SystemInfo'

interface Props {
  node: NodeConfig
  status?: NodeStatus
  now: number
  onEdit: () => void
  editDisabled?: boolean
}

export function NodeOverview({ node, status, now, onEdit, editDisabled }: Props) {
  const connection = connectionState(node, status, now)
  const data = status?.data
  const loading = connection.kind === 'pending'
  const tagColor =
    connection.kind === 'online'
      ? 'green'
      : connection.kind === 'offline'
        ? 'red'
        : connection.kind === 'attention'
          ? 'orange'
          : 'grey'

  return (
    <div className="mx-auto flex w-full max-w-400 flex-col gap-5 text-(--semi-color-text-0)">
      <Card
        bodyStyle={{ padding: 0 }}
        style={{ minWidth: 0, borderRadius: 'var(--semi-border-radius-medium)' }}
      >
        <div className="flex min-w-0 flex-col gap-5 p-4 sm:p-6">
          <header className="flex items-start justify-between gap-4 border-b border-(--semi-color-border) pb-4 sm:items-center">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2">
              <div className="flex min-w-0 items-center gap-2">
                <IconServer className="shrink-0 text-(--semi-color-text-2)" />
                <span className="max-w-36 truncate text-sm font-medium" title={node.name}>
                  {node.name}
                </span>
                <Tag color={tagColor} shape="circle" size="small">
                  <span
                    className="inline-flex items-center gap-1.5"
                    role="status"
                    aria-live="polite"
                  >
                    <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
                    {connection.label}
                  </span>
                </Tag>
              </div>
              <span className="max-w-full wrap-anywhere font-mono text-xs leading-5 text-(--semi-color-text-2)">
                {node.host}:{node.port}
              </span>
            </div>
            {status?.receivedAt !== undefined && (
              <p className="m-0 shrink-0 text-right text-[11px] leading-5 text-(--semi-color-text-2)">
                最近更新 <span className="tabular-nums">{formatTimestamp(status.receivedAt)}</span>
              </p>
            )}
          </header>

          {status?.error && data && (
            <Banner
              type="danger"
              closeIcon={null}
              description={`连接失败：${status.error}。当前显示最近一次采集数据，将自动重试。`}
            />
          )}
          {data && !status?.error && connection.kind !== 'online' && (
            <Banner
              type="warning"
              closeIcon={null}
              description="数据暂未更新，当前显示最近一次采集结果。"
            />
          )}

          {data && status ? (
            <div className="min-w-0">
              <ResourceStatus data={data} />
              <div className="mt-5 border-t border-(--semi-color-border) pt-4">
                <OverviewCounts data={data} />
              </div>
            </div>
          ) : loading ? (
            <div role="status" aria-label="正在获取服务器监控数据" className="space-y-5">
              <Skeleton
                active
                loading
                placeholder={
                  <div className="min-w-0 space-y-5">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-6 xl:grid-cols-4">
                      {Array.from({ length: 4 }, (_, index) => (
                        <Skeleton.Image
                          key={index}
                          style={{ width: '100%', height: 148, borderRadius: 4 }}
                        />
                      ))}
                    </div>
                    <Skeleton.Image style={{ width: '100%', height: 36, borderRadius: 4 }} />
                  </div>
                }
              />
              <p className="m-0 text-center text-sm text-(--semi-color-text-2)">
                正在获取监控数据…
              </p>
            </div>
          ) : (
            <div className="px-2 py-8">
              <Empty
                image={<IconServer size="extra-large" />}
                title={node.apiKey ? '暂时无法连接节点' : '配置节点后查看概览'}
                description={
                  node.apiKey
                    ? `${status?.error || '尚未获取监控数据'}，连接恢复后将自动更新。`
                    : '请填写 1Panel API Key，并在面板中启用 API 访问。'
                }
              >
                <Button className="mt-5" theme="solid" disabled={editDisabled} onClick={onEdit}>
                  编辑节点配置
                </Button>
              </Empty>
            </div>
          )}
        </div>
      </Card>
      {data && status ? (
        <div className="grid min-w-0 grid-cols-1 items-start gap-5 xl:grid-cols-3">
          <div className="min-w-0 xl:col-span-2">
            <MonitorCharts status={status} />
          </div>
          <aside aria-label="服务器信息" className="flex min-w-0 flex-col gap-4">
            <SystemInfo data={data} />
            <DiskUsage disks={data.currentInfo.diskData} />
          </aside>
        </div>
      ) : loading ? (
        <Skeleton
          active
          loading
          placeholder={<Skeleton.Image style={{ width: '100%', height: 260, borderRadius: 8 }} />}
        />
      ) : null}
    </div>
  )
}
