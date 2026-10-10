import Card from '@douyinfe/semi-ui/lib/es/card'
import Empty from '@douyinfe/semi-ui/lib/es/empty'
import Progress from '@douyinfe/semi-ui/lib/es/progress'
import { IconServerStroked } from '@douyinfe/semi-icons'
import { resourceTone } from '../../lib/monitor'
import type { DiskInfo } from '../../types/dashboard'
import { formatBytes, formatPercent } from '../../utils/formatter'

export function DiskUsage({ disks }: { disks: DiskInfo[] | null }) {
  return (
    <Card
      title={<h2 className="m-0 text-base font-semibold">磁盘空间</h2>}
      headerExtraContent={
        <span className="text-xs text-(--semi-color-text-2)">{disks?.length ?? 0} 个挂载点</span>
      }
      bodyStyle={{ padding: 16 }}
      style={{ minWidth: 0, borderRadius: 'var(--semi-border-radius-medium)' }}
    >
      {disks?.length ? (
        <div className="max-h-120 space-y-5 overflow-y-auto">
          {disks.map((disk, index) => {
            const valid = Number.isFinite(disk.usedPercent) && disk.usedPercent >= 0
            const tone = resourceTone(disk.usedPercent)
            const isRoot = disk.path === '/'
            const diskName = isRoot ? '根目录' : disk.path || '未命名挂载点'
            const mountPoint = isRoot ? '挂载点 /' : `挂载点 ${disk.path || '—'}`

            return (
              <div
                key={`${disk.device}:${disk.path}`}
                className={`min-w-0 ${index > 0 ? 'border-t border-(--semi-color-border) pt-5' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="flex size-10 shrink-0 items-center justify-center rounded-(--semi-border-radius-medium)"
                      style={{
                        backgroundColor: `var(--semi-color-${tone}-light-default)`,
                        color: `var(--semi-color-${tone})`,
                      }}
                    >
                      <IconServerStroked size="large" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="m-0 truncate text-sm font-semibold" title={diskName}>
                        {diskName}
                      </h3>
                      <p
                        className="mt-1 mb-0 truncate text-[11px] text-(--semi-color-text-2)"
                        title={mountPoint}
                      >
                        {mountPoint}
                      </p>
                    </div>
                  </div>
                  <span
                    className="shrink-0 text-right text-lg font-semibold leading-6 tabular-nums"
                    style={{ color: `var(--semi-color-${tone})` }}
                  >
                    <span className="block">{formatPercent(disk.usedPercent)}</span>
                    <span className="mt-0.5 block text-[11px] font-normal text-(--semi-color-text-2)">
                      空间已使用
                    </span>
                  </span>
                </div>

                <Progress
                  className="mt-4"
                  percent={valid ? Math.min(disk.usedPercent, 100) : 0}
                  stroke={`var(--semi-color-${tone})`}
                  orbitStroke="var(--semi-color-fill-1)"
                  showInfo={false}
                  motion={false}
                  size="large"
                  strokeLinecap="round"
                  aria-label={`${diskName}磁盘使用率`}
                  aria-valuetext={valid ? formatPercent(disk.usedPercent) : '暂无数据'}
                />

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="min-w-0">
                    <span className="block text-[11px] text-(--semi-color-text-2)">已用空间</span>
                    <div className="mt-1 flex flex-wrap items-baseline gap-x-1 tabular-nums">
                      <span className="text-sm font-semibold">{formatBytes(disk.used)}</span>
                      <span className="text-[11px] text-(--semi-color-text-2)">
                        / {formatBytes(disk.total)}
                      </span>
                    </div>
                  </div>
                  <div className="min-w-0 text-right">
                    <span className="block text-[11px] text-(--semi-color-text-2)">可用空间</span>
                    <span className="mt-1 block truncate text-sm font-semibold tabular-nums">
                      {formatBytes(disk.free)}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-(--semi-color-border) pt-3 text-[11px] text-(--semi-color-text-2)">
                  <span className="min-w-0 truncate" title={disk.device}>
                    设备 {disk.device || '—'}
                  </span>
                  <span className="shrink-0">文件系统 {disk.type || '—'}</span>
                  <span className="shrink-0 tabular-nums">
                    Inode {disk.inodesTotal > 0 ? formatPercent(disk.inodesUsedPercent) : '—'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <Empty description="暂无磁盘数据" image={<IconServerStroked size="extra-large" />} />
      )}
    </Card>
  )
}
