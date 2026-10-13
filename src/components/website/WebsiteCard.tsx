import Button from '@douyinfe/semi-ui/lib/es/button'
import Card from '@douyinfe/semi-ui/lib/es/card'
import Tag from '@douyinfe/semi-ui/lib/es/tag'
import Toast from '@douyinfe/semi-ui/lib/es/toast'
import { IconExternalOpen, IconGlobe } from '@douyinfe/semi-icons'
import { errorMessage, openExternal } from '../../lib/panel'
import type { Website } from '../../types/website'
import { certificateExpiry, websiteStatus, websiteTypeLabel, websiteUrl } from '../../utils/website'

export function WebsiteCard({
  website,
  disabled,
  onDetail,
  onHttps,
  onOperate,
  onDelete,
}: {
  website: Website
  disabled: boolean
  onDetail: () => void
  onHttps: () => void
  onOperate: () => void
  onDelete: () => void
}) {
  const state = websiteStatus(website.status)
  const url = websiteUrl(website)
  return (
    <Card style={{ minWidth: 0 }} bodyStyle={{ height: '100%' }}>
      <article className="flex h-full min-w-0 flex-col gap-4">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-(--semi-color-fill-0) text-(--semi-color-primary)">
            <IconGlobe size="large" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="m-0 truncate text-base font-semibold" title={website.primaryDomain}>
              {website.primaryDomain}
            </h2>
            <p className="mt-1 mb-0 text-xs text-(--semi-color-text-2)">
              {websiteTypeLabel(website.type)} · {website.alias}
            </p>
          </div>
          <Tag color={state.color}>{state.label}</Tag>
        </div>
        <div className="grid grid-cols-2 gap-3 rounded-lg bg-(--semi-color-fill-0) p-3 text-xs">
          <div>
            <span className="text-(--semi-color-text-2)">访问协议</span>
            <p className="mb-0 font-medium">{website.protocol.toUpperCase()}</p>
          </div>
          <div>
            <span className="text-(--semi-color-text-2)">证书状态</span>
            <p className="mb-0 font-medium">{certificateExpiry(website.sslExpireDate)}</p>
          </div>
        </div>
        <p
          className="m-0 truncate text-xs text-(--semi-color-text-2)"
          title={website.sitePath || website.remark}
        >
          {website.remark ||
            website.sitePath ||
            website.appName ||
            website.runtimeName ||
            '暂无备注'}
        </p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-(--semi-color-border) pt-3">
          <div className="flex flex-wrap gap-1">
            <Button theme="light" onClick={onDetail}>
              管理
            </Button>
            {website.type !== 'stream' && (
              <Button theme="borderless" disabled={disabled} onClick={onHttps}>
                HTTPS
              </Button>
            )}
            {url && (
              <Button
                theme="borderless"
                icon={<IconExternalOpen />}
                aria-label={`访问 ${website.primaryDomain}`}
                onClick={() =>
                  void openExternal(url).catch((error) => Toast.error(errorMessage(error)))
                }
              />
            )}
          </div>
          <div className="flex gap-1">
            <Button
              theme="borderless"
              disabled={disabled || !['Running', 'Stopped'].includes(website.status)}
              onClick={onOperate}
            >
              {website.status === 'Running' ? '停止' : '启动'}
            </Button>
            <Button type="danger" theme="borderless" disabled={disabled} onClick={onDelete}>
              删除
            </Button>
          </div>
        </div>
      </article>
    </Card>
  )
}
