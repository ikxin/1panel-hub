export function formattedNumber(num: string): number {
  return num.endsWith('.00') ? Number(num.slice(0, -3)) : Number(num)
}

export function computeSize(size: number): string {
  const num = 1024.0
  if (size < num) {
    return size + ' B'
  } else if (size < Math.pow(num, 2)) {
    return formattedNumber((size / num).toFixed(2)) + ' KB'
  } else if (size < Math.pow(num, 3)) {
    return formattedNumber((size / Math.pow(num, 2)).toFixed(2)) + ' MB'
  } else if (size < Math.pow(num, 4)) {
    return formattedNumber((size / Math.pow(num, 3)).toFixed(2)) + ' GB'
  } else {
    return formattedNumber((size / Math.pow(num, 4)).toFixed(2)) + ' TB'
  }
}

export function computeSizeFromByte(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  if (bytes < 0) return '0 B'

  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  )
  const value = bytes / Math.pow(1024, index)

  return `${value.toFixed(2)} ${units[index]}`
}
