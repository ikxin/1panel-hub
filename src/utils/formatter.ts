export function formattedNumber(num: string): number {
  return num.endsWith('.00') ? Number(num.slice(0, -3)) : Number(num)
}

interface SizeParts {
  value: string
  unit: string
  formatted: string
}

function computeSizeParts(size: number): SizeParts {
  const num = 1024.0
  if (!Number.isFinite(size) || size <= 0) return { value: '0', unit: 'B', formatted: '0 B' }
  if (size < num) {
    const value = String(size)
    return { value, unit: 'B', formatted: `${value} B` }
  }

  const units = ['KB', 'MB', 'GB', 'TB']
  const index = Math.min(Math.floor(Math.log(size) / Math.log(num)) - 1, units.length - 1)
  const unit = units[index]
  const value = String(formattedNumber((size / Math.pow(num, index + 1)).toFixed(2)))
  return { value, unit, formatted: `${value} ${unit}` }
}

export function computeSize(size: number): string {
  return computeSizeParts(size).formatted
}

export function computeSizePair(used?: number, total?: number): string {
  const usedParts = used !== undefined && Number.isFinite(used) ? computeSizeParts(used) : undefined
  const totalParts = total !== undefined && Number.isFinite(total) ? computeSizeParts(total) : undefined
  if (usedParts && totalParts && usedParts.unit === totalParts.unit) {
    return `${usedParts.value} / ${totalParts.value} ${totalParts.unit}`
  }
  return `${usedParts?.formatted ?? '—'} / ${totalParts?.formatted ?? '—'}`
}

export function computeSizeFromByte(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'

  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / Math.pow(1024, index)

  return `${value.toFixed(2)} ${units[index]}`
}

export function formatUptime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '—'
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return [days && `${days} 天`, hours && `${hours} 小时`, `${minutes} 分钟`].filter(Boolean).join(' ')
}
