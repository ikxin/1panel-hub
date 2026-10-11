import Card from '@douyinfe/semi-ui/lib/es/card'
import Pagination from '@douyinfe/semi-ui/lib/es/pagination'
import Typography from '@douyinfe/semi-ui/lib/es/typography'
import type { AppStoreTab } from '../../types/appstore'

const pageSizeOptions = [12, 24, 48]

export function AppStorePagination({
  tab,
  total,
  currentPage,
  pageSize,
  pending,
  onPageChange,
  onPageSizeChange,
}: {
  tab: AppStoreTab
  total: number
  currentPage: number
  pageSize: number
  pending: boolean
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}) {
  const first = Math.min((currentPage - 1) * pageSize + 1, total)
  const last = Math.min(currentPage * pageSize, total)
  return (
    <Card>
      <nav
        aria-label={tab === 'catalog' ? '应用目录分页' : '已安装应用分页'}
        className="flex min-w-0 flex-wrap items-center justify-between gap-4"
      >
        <Typography.Text type="tertiary" role="status" aria-live="polite">
          {pending
            ? '正在加载应用…'
            : `显示 ${first}–${last} 条，共 ${total} ${tab === 'catalog' ? '款应用' : '个实例'}`}
        </Typography.Text>
        <Pagination
          total={total}
          currentPage={currentPage}
          pageSize={pageSize}
          pageSizeOpts={pageSizeOptions}
          disabled={pending}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          preventPageChangeOnPageSizeChange
          showSizeChanger
          showQuickJumper
          className="flex-wrap gap-y-3"
        />
      </nav>
    </Card>
  )
}
