import { useNavigate } from 'react-router'
import Button from '@douyinfe/semi-ui/lib/es/button'
import Empty from '@douyinfe/semi-ui/lib/es/empty'
import { IconSearch } from '@douyinfe/semi-icons'

export function NotFoundPage({ homePath = '/' }: { homePath?: string }) {
  const navigate = useNavigate()

  return (
    <div className="px-2 py-12 sm:py-20">
      <Empty
        image={<IconSearch size="extra-large" />}
        title="页面不存在"
        description="请检查页面地址，或通过导航菜单打开其他页面。"
      >
        <Button
          className="mt-5"
          theme="solid"
          onClick={() => navigate(homePath, { replace: true })}
        >
          {homePath === '/' ? '返回首页' : '返回概览'}
        </Button>
      </Empty>
    </div>
  )
}
