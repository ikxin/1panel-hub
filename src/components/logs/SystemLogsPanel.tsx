import { useCallback, useState } from 'react'
import type { ReactNode } from 'react'
import Banner from '@douyinfe/semi-ui/lib/es/banner'
import Button from '@douyinfe/semi-ui/lib/es/button'
import Card from '@douyinfe/semi-ui/lib/es/card'
import Select from '@douyinfe/semi-ui/lib/es/select'
import Switch from '@douyinfe/semi-ui/lib/es/switch'
import Tag from '@douyinfe/semi-ui/lib/es/tag'
import { ResourceToolbar, ResourceSearchInput, ResourceState } from '../management/ResourceLayout'
import type { ModulePageProps } from '../management/ResourceLayout'
import { usePanelQuery } from '../../hooks/usePanelQuery'
import { useResourceSearch } from '../../hooks/useResourceSearch'
import { fetchSystemLogs, fetchSystemLogServices, fetchSystemLogStatus } from '../../lib/logs'
import { formatTimestamp } from '../../utils/formatter'

const priorities = [
  { label: '全部级别', value: '' },
  { label: '紧急', value: '0' },
  { label: '告警', value: '1' },
  { label: '严重', value: '2' },
  { label: '错误', value: '3' },
  { label: '警告', value: '4' },
  { label: '通知', value: '5' },
  { label: '信息', value: '6' },
  { label: '调试', value: '7' },
]
export function SystemLogsPanel({
  children,
  ...props
}: ModulePageProps & { children?: ReactNode }) {
  const { node } = props
  const [priority, setPriority] = useState('')
  const [service, setService] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(false)
  const search = useResourceSearch('system')
  const scope = JSON.stringify([search.search.name, priority, service])
  const [pagination, setPagination] = useState({ scope: '', cursors: [''] })
  const cursors = pagination.scope === scope ? pagination.cursors : ['']
  const cursor = cursors.at(-1) ?? ''
  const loadStatus = useCallback(
    (signal: AbortSignal) => fetchSystemLogStatus(node, signal),
    [node],
  )
  const source = usePanelQuery(JSON.stringify(node), loadStatus, { enabled: Boolean(node.apiKey) })
  const loadServices = useCallback(
    (signal: AbortSignal) => fetchSystemLogServices(node, signal),
    [node],
  )
  const services = usePanelQuery(JSON.stringify(node), loadServices, {
    enabled: Boolean(node.apiKey && source.data?.source === 'journalctl'),
  })
  const load = useCallback(
    (signal: AbortSignal) =>
      fetchSystemLogs(node, { keyword: search.search.name, priority, service }, cursor, signal),
    [node, search.search.name, priority, service, cursor],
  )
  const query = usePanelQuery(JSON.stringify([node, scope, cursor]), load, {
    enabled: Boolean(node.apiKey),
    interval: autoRefresh && !cursor ? 5000 : 0,
  })
  const disabled = query.loading || search.pending || Boolean(query.error)
  const refresh = () => {
    source.refresh()
    services.refresh()
    query.refresh()
  }
  return (
    <>
      <ResourceToolbar loading={query.loading} onRefresh={refresh}>
        {children}
        <ResourceSearchInput
          value={search.query}
          onChange={search.setQuery}
          placeholder="搜索系统日志关键词"
        />
        <Select
          aria-label="日志级别"
          value={priority}
          style={{ width: 140 }}
          optionList={priorities}
          onChange={(value) => setPriority(String(value))}
        />
        {source.data?.source === 'journalctl' && (
          <Select
            filter
            showClear
            aria-label="系统服务"
            placeholder="全部服务"
            value={service || undefined}
            style={{ width: 190 }}
            optionList={(services.data ?? []).map((value) => ({ label: value, value }))}
            onChange={(value) => setService(value ? String(value) : '')}
          />
        )}
        <label className="flex items-center gap-2 text-xs text-(--semi-color-text-2)">
          <Switch
            size="small"
            aria-label="自动刷新系统日志"
            checked={autoRefresh}
            onChange={setAutoRefresh}
          />
          自动刷新
        </label>
      </ResourceToolbar>
      {(source.error || services.error || source.data?.message) && (
        <Banner
          type="warning"
          closeIcon={null}
          description={source.error || services.error || source.data?.message}
        />
      )}
      {source.data && !source.data.keywordFilterSupported && search.query && (
        <Banner
          type="warning"
          closeIcon={null}
          description="当前系统日志源不支持关键词过滤，请清空关键词或升级节点系统工具。"
        />
      )}
      <ResourceState
        {...props}
        loading={query.loading}
        error={query.error}
        hasData={Boolean(query.data)}
        empty={!query.data?.items.length}
        filtered={Boolean(search.query || priority || service)}
        onRetry={refresh}
        emptyTitle="暂无系统日志"
        emptyDescription="当前日志源没有返回记录，可刷新或调整筛选条件。"
      >
        <Card bodyStyle={{ padding: 0 }}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-(--semi-color-border) px-4 py-3 text-xs text-(--semi-color-text-2)">
            <span>
              {query.data?.source || source.data?.source || '系统日志'} · 本页{' '}
              {query.data?.items.length ?? 0} 条
            </span>
            <span>
              {autoRefresh && cursor
                ? '浏览历史时暂停刷新'
                : autoRefresh
                  ? '每 5 秒刷新'
                  : '手动刷新'}
              {query.receivedAt ? ` · ${formatTimestamp(query.receivedAt)}` : ''}
            </span>
          </div>
          <div
            className="max-h-[65vh] divide-y divide-(--semi-color-border) overflow-auto"
            aria-label="系统日志内容"
          >
            {query.data?.items.map((item, index) => (
              <article key={`${cursor}:${index}`} className="px-4 py-3">
                <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] text-(--semi-color-text-2)">
                  <time className="tabular-nums">{item.time}</time>
                  <Tag
                    size="small"
                    color={
                      ['0', '1', '2', '3'].includes(item.priority)
                        ? 'red'
                        : item.priority === '4'
                          ? 'orange'
                          : 'grey'
                    }
                  >
                    {priorities.find((value) => value.value === item.priority)?.label ??
                      (item.priority || '日志')}
                  </Tag>
                  <span>{item.service}</span>
                </div>
                <pre className="m-0 whitespace-pre-wrap wrap-anywhere font-mono text-xs leading-6">
                  {item.message || item.raw}
                </pre>
              </article>
            ))}
          </div>
        </Card>
      </ResourceState>
      {query.data && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-(--semi-color-text-2)">
            第 {cursors.length} 页 · 每页最多 100 条
          </span>
          <div className="flex gap-2">
            <Button
              disabled={disabled || cursors.length === 1}
              onClick={() => setPagination({ scope, cursors: cursors.slice(0, -1) })}
            >
              上一页
            </Button>
            <Button
              disabled={
                disabled ||
                !query.data.hasMore ||
                !query.data.nextCursor ||
                query.data.nextCursor === cursor
              }
              onClick={() =>
                setPagination({ scope, cursors: [...cursors, query.data!.nextCursor] })
              }
            >
              更早记录
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
