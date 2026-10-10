import {
  IconAppCenter,
  IconBox,
  IconCalendarClock,
  IconFile,
  IconFolder,
  IconGlobe,
  IconHome,
  IconLineChartStroked,
  IconServer,
  IconSetting,
  IconShield,
  IconTerminal,
} from '@douyinfe/semi-icons'
import { matchPath } from 'react-router'

export const panelSections = [
  { key: 'dashboard', title: '概览', icon: IconHome },
  { key: 'website', title: '网站', icon: IconGlobe },
  { key: 'database', title: '数据库', icon: IconServer },
  { key: 'docker', title: '容器', icon: IconBox },
  { key: 'monitor', title: '监控', icon: IconLineChartStroked },
  { key: 'firewall', title: '防火墙', icon: IconShield },
  { key: 'files', title: '文件', icon: IconFolder },
  { key: 'logs', title: '日志', icon: IconFile },
  { key: 'terminal', title: '终端', icon: IconTerminal },
  { key: 'cronjob', title: '计划任务', icon: IconCalendarClock },
  { key: 'appstore', title: '应用商店', icon: IconAppCenter },
  { key: 'settings', title: '设置', icon: IconSetting },
] as const

export type PanelSection = (typeof panelSections)[number]
export type PanelSectionKey = PanelSection['key']

export function getPanelPath(nodeName: string, section: PanelSectionKey = 'dashboard'): string {
  return `/nodes/${encodeURIComponent(nodeName)}/${section}`
}

export function getPanelRoute(pathname: string) {
  const match = matchPath('/nodes/:nodeName/*', pathname)
  if (!match) return null

  const section = panelSections.find(
    (item) => item.key === match.params['*']?.replace(/\/+$/, '').toLowerCase(),
  )?.key

  try {
    // 只解码一次，避免节点名称中的字面量 %2F 被误识别为斜杠。
    return { nodeName: decodeURIComponent(match.params.nodeName ?? ''), section }
  } catch {
    return { nodeName: null, section }
  }
}
