import type { ComponentProps } from 'react'
import Collapse from '@douyinfe/semi-ui/lib/es/collapse'
import Empty from '@douyinfe/semi-ui/lib/es/empty'
import MarkdownRender from '@douyinfe/semi-ui/lib/es/markdownRender'
import Toast from '@douyinfe/semi-ui/lib/es/toast'
import Typography from '@douyinfe/semi-ui/lib/es/typography'
import { errorMessage, openExternal } from '../../lib/panel'
import { safeAppUrl } from '../../utils/appstore'

function DocumentationLink({ href, children }: ComponentProps<'a'>) {
  const url = safeAppUrl(href || '')
  return url ? (
    <Typography.Text
      link={{
        href: url,
        onClick: (event) => {
          event.preventDefault()
          void openExternal(url).catch((error) => Toast.error(errorMessage(error)))
        },
      }}
    >
      {children}
    </Typography.Text>
  ) : (
    <span>{children}</span>
  )
}

const markdownComponents = {
  a: DocumentationLink,
  img: ({ src, alt }: ComponentProps<'img'>) => {
    const url = safeAppUrl(typeof src === 'string' ? src : '')
    return url ? (
      <img
        src={url}
        alt={alt || ''}
        loading="lazy"
        referrerPolicy="no-referrer"
        className="h-auto max-w-full"
      />
    ) : null
  },
}

export function AppReadme({ readMe, dockerCompose }: { readMe?: string; dockerCompose: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-6">
      {readMe ? (
        <MarkdownRender
          raw={readMe}
          format="md"
          components={markdownComponents}
          className="min-w-0 wrap-anywhere [&_.semi-table-container]:overflow-x-auto [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_table]:max-w-full"
        />
      ) : (
        <div className="py-8">
          <Empty title="暂无详细说明" description="可访问应用官网了解更多信息。" />
        </div>
      )}
      {dockerCompose && (
        <Collapse>
          <Collapse.Panel itemKey="compose" header="查看部署配置">
            <pre className="m-0 max-w-full overflow-x-auto">{dockerCompose}</pre>
          </Collapse.Panel>
        </Collapse>
      )}
    </div>
  )
}
