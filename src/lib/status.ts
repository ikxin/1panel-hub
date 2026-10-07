import type { BaseInfo } from '../types/dashboard'

export interface NodeStatus {
  data?: BaseInfo
  receivedAt?: number
  netBytesSentSpeed?: number
  netBytesRecvSpeed?: number
  ioReadBytesSpeed?: number
  ioWriteBytesSpeed?: number
  error?: string
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

  return {
    data,
    receivedAt: now,
    netBytesSentSpeed: speed(current.netBytesSent, restarted ? undefined : last?.netBytesSent),
    netBytesRecvSpeed: speed(current.netBytesRecv, restarted ? undefined : last?.netBytesRecv),
    ioReadBytesSpeed: speed(current.ioReadBytes, restarted ? undefined : last?.ioReadBytes),
    ioWriteBytesSpeed: speed(current.ioWriteBytes, restarted ? undefined : last?.ioWriteBytes),
  }
}

export function isOnline(status: NodeStatus | undefined, now: number): boolean {
  return Boolean(status?.data && !status.error && now - (status.receivedAt ?? 0) <= 10000)
}
