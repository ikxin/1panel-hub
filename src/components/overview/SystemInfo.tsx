import Card from '@douyinfe/semi-ui/lib/es/card'
import Descriptions from '@douyinfe/semi-ui/lib/es/descriptions'
import type { BaseInfo } from '../../types/dashboard'
import { formatMetric, formatTimestamp, formatUptime } from '../../utils/formatter'

export function SystemInfo({ data }: { data: BaseInfo }) {
  const current = data.currentInfo
  const distro =
    data.prettyDistro || [data.platform, data.platformVersion].filter(Boolean).join(' ')
  const fields = [
    ['主机名', data.hostname || '—'],
    ['操作系统', distro || data.os || '—'],
    ['内核版本', data.kernelVersion || '—'],
    ['架构', data.kernelArch || '—'],
    ['CPU 型号', data.cpuModelName || '—'],
    [
      'CPU 频率',
      Number.isFinite(data.cpuMhz) && data.cpuMhz >= 0 ? `${data.cpuMhz.toFixed(0)} MHz` : '—',
    ],
    ['启动时间', formatTimestamp(current.timeSinceUptime, true)],
    ['运行时间', formatUptime(current.uptime)],
    ['进程数', formatMetric(current.procs, 0)],
  ]

  return (
    <Card
      title={<h2 className="m-0 text-base font-semibold">系统信息</h2>}
      bodyStyle={{ padding: 16 }}
      style={{ minWidth: 0, borderRadius: 'var(--semi-border-radius-medium)' }}
    >
      <Descriptions
        column={1}
        align="left"
        size="small"
        className="[&_table]:w-full [&_table]:table-fixed [&_td]:align-top [&_th]:w-20 [&_th]:align-top"
        data={fields.map(([key, value]) => ({
          key,
          keyStyle: { whiteSpace: 'nowrap', fontSize: 12, fontWeight: 400 },
          value: <span className="block wrap-anywhere text-xs leading-5">{value}</span>,
        }))}
      />
    </Card>
  )
}
