import Button from '@douyinfe/semi-ui/lib/es/button'
import Card from '@douyinfe/semi-ui/lib/es/card'
import Tag from '@douyinfe/semi-ui/lib/es/tag'
import { IconArrowRight, IconDownload } from '@douyinfe/semi-icons'
import type { NodeConfig } from '../../lib/nodes'
import type { CatalogApp } from '../../types/appstore'
import { AppIcon } from './AppIcon'

export function AppCatalogCard({
  node,
  app,
  onDetail,
  onInstall,
}: {
  node: NodeConfig
  app: CatalogApp
  onDetail: () => void
  onInstall: () => void
}) {
  return (
    <Card className="h-full" bodyStyle={{ height: '100%' }} style={{ minWidth: 0 }}>
      <article aria-label={app.name} className="flex h-full min-w-0 flex-col gap-4">
        <div className="flex items-start gap-3">
          <AppIcon node={node} appKey={app.key} name={app.name} />
          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={onDetail}
              className="max-w-full cursor-pointer truncate border-0 bg-transparent p-0 text-left font-sans text-base font-semibold text-(--semi-color-text-0) hover:text-(--semi-color-primary) focus-visible:outline-2 focus-visible:outline-(--semi-color-primary)"
            >
              {app.name}
            </button>
            <p className="mt-1 mb-0 truncate font-mono text-[11px] text-(--semi-color-text-2)">
              {app.key}
            </p>
          </div>
          {app.installed ? <Tag color="green">已安装</Tag> : null}
        </div>
        <p
          title={app.description}
          className="m-0 line-clamp-2 min-h-10 text-sm leading-5 text-(--semi-color-text-2)"
        >
          {app.description || '暂无应用简介'}
        </p>
        <div className="flex min-h-5 flex-wrap gap-1.5">
          {app.tags.slice(0, 3).map((tag) => (
            <Tag key={tag} color="grey">
              {tag}
            </Tag>
          ))}
          {app.gpuSupport && <Tag color="purple">GPU</Tag>}
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-(--semi-color-border) pt-3">
          <Button
            theme="borderless"
            type="tertiary"
            icon={<IconArrowRight />}
            iconPosition="right"
            onClick={onDetail}
          >
            查看详情
          </Button>
          <Button
            theme="light"
            icon={<IconDownload />}
            onClick={onInstall}
            disabled={app.status === 'TakeDown' || (app.installed && app.limit === 1)}
          >
            安装
          </Button>
        </div>
      </article>
    </Card>
  )
}
