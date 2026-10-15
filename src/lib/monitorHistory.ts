import type { NodeConfig } from './nodes'
import { panelRequest } from './panel'
import { parseResponse, stringList } from '../types/management'
import { monitorDataSchema, monitorSettingsSchema } from '../types/monitorHistory'
import type { MonitorHistory, MonitorRange } from '../types/monitorHistory'

export async function fetchMonitorOptions(node: NodeConfig, signal: AbortSignal) {
  const [settings, networks, disks] = await Promise.all([
    panelRequest(node, '/hosts/monitor/setting', signal),
    panelRequest(node, '/hosts/monitor/netoptions', signal),
    panelRequest(node, '/hosts/monitor/iooptions', signal),
  ])
  return {
    settings: parseResponse(monitorSettingsSchema, settings),
    networks: parseResponse(stringList, networks),
    disks: parseResponse(stringList, disks),
  }
}

export async function fetchMonitorHistory(
  node: NodeConfig,
  range: MonitorRange,
  network: string,
  io: string,
  signal: AbortSignal,
): Promise<MonitorHistory> {
  if (!Number.isFinite(range.start) || !Number.isFinite(range.end) || range.start >= range.end)
    throw new Error('请选择有效的监控时间范围')
  if (range.end - range.start > 31 * 86400000)
    throw new Error('单次最多查询 31 天监控记录，请缩小时间范围')
  const data = parseResponse(
    monitorDataSchema,
    await panelRequest(node, '/hosts/monitor/search', signal, {
      method: 'POST',
      timeoutMs: 60000,
      body: {
        param: 'all',
        network,
        io,
        startTime: new Date(range.start).toISOString(),
        endTime: new Date(range.end).toISOString(),
      },
    }),
  )
  const history: MonitorHistory = { usage: [], load: [], network: [], io: [] }
  for (const group of data ?? []) {
    group.date.forEach((date, index) => {
      const value = group.value[index]
      const timestamp = Date.parse(date)
      if (!value || !Number.isFinite(timestamp)) return
      if (group.param === 'base') {
        history.usage.push({ timestamp, cpu: value.cpu, memory: value.memory })
        history.load.push({
          timestamp,
          load1: value.cpuLoad1,
          load5: value.cpuLoad5,
          load15: value.cpuLoad15,
        })
      } else if (group.param === 'network') {
        // 服务端历史流量使用 KB/s，统一转换为现有图表的 B/s。
        history.network.push({
          timestamp,
          networkSent: value.up === undefined ? undefined : value.up * 1024,
          networkRecv: value.down === undefined ? undefined : value.down * 1024,
        })
      } else if (group.param === 'io') {
        history.io.push({ timestamp, diskRead: value.read, diskWrite: value.write })
      }
    })
  }
  for (const samples of Object.values(history)) samples.sort((a, b) => a.timestamp - b.timestamp)
  return history
}

export async function cleanMonitorHistory(node: NodeConfig, signal: AbortSignal) {
  await panelRequest(node, '/hosts/monitor/clean', signal, { method: 'POST', body: {} })
}
