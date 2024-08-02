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
