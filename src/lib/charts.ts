import { initVChartSemiTheme } from '@visactor/vchart-semi-theme'
import type { ILineChartSpec } from '@visactor/vchart'
import type { MonitorKind, MonitorSample } from '../types/monitor'
import { formatByteRate, formatMetric, formatPercent, formatTimestamp } from '../utils/formatter'
import { MONITOR_WINDOW_MS } from './monitor'

// 概览按需加载此模块，主题自动跟随 Semi 的 theme-mode 属性。
initVChartSemiTheme()

interface MonitorSeries {
  field: Exclude<keyof MonitorSample, 'timestamp'>
  label: string
  color: string
}

export const MONITOR_SERIES: Record<MonitorKind, MonitorSeries[]> = {
  usage: [
    { field: 'cpu', label: 'CPU', color: 'var(--semi-color-data-0)' },
    { field: 'memory', label: '内存', color: 'var(--semi-color-data-2)' },
  ],
  load: [
    { field: 'load1', label: '1 分钟', color: 'var(--semi-color-data-0)' },
    { field: 'load5', label: '5 分钟', color: 'var(--semi-color-data-2)' },
    { field: 'load15', label: '15 分钟', color: 'var(--semi-color-data-4)' },
  ],
  network: [
    { field: 'networkSent', label: '上传', color: 'var(--semi-color-data-0)' },
    { field: 'networkRecv', label: '下载', color: 'var(--semi-color-data-2)' },
  ],
  io: [
    { field: 'diskRead', label: '读取', color: 'var(--semi-color-data-0)' },
    { field: 'diskWrite', label: '写入', color: 'var(--semi-color-data-2)' },
  ],
}

export function formatChartValue(kind: MonitorKind, value: number | undefined): string {
  if (kind === 'usage') return formatPercent(value)
  if (kind === 'load') return formatMetric(value, 2)
  return formatByteRate(value)
}

export function hasMonitorData(kind: MonitorKind, history: MonitorSample[]): boolean {
  return (
    history.filter((sample) =>
      MONITOR_SERIES[kind].some(({ field }) => {
        const value = sample[field]
        return value !== undefined && Number.isFinite(value) && value >= 0
      }),
    ).length >= 2
  )
}

export function buildMonitorSpec(kind: MonitorKind, history: MonitorSample[]): ILineChartSpec {
  const end = history.at(-1)?.timestamp ?? Date.now()
  const series = MONITOR_SERIES[kind]

  return {
    type: 'line',
    autoFit: true,
    animation: false,
    background: 'transparent',
    padding: { top: 12, right: 10, bottom: 0, left: 0 },
    data: {
      id: 'monitor',
      values: history.flatMap((sample) =>
        series.map(({ field, label }) => {
          const value = sample[field]
          return {
            timestamp: sample.timestamp,
            series: label,
            value: value !== undefined && Number.isFinite(value) && value >= 0 ? value : null,
          }
        }),
      ),
    },
    xField: 'timestamp',
    yField: 'value',
    seriesField: 'series',
    invalidType: 'break',
    line: { style: { lineWidth: 2, curveType: 'linear' } },
    point: { visible: false },
    activePoint: true,
    legends: { visible: false },
    axes: [
      {
        orient: 'bottom',
        type: 'time',
        min: Math.max(history[0]?.timestamp ?? end, end - MONITOR_WINDOW_MS),
        max: end,
        layers: [{ timeFormat: '%H:%M:%S', timeFormatMode: 'local', tickCount: 3 }],
        label: { style: { fontSize: 10 } },
        tick: { visible: false, tickCount: 3 },
        grid: { visible: false },
      },
      {
        orient: 'left',
        type: 'linear',
        min: 0,
        ...(kind === 'usage' ? { max: 100 } : {}),
        label: {
          formatMethod: (value) => formatChartValue(kind, Number(value)),
          style: { fontSize: 10 },
        },
        domainLine: { visible: false },
        tick: { visible: false, tickCount: 4 },
        grid: { visible: true, style: { lineDash: [3, 4] } },
      },
    ],
    crosshair: { xField: { visible: true, line: { type: 'line' } } },
    tooltip: {
      renderMode: 'canvas',
      confine: true,
      activeType: 'dimension',
      dimension: {
        title: { value: (datum) => formatTimestamp(datum?.timestamp) },
        content: [
          {
            key: (datum) => datum?.series,
            value: (datum) => formatChartValue(kind, datum?.value ?? undefined),
            hasShape: true,
          },
        ],
      },
    },
  }
}
