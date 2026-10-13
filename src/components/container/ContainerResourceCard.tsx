import Button from '@douyinfe/semi-ui/lib/es/button'
import Card from '@douyinfe/semi-ui/lib/es/card'
import Progress from '@douyinfe/semi-ui/lib/es/progress'
import Tag from '@douyinfe/semi-ui/lib/es/tag'
import { IconBox, IconFolder, IconGlobe } from '@douyinfe/semi-icons'
import type { ContainerOperation, ContainerResource, ContainerStats } from '../../types/container'
import { containerStatus, resourceName } from '../../utils/container'
import { formatBytes, formatPercent, formatTimestamp } from '../../utils/formatter'

export function ContainerResourceCard({
  resource,
  stats,
  disabled,
  onInspect,
  onDelete,
  onOperate,
}: {
  resource: ContainerResource
  stats?: ContainerStats
  disabled: boolean
  onInspect: () => void
  onDelete: () => void
  onOperate: (operation: ContainerOperation) => void
}) {
  const name = resourceName(resource)
  const container = resource.kind === 'container' ? resource.data : undefined
  const status = container ? containerStatus(container.state) : undefined
  const managed = Boolean(container?.isFromApp || container?.isFromCompose)
  const stable = container && ['running', 'exited', 'created', 'paused'].includes(container.state)
  const canDelete =
    !disabled &&
    (container
      ? ['exited', 'created', 'dead'].includes(container.state) && !managed
      : resource.kind === 'image'
        ? !resource.data.isUsed
        : resource.kind === 'network'
          ? !['bridge', 'host', 'none', 'ingress', 'docker_gwbridge'].includes(name)
          : true)
  return (
    <Card style={{ minWidth: 0 }} bodyStyle={{ height: '100%' }}>
      <article className="flex h-full min-w-0 flex-col gap-4">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-(--semi-color-fill-0) text-(--semi-color-primary)">
            {resource.kind === 'network' ? (
              <IconGlobe size="large" />
            ) : resource.kind === 'volume' ? (
              <IconFolder size="large" />
            ) : (
              <IconBox size="large" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="m-0 truncate text-base font-semibold" title={name}>
              {name}
            </h2>
            <p
              className="mt-1 mb-0 truncate text-xs text-(--semi-color-text-2)"
              title={container?.imageName}
            >
              {container?.imageName ||
                (resource.kind === 'image'
                  ? resource.data.id.slice(0, 19)
                  : resource.kind !== 'container'
                    ? resource.data.driver
                    : '')}
            </p>
          </div>
          {status ? (
            <Tag color={status.color}>{status.label}</Tag>
          ) : resource.kind === 'image' ? (
            <Tag color={resource.data.isUsed ? 'green' : 'grey'}>
              {resource.data.isUsed ? '使用中' : '未使用'}
            </Tag>
          ) : null}
        </div>
        {container ? (
          <>
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-(--semi-color-fill-0) p-3 text-xs">
              <div>
                <div className="mb-2 flex justify-between gap-2">
                  <span className="text-(--semi-color-text-2)">CPU</span>
                  <span className="tabular-nums">{formatPercent(stats?.cpuPercent)}</span>
                </div>
                <Progress
                  percent={Math.min(100, Math.max(0, stats?.cpuPercent ?? 0))}
                  showInfo={false}
                  size="small"
                />
              </div>
              <div>
                <div className="mb-2 flex justify-between gap-2">
                  <span className="text-(--semi-color-text-2)">内存</span>
                  <span className="tabular-nums">{formatBytes(stats?.memoryUsage)}</span>
                </div>
                <Progress
                  percent={Math.min(100, Math.max(0, stats?.memoryPercent ?? 0))}
                  showInfo={false}
                  size="small"
                />
              </div>
            </div>
            <div className="space-y-2 text-xs text-(--semi-color-text-2)">
              <p className="m-0 wrap-anywhere">
                端口：{container.ports.join(' · ') || '未发布端口'}
              </p>
              <p className="m-0 wrap-anywhere">网络：{container.network.join('、') || '—'}</p>
              {managed && <Tag>{container.isFromApp ? '应用商店管理' : 'Compose 管理'}</Tag>}
            </div>
          </>
        ) : (
          <dl className="m-0 space-y-3 rounded-lg bg-(--semi-color-fill-0) p-3 text-xs">
            {resource.kind === 'image' && (
              <>
                <div>
                  <dt className="text-(--semi-color-text-2)">镜像大小</dt>
                  <dd className="mx-0 mt-1">{formatBytes(resource.data.size)}</dd>
                </div>
                <div>
                  <dt className="text-(--semi-color-text-2)">标签</dt>
                  <dd className="mx-0 mt-1 wrap-anywhere">
                    {resource.data.tags.join(' · ') || '无标签'}
                  </dd>
                </div>
              </>
            )}
            {resource.kind === 'network' && (
              <>
                <div>
                  <dt className="text-(--semi-color-text-2)">子网</dt>
                  <dd className="mx-0 mt-1 break-all">{resource.data.subnet || '自动分配'}</dd>
                </div>
                <div>
                  <dt className="text-(--semi-color-text-2)">网关</dt>
                  <dd className="mx-0 mt-1">{resource.data.gateway || '—'}</dd>
                </div>
              </>
            )}
            {resource.kind === 'volume' && (
              <div>
                <dt className="text-(--semi-color-text-2)">挂载目录</dt>
                <dd className="mx-0 mt-1 break-all">{resource.data.mountpoint}</dd>
              </div>
            )}
            {resource.kind !== 'container' && (
              <div>
                <dt className="text-(--semi-color-text-2)">创建时间</dt>
                <dd className="mx-0 mt-1">{formatTimestamp(resource.data.createdAt, true)}</dd>
              </div>
            )}
          </dl>
        )}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-(--semi-color-border) pt-3">
          <div className="flex flex-wrap gap-1">
            <Button theme="light" onClick={onInspect}>
              详情
            </Button>
            {container && (
              <>
                <Button
                  theme="borderless"
                  disabled={disabled || !stable}
                  onClick={() =>
                    onOperate(
                      container.state === 'paused'
                        ? 'unpause'
                        : container.state === 'running'
                          ? 'stop'
                          : 'start',
                    )
                  }
                >
                  {container.state === 'paused'
                    ? '恢复'
                    : container.state === 'running'
                      ? '停止'
                      : '启动'}
                </Button>
                <Button
                  theme="borderless"
                  disabled={disabled || !stable || container.state === 'paused'}
                  onClick={() => onOperate('restart')}
                >
                  重启
                </Button>
                {container.state === 'running' && (
                  <Button theme="borderless" disabled={disabled} onClick={() => onOperate('pause')}>
                    暂停
                  </Button>
                )}
              </>
            )}
          </div>
          <Button
            type="danger"
            theme="borderless"
            disabled={!canDelete}
            title={
              managed
                ? '请从所属应用或 Compose 项目管理此容器'
                : container && !canDelete
                  ? '停止容器后可删除'
                  : undefined
            }
            onClick={onDelete}
          >
            删除
          </Button>
        </div>
      </article>
    </Card>
  )
}
