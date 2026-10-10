import Progress from '@douyinfe/semi-ui/lib/es/progress'
import { resourceTone } from '../../lib/monitor'
import type { BaseInfo } from '../../types/dashboard'
import { computeSizePair, formatMetric, formatPercent } from '../../utils/formatter'

export function ResourceStatus({ data }: { data: BaseInfo }) {
  const current = data.currentInfo
  const disk = current.diskData?.find((item) => item.path === '/') ?? current.diskData?.[0]
  const resources = [
    {
      label: 'CPU',
      value: current.cpuUsedPercent,
      detail: `${formatMetric(current.cpuUsed, 2)} / ${formatMetric(current.cpuTotal, 0)} 核`,
    },
    {
      label: '内存',
      value: current.memoryUsedPercent,
      detail: computeSizePair(current.memoryUsed, current.memoryTotal),
    },
    {
      label: '系统负载',
      value: current.loadUsagePercent,
      detail: [current.load1, current.load5, current.load15]
        .map((value) => formatMetric(value, 2))
        .join(' / '),
    },
    {
      label: '磁盘',
      value: disk?.usedPercent,
      detail: computeSizePair(disk?.used, disk?.total),
    },
  ]

  return (
    <section aria-label="系统状态" className="min-w-0">
      <h2 className="sr-only">系统状态</h2>
      <div className="grid grid-cols-2 gap-x-8 gap-y-6 xl:grid-cols-4">
        {resources.map(({ label, value, detail }, index) => {
          const valid = value !== undefined && Number.isFinite(value) && value >= 0
          const tone = resourceTone(value)
          return (
            <div key={label} className="relative min-w-0" aria-label={`${label}状态`}>
              {index > 0 && (
                <span
                  aria-hidden="true"
                  className={`absolute inset-y-0 -left-4 w-px bg-(--semi-color-border) ${index === 2 ? 'hidden xl:block' : ''}`}
                />
              )}
              <h3 className="m-0 text-sm font-medium text-(--semi-color-text-1)">{label}</h3>
              <div className="mt-2 flex items-baseline gap-1.5 tabular-nums">
                <span
                  className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl"
                  style={{
                    color: valid
                      ? `var(--semi-color-${tone === 'primary' ? 'text-0' : tone})`
                      : 'var(--semi-color-text-2)',
                  }}
                >
                  {formatMetric(value)}
                </span>
                {valid && <span className="text-sm text-(--semi-color-text-2)">%</span>}
              </div>
              <Progress
                className="mt-3"
                percent={valid ? Math.min(value, 100) : 0}
                size="small"
                stroke={`var(--semi-color-${tone})`}
                orbitStroke="var(--semi-color-fill-2)"
                showInfo={false}
                motion={false}
                aria-label={`${label}使用率`}
                aria-valuetext={formatPercent(value)}
              />
              <div className="mt-3 wrap-anywhere text-xs leading-5 text-(--semi-color-text-1) tabular-nums">
                {detail}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
