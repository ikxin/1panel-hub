import { useCallback, useState } from 'react'
import Button from '@douyinfe/semi-ui/lib/es/button'
import Card from '@douyinfe/semi-ui/lib/es/card'
import { IconCalendarClock, IconPlus } from '@douyinfe/semi-icons'
import {
  ResourceToolbar,
  ResourceSearchInput,
  ResourceState,
  ResourcePagination,
} from '../components/management/ResourceLayout'
import type { ModulePageProps } from '../components/management/ResourceLayout'
import { OperationModal } from '../components/management/OperationModal'
import type { ResourceOperation } from '../components/management/OperationModal'
import { StatusTag } from '../components/management/StatusTag'
import { CronjobFormSheet } from '../components/cronjob/CronjobFormSheet'
import { CronjobRecordsSheet } from '../components/cronjob/CronjobRecordsSheet'
import { usePanelQuery } from '../hooks/usePanelQuery'
import { useResourceSearch } from '../hooks/useResourceSearch'
import { operateCronjob, searchCronjobs } from '../lib/cronjob'
import { cronjobTypeLabels } from '../types/cronjob'
import type { Cronjob } from '../types/cronjob'
import { formatTimestamp } from '../utils/formatter'

export function CronjobPage(props: ModulePageProps) {
  const { node } = props
  const [editor, setEditor] = useState<{ id?: number } | null>(null)
  const [records, setRecords] = useState<Cronjob | null>(null)
  const [operation, setOperation] = useState<ResourceOperation | null>(null)
  const filter = useResourceSearch('cronjob')
  const load = useCallback(
    (signal: AbortSignal) => searchCronjobs(node, filter.search, signal),
    [node, filter.search],
  )
  const query = usePanelQuery(JSON.stringify([node, filter.search]), load, {
    enabled: Boolean(node.apiKey),
    interval: 15000,
  })
  const disabled = query.loading || filter.pending || Boolean(query.error)
  return (
    <div className="mx-auto flex w-full max-w-400 flex-col gap-5 text-(--semi-color-text-0)">
      <ResourceToolbar
        loading={query.loading}
        onRefresh={query.refresh}
        actions={
          <Button
            icon={<IconPlus />}
            theme="solid"
            disabled={!node.apiKey}
            onClick={() => setEditor({})}
          >
            创建任务
          </Button>
        }
      >
        <ResourceSearchInput
          value={filter.query}
          onChange={filter.setQuery}
          placeholder="搜索任务名称"
        />
      </ResourceToolbar>
      <ResourceState
        {...props}
        loading={query.loading}
        error={query.error}
        hasData={Boolean(query.data)}
        empty={!query.data?.items.length}
        filtered={Boolean(filter.query)}
        onRetry={query.refresh}
        emptyTitle="还没有计划任务"
        emptyDescription="创建一个定时脚本、URL 访问、时间同步或日志清理任务。"
      >
        <section aria-label="计划任务列表" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {query.data?.items.map((job) => {
            const running = ['Running', 'Waiting'].includes(job.lastRecordStatus ?? '')
            return (
              <Card key={job.id} style={{ minWidth: 0 }} bodyStyle={{ height: '100%' }}>
                <article className="flex h-full flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-(--semi-color-fill-0) text-(--semi-color-primary)">
                      <IconCalendarClock size="large" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="m-0 truncate text-base font-semibold" title={job.name}>
                        {job.name}
                      </h2>
                      <p className="mt-1 mb-0 text-xs text-(--semi-color-text-2)">
                        {cronjobTypeLabels[job.type] ?? job.type}
                      </p>
                    </div>
                    <StatusTag status={job.status} />
                  </div>
                  <div className="rounded-lg bg-(--semi-color-fill-0) p-3">
                    <p className="m-0 text-[11px] text-(--semi-color-text-2)">
                      执行周期 · 节点时区
                    </p>
                    <p className="mt-2 mb-0 whitespace-pre-wrap wrap-anywhere font-mono text-sm">
                      {job.spec.replaceAll('&&', '\n')}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-(--semi-color-text-2)">最近执行</span>
                      <StatusTag status={job.lastRecordStatus ?? ''} />
                    </div>
                    <span className="tabular-nums text-(--semi-color-text-2)">
                      {job.lastRecordTime ? formatTimestamp(job.lastRecordTime, true) : '尚未执行'}
                    </span>
                    <span className="text-(--semi-color-text-2)">
                      超时 {job.timeout} 秒 · 重试 {job.retryTimes} 次 · 保留 {job.retainCopies} 份
                    </span>
                  </div>
                  <div className="mt-auto flex flex-wrap gap-2 border-t border-(--semi-color-border) pt-3">
                    <Button theme="light" onClick={() => setRecords(job)}>
                      执行记录
                    </Button>
                    <Button disabled={disabled} onClick={() => setEditor({ id: job.id })}>
                      编辑
                    </Button>
                    <Button
                      disabled={disabled || running}
                      onClick={() =>
                        setOperation({
                          title: '执行一次',
                          successMessage: '任务已提交，可在执行记录中查看进度',
                          description: `立即执行「${job.name}」一次，不改变原有周期。提交后可在执行记录中查看进度。`,
                          action: (signal) => operateCronjob(node, job.id, 'run', signal),
                        })
                      }
                    >
                      执行一次
                    </Button>
                    <Button
                      theme="borderless"
                      disabled={disabled || !['Enable', 'Disable'].includes(job.status)}
                      onClick={() =>
                        setOperation({
                          title: job.status === 'Enable' ? '停用任务' : '启用任务',
                          description:
                            job.status === 'Enable'
                              ? `暂停「${job.name}」后续的自动调度，正在执行的任务不会中断。`
                              : `按设定周期恢复「${job.name}」的自动调度。`,
                          action: (signal) =>
                            operateCronjob(
                              node,
                              job.id,
                              job.status === 'Enable' ? 'disable' : 'enable',
                              signal,
                            ),
                        })
                      }
                    >
                      {job.status === 'Disable' ? '启用' : '停用'}
                    </Button>
                    <Button
                      type="danger"
                      theme="borderless"
                      disabled={disabled || running}
                      onClick={() =>
                        setOperation({
                          title: '删除计划任务',
                          description: `删除「${job.name}」的调度配置，保留本地和远程备份文件。`,
                          danger: true,
                          confirmName: job.name,
                          action: (signal) => operateCronjob(node, job.id, 'delete', signal),
                        })
                      }
                    >
                      删除
                    </Button>
                  </div>
                </article>
              </Card>
            )
          })}
        </section>
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
      {editor && (
        <CronjobFormSheet
          node={node}
          id={editor.id}
          onClose={() => setEditor(null)}
          onComplete={() => {
            setEditor(null)
            query.refresh()
          }}
        />
      )}
      {records && (
        <CronjobRecordsSheet node={node} job={records} onClose={() => setRecords(null)} />
      )}
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
