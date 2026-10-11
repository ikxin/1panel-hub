import Button from '@douyinfe/semi-ui/lib/es/button'
import Select from '@douyinfe/semi-ui/lib/es/select'
import Tag from '@douyinfe/semi-ui/lib/es/tag'
import Toast from '@douyinfe/semi-ui/lib/es/toast'
import Typography from '@douyinfe/semi-ui/lib/es/typography'
import { IconExternalOpen } from '@douyinfe/semi-icons'
import type { NodeConfig } from '../../lib/nodes'
import { errorMessage, openExternal } from '../../lib/panel'
import type { AppDetail, AppInfo } from '../../types/appstore'
import { safeAppUrl } from '../../utils/appstore'
import { AppIcon } from './AppIcon'

export function AppDetailOverview({
  node,
  appKey,
  info,
  detail,
  version,
  disabled,
  onVersionChange,
}: {
  node: NodeConfig
  appKey: string
  info?: AppInfo
  detail?: AppDetail
  version: string
  disabled: boolean
  onVersionChange: (version: string) => void
}) {
  const architectures = Array.from(
    new Set((detail?.architectures || info?.architectures || '').split(/[,\s]+/).filter(Boolean)),
  )
  const links = [
    { label: '官方网站', href: info?.website },
    { label: '使用文档', href: info?.document },
    { label: '源码仓库', href: info?.github },
  ].flatMap(({ label, href }) => {
    const url = safeAppUrl(href || '')
    return url ? [{ label, url }] : []
  })

  return (
    <section aria-label="应用概要" className="flex min-w-0 flex-col gap-4 p-4 sm:px-6 sm:py-5">
      <div className="flex items-start gap-3">
        <AppIcon node={node} appKey={appKey} name={info?.name || appKey} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Typography.Title heading={4} className="wrap-anywhere">
              {info?.name || appKey}
            </Typography.Title>
            {info?.installed && <Tag color="green">已安装</Tag>}
          </div>
          <Typography.Text type="tertiary" className="wrap-anywhere">
            {appKey}
          </Typography.Text>
        </div>
      </div>
      <Typography.Paragraph type="secondary" className="wrap-anywhere">
        {info?.description || info?.shortDescZh || info?.shortDescEn || '查看应用信息与安装配置'}
      </Typography.Paragraph>
      {(architectures.length > 0 || links.length > 0) && (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="flex flex-wrap gap-1.5">
            {architectures.map((architecture) => (
              <Tag key={architecture} color="grey">
                {architecture}
              </Tag>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {links.map(({ label, url }) => (
              <Button
                key={label}
                theme="borderless"
                type="tertiary"
                icon={<IconExternalOpen />}
                onClick={() =>
                  void openExternal(url).catch((error) => Toast.error(errorMessage(error)))
                }
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      )}
      {info && info.versions.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex min-w-0 flex-1 basis-full items-center gap-3 sm:basis-auto">
            <label htmlFor="app-version" className="shrink-0">
              <Typography.Text>应用版本</Typography.Text>
            </label>
            <Select
              id="app-version"
              aria-label="应用版本"
              value={version}
              disabled={disabled}
              onChange={(value) => onVersionChange(String(value))}
              optionList={info.versions.map((value) => ({ label: value, value }))}
              style={{ width: '100%', minWidth: 0, maxWidth: 240 }}
            />
          </div>
          {detail && detail.memoryRequired > 0 && (
            <Typography.Text type="tertiary">
              建议可用内存 {detail.memoryRequired} MB
            </Typography.Text>
          )}
        </div>
      )}
    </section>
  )
}
