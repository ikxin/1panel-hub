import {
  IconApps,
  IconCalendarClockStroked,
  IconGlobeStroked,
  IconLayers,
} from '@douyinfe/semi-icons'
import type { BaseInfo } from '../../types/dashboard'
import { formatMetric } from '../../utils/formatter'

export function OverviewCounts({ data }: { data: BaseInfo }) {
  const counts = [
    { label: '网站', value: data.websiteNumber, icon: <IconGlobeStroked /> },
    { label: '数据库', value: data.databaseNumber, icon: <IconLayers /> },
    {
      label: '计划任务',
      value: data.cronjobNumber,
      icon: <IconCalendarClockStroked />,
    },
    { label: '已安装应用', value: data.appInstalledNumber, icon: <IconApps /> },
  ]

  return (
    <section aria-label="服务概览" className="min-w-0">
      <h2 className="sr-only">服务概览</h2>
      <dl className="m-0 grid grid-cols-2 gap-x-6 gap-y-3 sm:flex sm:flex-wrap sm:gap-y-2">
        {counts.map(({ label, value, icon }) => (
          <div key={label} className="flex min-w-0 items-center gap-2.5">
            <dt className="flex min-w-0 items-center gap-1.5 text-xs text-(--semi-color-text-2)">
              <span className="inline-flex shrink-0">{icon}</span>
              <span className="truncate" title={label}>
                {label}
              </span>
            </dt>
            <dd className="m-0 shrink-0 text-base font-semibold leading-6 tabular-nums">
              {formatMetric(value, 0)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
