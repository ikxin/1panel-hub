import type { Website } from '../types/website'

export const websiteTypes = [
  { label: '静态网站', value: 'static' },
  { label: '反向代理', value: 'proxy' },
  { label: '应用部署', value: 'deployment' },
  { label: '运行环境', value: 'runtime' },
  { label: '负载均衡', value: 'stream' },
]
export function websiteTypeLabel(type: string) {
  return websiteTypes.find((item) => item.value === type)?.label ?? type
}
export function websiteStatus(status: string) {
  if (status === 'Running') return { label: '运行中', color: 'green' as const }
  if (status === 'Stopped') return { label: '已停止', color: 'grey' as const }
  return { label: status || '未知', color: 'orange' as const }
}
export function parseDomains(value: string, port: number) {
  const domains = [...new Set(value.split(/\s+/).filter(Boolean))]
  if (!domains.length) throw new Error('请至少填写一个域名')
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error('端口必须在 1–65535 之间')
  return domains.map((domain) => {
    const name = domain.replace(/^\*\./, '')
    if (!/^[a-z\d](?:[a-z\d.-]*[a-z\d])?$/i.test(name) || name.includes('..'))
      throw new Error(`域名格式无效：${domain}，请只填写域名，不包含协议、端口和路径`)
    return { domain, port, ssl: false }
  })
}
export function websiteUrl(website: Website) {
  if (website.type === 'stream' || website.primaryDomain.includes('*')) return null
  try {
    const url = new URL(
      `${website.protocol.toLowerCase() === 'https' ? 'https' : 'http'}://${website.primaryDomain}`,
    )
    return url.username || url.password ? null : url.href
  } catch {
    return null
  }
}
export function certificateExpiry(value?: string | null) {
  if (!value || value.startsWith('0001')) return '未配置证书'
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return '到期时间未知'
  const days = Math.ceil((date.getTime() - Date.now()) / 86400000)
  return days < 0 ? '证书已过期' : days === 0 ? '证书今日到期' : `${days} 天后到期`
}
