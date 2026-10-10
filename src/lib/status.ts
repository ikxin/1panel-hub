import type { BaseInfo } from '../types/dashboard'
import type { MonitorSample } from '../types/monitor'
import type { NodeConfig } from './nodes'
import { appendMonitorSample, MONITOR_STALE_MS } from './monitor'

export interface NodeStatus {
  data?: BaseInfo
  receivedAt?: number
  netBytesSentSpeed?: number
  netBytesRecvSpeed?: number
  ioReadBytesSpeed?: number
  ioWriteBytesSpeed?: number
  ioCountSpeed?: number
  ioTimeSpeed?: number
  history?: MonitorSample[]
  error?: string
}

export interface ConnectionState {
  label: string
  kind: 'online' | 'offline' | 'attention' | 'pending'
  tone: string
}

export function updateStatus(
  data: BaseInfo,
  previous: NodeStatus | undefined,
  now: number,
): NodeStatus {
  const current = data.currentInfo
  const last = previous?.data?.currentInfo
  const shotTime = Date.parse(current.shotTime)
  const lastShotTime = last ? Date.parse(last.shotTime) : NaN
  const elapsed =
    Number.isFinite(shotTime) && Number.isFinite(lastShotTime)
      ? (shotTime - lastShotTime) / 1000
      : previous?.receivedAt
        ? (now - previous.receivedAt) / 1000
        : 0
  const speed = (current: number, last: number | undefined) =>
    elapsed > 0 &&
    last !== undefined &&
    Number.isFinite(last) &&
    Number.isFinite(current) &&
    current >= last
      ? (current - last) / elapsed
      : undefined
  const restarted = last !== undefined && current.uptime < last.uptime
  const netBytesSentSpeed = speed(current.netBytesSent, restarted ? undefined : last?.netBytesSent)
  const netBytesRecvSpeed = speed(current.netBytesRecv, restarted ? undefined : last?.netBytesRecv)
  const ioReadBytesSpeed = speed(current.ioReadBytes, restarted ? undefined : last?.ioReadBytes)
  const ioWriteBytesSpeed = speed(current.ioWriteBytes, restarted ? undefined : last?.ioWriteBytes)
  const ioReadTimeSpeed = speed(current.ioReadTime, restarted ? undefined : last?.ioReadTime)
  const ioWriteTimeSpeed = speed(current.ioWriteTime, restarted ? undefined : last?.ioWriteTime)

  return {
    data,
    receivedAt: now,
    netBytesSentSpeed,
    netBytesRecvSpeed,
    ioReadBytesSpeed,
    ioWriteBytesSpeed,
    ioCountSpeed: speed(current.ioCount, restarted ? undefined : last?.ioCount),
    ioTimeSpeed:
      ioReadTimeSpeed !== undefined && ioWriteTimeSpeed !== undefined
        ? Math.max(ioReadTimeSpeed, ioWriteTimeSpeed)
        : undefined,
    history: appendMonitorSample(
      previous?.history,
      {
        timestamp: now,
        cpu: current.cpuUsedPercent,
        memory: current.memoryUsedPercent,
        load1: current.load1,
        load5: current.load5,
        load15: current.load15,
        networkSent: netBytesSentSpeed,
        networkRecv: netBytesRecvSpeed,
        diskRead: ioReadBytesSpeed,
        diskWrite: ioWriteBytesSpeed,
      },
      restarted,
    ),
  }
}

export function isOnline(status: NodeStatus | undefined, now: number): boolean {
  return Boolean(
    status?.data && !status.error && now - (status.receivedAt ?? 0) <= MONITOR_STALE_MS,
  )
}

export function connectionState(
  node: NodeConfig,
  status: NodeStatus | undefined,
  now: number,
): ConnectionState {
  if (!node.apiKey) return { label: '待配置', kind: 'attention', tone: 'warning' }
  if (isOnline(status, now)) return { label: '在线', kind: 'online', tone: 'success' }
  if (status?.error) return { label: '离线', kind: 'offline', tone: 'danger' }
  if (status?.data) return { label: '等待更新', kind: 'attention', tone: 'warning' }
  return { label: '连接中', kind: 'pending', tone: 'text-2' }
}
