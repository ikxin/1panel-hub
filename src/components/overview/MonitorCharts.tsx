import { memo, useMemo, useState } from 'react'
import Card from '@douyinfe/semi-ui/lib/es/card'
import Empty from '@douyinfe/semi-ui/lib/es/empty'
import { IconLineChartStroked } from '@douyinfe/semi-icons'
import { VChart } from '@visactor/react-vchart'
import {
  buildMonitorSpec,
  formatChartValue,
  hasMonitorData,
  MONITOR_SERIES,
} from '../../lib/charts'
import type { NodeStatus } from '../../lib/status'
import type { MonitorKind, MonitorSample } from '../../types/monitor'
import { formatBytes, formatMetric } from '../../utils/formatter'

const emptyHistory: MonitorSample[] = []
const chartOptions = { autoFit: true, animation: false }
const chartTitles: Record<MonitorKind, string> = {
  usage: 'CPU 与内存',
  load: '平均负载',
  network: '网络流量',
  io: '磁盘 I/O',
}

function MonitorChart({
  kind,
  history,
  footer,
}: {
  kind: MonitorKind
  history: MonitorSample[]
  footer: string
}) {
  const spec = useMemo(() => buildMonitorSpec(kind, history), [kind, history])
  const [chartError, setChartError] = useState(false)
  const ready = hasMonitorData(kind, history)
  const latest = history.at(-1)

  return (
    <Card
      title={<h3 className="m-0 text-sm font-semibold">{chartTitles[kind]}</h3>}
      headerExtraContent={
        <span className="text-[11px] text-(--semi-color-text-2)">最近 5 分钟</span>
      }
      bodyStyle={{ padding: '12px 16px 16px' }}
      style={{ minWidth: 0, borderRadius: 'var(--semi-border-radius-medium)' }}
    >
      <div className={`grid gap-2 ${kind === 'load' ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {MONITOR_SERIES[kind].map(({ field, label, color }) => (
          <div key={field} className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] text-(--semi-color-text-2)">
              <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
              {label}
            </div>
            <div
              className="mt-1 truncate text-sm font-semibold tabular-nums"
              title={formatChartValue(kind, latest?.[field])}
            >
              {formatChartValue(kind, latest?.[field])}
            </div>
          </div>
        ))}
      </div>
      <div
        className="mt-2 h-44 min-w-0"
        role="img"
        aria-label={`${chartTitles[kind]}最近 5 分钟趋势；${MONITOR_SERIES[kind]
          .map(({ field, label }) => `${label}当前 ${formatChartValue(kind, latest?.[field])}`)
          .join('，')}`}
      >
        {ready && !chartError ? (
          <VChart
            spec={spec}
            options={chartOptions}
            style={{ width: '100%', height: '100%' }}
            onError={() => setChartError(true)}
          />
        ) : (
          <Empty
            image={<IconLineChartStroked size="extra-large" />}
            description={chartError ? '图表暂时不可用，当前数值仍可查看' : '正在采集趋势数据'}
            style={{ height: '100%', justifyContent: 'center' }}
          />
        )}
      </div>
      <p className="mt-3 mb-0 text-[11px] leading-5 text-(--semi-color-text-2)">{footer}</p>
    </Card>
  )
}

export const MonitorCharts = memo(function MonitorCharts({ status }: { status: NodeStatus }) {
  const current = status.data?.currentInfo
  const history = status.history ?? emptyHistory
  const footers: Record<MonitorKind, string> = {
    usage: `可用内存 ${formatBytes(current?.memoryAvailable)} · 进程 ${formatMetric(current?.procs, 0)}`,
    load: '1 / 5 / 15 分钟均值，数值为运行或等待运行的任务数',
    network: `累计上传 ${formatBytes(current?.netBytesSent)} · 累计下载 ${formatBytes(current?.netBytesRecv)}`,
    io: `读写次数 ${formatMetric(status.ioCountSpeed, 0)} 次/s · I/O 耗时 ${formatMetric(status.ioTimeSpeed, 0)} ms/s`,
  }

  return (
    <section aria-label="实时监控" className="min-w-0">
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
        {(Object.keys(chartTitles) as MonitorKind[]).map((kind) => (
          <MonitorChart key={kind} kind={kind} history={history} footer={footers[kind]} />
        ))}
      </div>
    </section>
  )
})
