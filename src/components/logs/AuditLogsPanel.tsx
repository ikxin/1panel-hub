import { useCallback, useState } from 'react'
import type { ReactNode } from 'react'
import Button from '@douyinfe/semi-ui/lib/es/button'
import Card from '@douyinfe/semi-ui/lib/es/card'
import Select from '@douyinfe/semi-ui/lib/es/select'
import SideSheet from '@douyinfe/semi-ui/lib/es/sideSheet'
import {
  ResourceToolbar,
  ResourceSearchInput,
  ResourceState,
  ResourcePagination,
} from '../management/ResourceLayout'
import type { ModulePageProps } from '../management/ResourceLayout'
import { StatusTag } from '../management/StatusTag'
import { OperationModal } from '../management/OperationModal'
import { usePanelQuery } from '../../hooks/usePanelQuery'
import { useResourceSearch } from '../../hooks/useResourceSearch'
import { cleanAuditLogs, searchAuditLogs } from '../../lib/logs'
import type { AuditLog, AuditLogKind } from '../../types/logs'
import { formatTimestamp } from '../../utils/formatter'

export function AuditLogsPanel({
  kind,
  children,
  ...props
}: ModulePageProps & { kind: AuditLogKind; children?: ReactNode }) {
  const { node } = props
  const [status, setStatus] = useState('')
  const [detail, setDetail] = useState<AuditLog | null>(null)
  const [clean, setClean] = useState(false)
  const filter = useResourceSearch(`${kind}:${status}`)
  const load = useCallback(
    (signal: AbortSignal) => searchAuditLogs(node, kind, filter.search, status, signal),
    [node, kind, filter.search, status],
  )
  const query = usePanelQuery(JSON.stringify([node, kind, filter.search, status]), load, {
    enabled: Boolean(node.apiKey),
  })
  const disabled = query.loading || filter.pending || Boolean(query.error)
  const title = kind === 'operation' ? '操作日志' : '登录日志'
  return (
    <>
      <ResourceToolbar
        loading={query.loading}
        onRefresh={query.refresh}
        actions={
          <Button
            type="danger"
            theme="borderless"
            disabled={!query.data || disabled}
            onClick={() => setClean(true)}
          >
            清空{title}
          </Button>
        }
      >
        {children}
        <ResourceSearchInput
          value={filter.query}
          onChange={filter.setQuery}
          placeholder={kind === 'operation' ? '搜索操作描述' : '搜索登录用户或 IP'}
        />
        <Select
          aria-label="日志结果"
          value={status}
          onChange={(value) => setStatus(String(value))}
          style={{ width: 150 }}
          optionList={[
            { label: '全部结果', value: '' },
            { label: '成功', value: 'Success' },
            { label: '失败', value: 'Failed' },
          ]}
        />
      </ResourceToolbar>
      <ResourceState
        {...props}
        loading={query.loading}
        error={query.error}
        hasData={Boolean(query.data)}
        empty={!query.data?.items.length}
        filtered={Boolean(filter.query || status)}
        onRetry={query.refresh}
        emptyTitle={`暂无${title}`}
        emptyDescription="节点产生新的活动后，记录会显示在这里。"
      >
        <Card bodyStyle={{ padding: 0 }}>
          <div
            className="divide-y divide-(--semi-color-border)"
            aria-label={title}
            aria-busy={disabled}
          >
            {query.data?.items.map((item) => (
              <article key={item.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
                <div className="flex items-center gap-3 sm:w-42 sm:shrink-0 sm:flex-col sm:items-start">
                  <StatusTag status={item.status} />
                  <time className="text-xs tabular-nums text-(--semi-color-text-2)">
                    {formatTimestamp(item.time, true)}
                  </time>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="m-0 line-clamp-2 wrap-anywhere text-sm leading-6">{item.summary}</p>
                  <p className="mt-1 mb-0 flex flex-wrap gap-x-4 gap-y-1 text-xs text-(--semi-color-text-2)">
                    <span>用户 {item.user}</span>
                    <span className="font-mono">{item.ip || '未知 IP'}</span>
                  </p>
                </div>
                <Button size="small" theme="borderless" onClick={() => setDetail(item)}>
                  查看详情
                </Button>
              </article>
            ))}
          </div>
        </Card>
      </ResourceState>
      {query.data && (
        <ResourcePagination
          total={query.data.total}
          search={filter.search}
          loading={disabled}
          receivedAt={query.receivedAt}
          onPageChange={filter.changePage}
          onPageSizeChange={filter.changePageSize}
        />
      )}
      {detail && (
        <SideSheet
          visible
          title={`${title}详情`}
          width="min(640px, 100vw)"
          onCancel={() => setDetail(null)}
        >
          <div className="mb-5 flex items-center justify-between gap-2">
            <StatusTag status={detail.status} />
            <span className="text-xs text-(--semi-color-text-2)">
              {formatTimestamp(detail.time, true)}
            </span>
          </div>
          <dl className="m-0 space-y-5">
            {[
              { label: '用户', value: detail.user },
              { label: '来源 IP', value: detail.ip },
              ...detail.details,
            ].map((item) => (
              <div key={item.label}>
                <dt className="mb-1 text-xs text-(--semi-color-text-2)">{item.label}</dt>
                <dd className="m-0 whitespace-pre-wrap wrap-anywhere text-sm leading-6">
                  {item.value || '—'}
                </dd>
              </div>
            ))}
          </dl>
        </SideSheet>
      )}
      {clean && (
        <OperationModal
          operation={{
            title: `清空${title}`,
            description: `永久删除当前面板的全部${title}，包含其他用户和节点的记录，不受当前搜索条件影响。`,
            danger: true,
            confirmName: node.name,
            action: (signal) => cleanAuditLogs(node, kind, signal),
          }}
          onClose={() => setClean(false)}
          onComplete={() => {
            setClean(false)
            query.refresh()
          }}
        />
      )}
    </>
  )
}
