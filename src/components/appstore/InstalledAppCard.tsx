import Button from '@douyinfe/semi-ui/lib/es/button'
import Card from '@douyinfe/semi-ui/lib/es/card'
import Tag from '@douyinfe/semi-ui/lib/es/tag'
import Toast from '@douyinfe/semi-ui/lib/es/toast'
import { IconArrowUp, IconDelete, IconExternalOpen, IconRefresh } from '@douyinfe/semi-icons'
import type { NodeConfig } from '../../lib/nodes'
import { errorMessage, openExternal } from '../../lib/panel'
import type { AppOperation, InstalledApp } from '../../types/appstore'
import { appStatus, installedAppUrl } from '../../utils/appstore'
import { AppIcon } from './AppIcon'

export function InstalledAppCard({
  node,
  app,
  onOperation,
  onDetail,
  disabled,
}: {
  node: NodeConfig
  app: InstalledApp
  onOperation: (operation: AppOperation) => void
  onDetail: () => void
  disabled: boolean
}) {
  const state = appStatus(app.status)
  const running = app.status === 'Running'
  const busy = Boolean(state.busy) || disabled
  const url = installedAppUrl(node, app)
  return (
    <Card bodyStyle={{ height: '100%' }} style={{ minWidth: 0 }}>
      <article aria-label={`已安装应用 ${app.name}`} className="flex h-full min-w-0 flex-col gap-4">
        <div className="flex items-start gap-3">
          <AppIcon node={node} appKey={app.appKey} name={app.appName} />
          <div className="min-w-0 flex-1">
            <h3 className="m-0 truncate text-base font-semibold" title={app.name}>
              {app.name}
            </h3>
            <p
              className="mt-1 mb-0 truncate text-xs text-(--semi-color-text-2)"
              title={`${app.appName} · ${app.version}`}
            >
              {app.appName} · {app.version}
            </p>
          </div>
          <Tag color={state.color}>{state.label}</Tag>
        </div>
        <dl className="m-0 grid grid-cols-2 gap-3 rounded-(--semi-border-radius-medium) bg-(--semi-color-fill-0) p-3 text-xs">
          <div>
            <dt className="text-(--semi-color-text-2)">容器就绪</dt>
            <dd className="mx-0 mt-1.5 mb-0 font-medium tabular-nums">
              {app.ready} / {app.total}
            </dd>
          </div>
          <div>
            <dt className="text-(--semi-color-text-2)">服务端口</dt>
            <dd className="mx-0 mt-1.5 mb-0 font-medium tabular-nums">
              {[app.httpPort, app.httpsPort].filter(Boolean).join(' / ') || '—'}
            </dd>
          </div>
        </dl>
        {app.message && (
          <details className="rounded-(--semi-border-radius-medium) bg-(--semi-color-warning-light-default) px-3 py-2 text-xs text-(--semi-color-warning)">
            <summary className="cursor-pointer">查看状态信息</summary>
            <p className="mb-0 whitespace-pre-wrap wrap-anywhere">{app.message}</p>
          </details>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <Button theme="borderless" type="tertiary" onClick={onDetail}>
            应用详情
          </Button>
          {url && (
            <Button
              theme="borderless"
              icon={<IconExternalOpen />}
              disabled={!running}
              onClick={() =>
                void openExternal(url).catch((error) => Toast.error(errorMessage(error)))
              }
            >
              打开应用
            </Button>
          )}
          {app.canUpdate && (
            <Button
              theme="light"
              icon={<IconArrowUp />}
              disabled={
                busy || (!running && app.status !== 'UpgradeErr') || app.appStatus === 'TakeDown'
              }
              onClick={() => onOperation('upgrade')}
            >
              可升级
            </Button>
          )}
        </div>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-(--semi-color-border) pt-3">
          <div className="flex items-center gap-2">
            <Button
              theme="light"
              type={running ? 'tertiary' : 'primary'}
              disabled={busy}
              onClick={() => onOperation(running ? 'stop' : 'start')}
            >
              {running ? '停止' : '启动'}
            </Button>
            <Button
              theme="borderless"
              type="tertiary"
              icon={<IconRefresh />}
              disabled={busy}
              onClick={() => onOperation('restart')}
            >
              重启
            </Button>
          </div>
          <Button
            theme="borderless"
            type="danger"
            icon={<IconDelete />}
            disabled={busy}
            onClick={() => onOperation('delete')}
          >
            卸载
          </Button>
        </div>
      </article>
    </Card>
  )
}
