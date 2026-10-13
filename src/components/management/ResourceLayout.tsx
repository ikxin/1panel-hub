import type { ReactNode } from 'react'
import { useEffect } from 'react'
import Banner from '@douyinfe/semi-ui/lib/es/banner'
import Button from '@douyinfe/semi-ui/lib/es/button'
import Card from '@douyinfe/semi-ui/lib/es/card'
import Empty from '@douyinfe/semi-ui/lib/es/empty'
import Input from '@douyinfe/semi-ui/lib/es/input'
import Pagination from '@douyinfe/semi-ui/lib/es/pagination'
import Skeleton from '@douyinfe/semi-ui/lib/es/skeleton'
import { IconRefresh, IconSearch, IconServer } from '@douyinfe/semi-icons'
import type { NodeConfig } from '../../lib/nodes'
import type { ResourceSearch } from '../../types/management'
import { formatTimestamp } from '../../utils/formatter'

export interface ModulePageProps {
  node: NodeConfig
  onEdit: () => void
  editDisabled: boolean
}

export function ResourceToolbar({
  loading,
  onRefresh,
  actions,
  children,
}: {
  loading: boolean
  onRefresh: () => void
  actions?: ReactNode
  children?: ReactNode
}) {
  return (
    <Card bodyStyle={{ padding: 0 }} style={{ minWidth: 0 }}>
      <div className="flex flex-wrap items-center gap-3 p-4">
        {children}
        <div className="ml-auto flex flex-wrap gap-2">
          <Button icon={<IconRefresh />} loading={loading} onClick={onRefresh}>
            刷新
          </Button>
          {actions}
        </div>
      </div>
    </Card>
  )
}

export function ResourceSearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <div className="w-full min-w-0 sm:min-w-52 sm:flex-1">
      <Input
        prefix={<IconSearch />}
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onClear={() => onChange('')}
        showClear
        composition
        style={{ width: '100%' }}
      />
    </div>
  )
}

export function ResourceMetrics({
  items,
}: {
  items: { label: string; value: ReactNode; hint: string }[]
}) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} style={{ minWidth: 0 }} bodyStyle={{ padding: 16 }}>
          <p className="m-0 text-xs text-(--semi-color-text-2)">{item.label}</p>
          <p className="my-2 text-2xl font-semibold tabular-nums">{item.value ?? '—'}</p>
          <p className="m-0 text-xs text-(--semi-color-text-2)">{item.hint}</p>
        </Card>
      ))}
    </div>
  )
}

export function ResourceState({
  node,
  onEdit,
  editDisabled,
  loading,
  error,
  hasData,
  empty,
  filtered,
  onRetry,
  emptyTitle,
  emptyDescription,
  children,
}: ModulePageProps & {
  loading: boolean
  error: string
  hasData: boolean
  empty: boolean
  filtered?: boolean
  onRetry: () => void
  emptyTitle: string
  emptyDescription: string
  children: ReactNode
}) {
  if (!node.apiKey)
    return (
      <Card>
        <Empty
          image={<IconServer size="extra-large" />}
          title="请先配置节点 API"
          description="填写 1Panel v2 API Key，并在面板中启用 API 访问。"
        >
          <Button className="mt-4" theme="solid" disabled={editDisabled} onClick={onEdit}>
            编辑节点配置
          </Button>
        </Empty>
      </Card>
    )
  return (
    <>
      {error && (
        <Banner
          type="danger"
          closeIcon={null}
          description={
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="wrap-anywhere">
                {error}
                {hasData ? '。当前显示上次读取的数据，操作暂不可用。' : ''}
              </span>
              <div className="flex gap-1">
                <Button theme="borderless" onClick={onRetry}>
                  重试
                </Button>
                <Button theme="borderless" disabled={editDisabled} onClick={onEdit}>
                  节点配置
                </Button>
              </div>
            </div>
          }
        />
      )}
      {loading && !hasData ? (
        <div
          role="status"
          aria-label="正在加载资源"
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {[0, 1, 2].map((key) => (
            <Card key={key}>
              <Skeleton loading active placeholder={<Skeleton.Paragraph rows={5} />} />
            </Card>
          ))}
        </div>
      ) : !hasData ? (
        <Card>
          <Empty
            title="暂时无法读取资源"
            description="请检查节点连接、API 权限及服务状态后重试。"
          />
        </Card>
      ) : empty ? (
        <Card>
          <div className="py-10">
            <Empty
              image={<IconSearch size="extra-large" />}
              title={filtered ? '没有找到匹配的资源' : emptyTitle}
              description={filtered ? '试试其他关键词或筛选条件。' : emptyDescription}
            />
          </div>
        </Card>
      ) : (
        children
      )}
    </>
  )
}

export function ResourcePagination({
  total,
  search,
  loading,
  receivedAt,
  onPageChange,
  onPageSizeChange,
}: {
  total: number
  search: ResourceSearch
  loading: boolean
  receivedAt?: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}) {
  useEffect(() => {
    if (!loading && search.page > Math.max(1, Math.ceil(total / search.pageSize)))
      onPageChange(Math.max(1, Math.ceil(total / search.pageSize)))
  }, [total, search.page, search.pageSize, loading, onPageChange])
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-(--semi-color-text-2)" role="status">
          共 {total} 项{receivedAt ? ` · 更新于 ${formatTimestamp(receivedAt)}` : ''}
        </span>
        <Pagination
          total={total}
          currentPage={search.page}
          pageSize={search.pageSize}
          pageSizeOpts={[12, 24, 48]}
          showSizeChanger
          preventPageChangeOnPageSizeChange
          disabled={loading}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          className="flex-wrap gap-y-2"
        />
      </div>
    </Card>
  )
}
