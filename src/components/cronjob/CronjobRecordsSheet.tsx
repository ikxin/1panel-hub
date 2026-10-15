import { useCallback, useState } from 'react'
import Banner from '@douyinfe/semi-ui/lib/es/banner'
import Button from '@douyinfe/semi-ui/lib/es/button'
import Card from '@douyinfe/semi-ui/lib/es/card'
import Empty from '@douyinfe/semi-ui/lib/es/empty'
import Select from '@douyinfe/semi-ui/lib/es/select'
import SideSheet from '@douyinfe/semi-ui/lib/es/sideSheet'
import Spin from '@douyinfe/semi-ui/lib/es/spin'
import { ResourcePagination } from '../management/ResourceLayout'
import { StatusTag } from '../management/StatusTag'
import { OperationModal } from '../management/OperationModal'
import { usePanelQuery } from '../../hooks/usePanelQuery'
import { useResourceSearch } from '../../hooks/useResourceSearch'
import { fetchCronjobRecordLog, searchCronjobRecords, stopCronjobRecord } from '../../lib/cronjob'
import type { NodeConfig } from '../../lib/nodes'
import type { Cronjob, CronjobRecord } from '../../types/cronjob'
import { formatMetric, formatTimestamp } from '../../utils/formatter'

export function CronjobRecordsSheet({
  node,
  job,
  onClose,
}: {
  node: NodeConfig
  job: Cronjob
  onClose: () => void
}) {
  const [status, setStatus] = useState('')
  const [days, setDays] = useState(30)
  const [selected, setSelected] = useState<CronjobRecord | null>(null)
  const [stopping, setStopping] = useState<CronjobRecord | null>(null)
  const filter = useResourceSearch(`${job.id}:${status}:${days}`)
  const load = useCallback(
    (signal: AbortSignal) =>
      searchCronjobRecords(node, job.id, filter.search, status, days, signal),
    [node, job.id, filter.search, status, days],
  )
  const query = usePanelQuery(JSON.stringify([node, job.id, filter.search, status, days]), load, {
    interval: 10000,
  })
  return (
    <SideSheet
      visible
      title={`${job.name} · 执行记录`}
      width="min(880px, 100vw)"
      onCancel={() => {
        if (!stopping) onClose()
      }}
      closable={!stopping}
      maskClosable={!stopping}
      closeOnEsc={!stopping}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <Select
            aria-label="执行记录时间范围"
            value={days}
            optionList={[7, 30, 90, 365].map((value) => ({ label: `最近 ${value} 天`, value }))}
            onChange={(value) => {
              setDays(Number(value))
              setSelected(null)
            }}
            style={{ width: 150 }}
          />
          <Select
            aria-label="执行结果"
            value={status}
            optionList={[
              { label: '全部结果', value: '' },
              { label: '成功', value: 'Success' },
              { label: '失败', value: 'Failed' },
              { label: '执行中', value: 'Running' },
            ]}
            onChange={(value) => {
              setStatus(String(value))
              setSelected(null)
            }}
            style={{ width: 140 }}
          />
          <Button className="ml-auto" loading={query.loading} onClick={query.refresh}>
            刷新
          </Button>
        </div>
        {query.error && <Banner type="danger" closeIcon={null} description={query.error} />}
        {query.loading && !query.data ? (
          <div className="py-8 text-center">
            <Spin />
          </div>
        ) : !query.data?.items.length ? (
          <Empty
            title="此范围内没有执行记录"
            description="可调整时间范围，或回到列表手动执行任务。"
          />
        ) : (
          <div className="grid gap-2">
            {query.data.items.map((record) => (
              <Card key={record.id} bodyStyle={{ padding: 12 }}>
                <div className="flex flex-wrap items-center gap-3">
                  <StatusTag status={record.status} />
                  <time className="text-xs tabular-nums">
                    {formatTimestamp(record.startTime, true)}
                  </time>
                  <span className="text-xs text-(--semi-color-text-2)">
                    耗时 {formatMetric(record.interval / 1000, 2)} 秒
                  </span>
                  <Button
                    size="small"
                    className="ml-auto"
                    theme={selected?.id === record.id ? 'solid' : 'borderless'}
                    onClick={() => setSelected(record)}
                  >
                    查看输出
                  </Button>
                </div>
                {['Running', 'Waiting'].includes(record.status) && (
                  <Button
                    size="small"
                    type="danger"
                    theme="borderless"
                    disabled={query.loading || Boolean(query.error)}
                    onClick={() => setStopping(record)}
                  >
                    停止此次执行
                  </Button>
                )}
                {record.message && (
                  <p className="mb-0 wrap-anywhere text-xs text-(--semi-color-danger)">
                    {record.message}
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}
        {query.data && (
          <ResourcePagination
            total={query.data.total}
            search={filter.search}
            loading={query.loading || Boolean(query.error)}
            onPageChange={(page) => {
              setSelected(null)
              filter.changePage(page)
            }}
            onPageSizeChange={(size) => {
              setSelected(null)
              filter.changePageSize(size)
            }}
          />
        )}
        {selected && (
          <RecordLog
            key={selected.id}
            node={node}
            record={query.data?.items.find((record) => record.id === selected.id) ?? selected}
          />
        )}
        {stopping && (
          <OperationModal
            operation={{
              title: '停止执行',
              successMessage: '已提交停止请求，执行状态将自动更新',
              description: `中止「${job.name}」在 ${stopping.startTime} 启动的执行，已完成的操作不会回滚。`,
              danger: true,
              action: (signal) => stopCronjobRecord(node, stopping.id, signal),
            }}
            onClose={() => setStopping(null)}
            onComplete={() => {
              setStopping(null)
              query.refresh()
            }}
          />
        )}
      </div>
    </SideSheet>
  )
}
function RecordLog({ node, record }: { node: NodeConfig; record: CronjobRecord }) {
  const load = useCallback(
    (signal: AbortSignal) => fetchCronjobRecordLog(node, record.id, signal),
    [node, record.id],
  )
  const query = usePanelQuery(JSON.stringify([node, record.id]), load, {
    interval: ['Running', 'Waiting'].includes(record.status) ? 3000 : 0,
  })
  return (
    <Card
      title="执行输出"
      headerExtraContent={
        <Button size="small" loading={query.loading} onClick={query.refresh}>
          刷新输出
        </Button>
      }
    >
      {query.error && <Banner type="danger" closeIcon={null} description={query.error} />}
      <pre className="m-0 max-h-100 overflow-auto whitespace-pre-wrap wrap-anywhere font-mono text-xs leading-6">
        {query.data || (query.loading ? '正在读取执行输出…' : '暂无输出')}
      </pre>
      {record.targetPath && (
        <p className="mb-0 wrap-anywhere text-xs text-(--semi-color-text-2)">
          产物路径：{record.targetPath}
        </p>
      )}
    </Card>
  )
}
