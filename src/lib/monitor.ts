import type { MonitorSample } from '../types/monitor'

export const MONITOR_WINDOW_MS = 5 * 60 * 1000
export const MONITOR_POLL_MS = 2000
export const MONITOR_STALE_MS = 10000

export function resourceTone(value: number | undefined): 'primary' | 'warning' | 'danger' {
  if (value !== undefined && value >= 90) return 'danger'
  if (value !== undefined && value >= 75) return 'warning'
  return 'primary'
}

export function appendMonitorSample(
  history: MonitorSample[] | undefined,
  sample: MonitorSample,
  restarted: boolean,
): MonitorSample[] {
  const samples = restarted ? [] : (history ?? [])
  const last = samples.at(-1)
  // 用空采样打断离线期间的曲线，避免将未采集的数据连成趋势。
  const gap =
    last && sample.timestamp - last.timestamp > MONITOR_STALE_MS
      ? [{ timestamp: last.timestamp + MONITOR_POLL_MS }]
      : []

  return [...samples, ...gap, sample]
    .filter((item) => item.timestamp >= sample.timestamp - MONITOR_WINDOW_MS)
    .slice(-102)
}
