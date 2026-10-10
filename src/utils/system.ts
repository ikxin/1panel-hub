export function formatVirtualization(value: string | undefined): string {
  const text = value?.trim()
  if (!text) return '—'
  if (!text.startsWith('{') && !text.startsWith('[')) return text

  // 部分面板将完整的主机信息序列化到此字段，只提取虚拟化信息。
  try {
    const info: unknown = JSON.parse(text)
    if (!info || typeof info !== 'object' || Array.isArray(info)) return '—'

    const { virtualizationSystem, virtualizationRole } = info as Record<string, unknown>
    if (typeof virtualizationSystem === 'string' && virtualizationSystem.trim()) {
      return virtualizationSystem.trim()
    }
    if (virtualizationRole === 'guest') return '虚拟机'
    if (virtualizationRole === 'host') return '宿主机'
  } catch {
    return '—'
  }

  return '—'
}
