import type { AppFormField, AppInstallValues, AppParamValue, InstalledApp } from '../types/appstore'
import type { NodeConfig } from '../lib/nodes'
import { getNodeOrigin } from '../lib/nodes'

const appStatuses: Record<
  string,
  { label: string; color: 'green' | 'grey' | 'red' | 'orange' | 'blue'; busy?: boolean }
> = {
  Running: { label: '运行中', color: 'green' },
  Stopped: { label: '已停止', color: 'grey' },
  Paused: { label: '已暂停', color: 'orange' },
  UnHealthy: { label: '不健康', color: 'orange' },
  Error: { label: '异常', color: 'red' },
  InstallErr: { label: '安装失败', color: 'red' },
  DownloadErr: { label: '下载失败', color: 'red' },
  UpErr: { label: '启动失败', color: 'red' },
  StartErr: { label: '启动失败', color: 'red' },
  UpgradeErr: { label: '升级失败', color: 'red' },
  Installing: { label: '安装中', color: 'blue', busy: true },
  Uninstalling: { label: '卸载中', color: 'blue', busy: true },
  Upgrading: { label: '升级中', color: 'blue', busy: true },
  Rebuilding: { label: '重建中', color: 'blue', busy: true },
  Starting: { label: '启动中', color: 'blue', busy: true },
  ReStarting: { label: '重启中', color: 'blue', busy: true },
  Waiting: { label: '等待中', color: 'blue', busy: true },
  WaitingRestart: { label: '等待重启', color: 'orange' },
}

export function appStatus(status: string) {
  return appStatuses[status] ?? { label: status || '未知状态', color: 'grey' as const, busy: false }
}

const supportedTypes = new Set(['text', 'number', 'password', 'select', 'service', 'apps'])

export function unsupportedAppFields(fields: AppFormField[]): AppFormField[] {
  return fields.filter(
    (field) =>
      !supportedTypes.has(field.type) ||
      (field.type === 'service' && !field.key) ||
      (field.type === 'apps' && (!field.child || field.child.type !== 'service')),
  )
}

export function fieldLabel(field: AppFormField) {
  return field.label?.zh || field.labelZh || field.label?.en || field.labelEn || field.envKey
}

export function initialInstallValues(key: string, fields: AppFormField[]): AppInstallValues {
  const params: Record<string, AppParamValue> = {}
  for (const field of fields) {
    let value = field.default ?? (field.multiple ? [] : '')
    if (field.random) value = `${value}_${crypto.randomUUID().replaceAll('-', '').slice(0, 8)}`
    if (field.type === 'number' && value !== '') value = Number(value)
    if (field.type === 'service') value = ''
    params[field.envKey] = value
    if (field.child) params[field.child.envKey] = ''
    if (field.type === 'apps' && (value === 'mysql' || value === 'mariadb'))
      params.format = 'utf8mb4'
    for (const param of field.params ?? []) {
      if (param.key === value) params[param.envKey] = param.value
    }
  }
  return {
    name: key.replace(/^local-?/, '').slice(0, 30),
    params,
    allowPort: false,
    pullImage: true,
  }
}

export function validateAppField(field: AppFormField, value: unknown): string {
  const empty =
    value === undefined ||
    value === null ||
    value === '' ||
    (typeof value === 'string' && !value.trim()) ||
    (Array.isArray(value) && !value.length)
  if (empty) return field.required ? `请填写${fieldLabel(field)}` : ''
  if (field.type === 'number' && !Number.isFinite(Number(value))) return '请输入有效数字'
  if (field.rule === 'port' || field.envKey.includes('PANEL_APP_PORT')) {
    if (!Number.isInteger(Number(value)) || Number(value) < 1 || Number(value) > 65535)
      return '端口必须是 1–65535 之间的整数'
  }
  return ''
}

export function safeAppUrl(value: string): string | undefined {
  try {
    const url = new URL(value)
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password
      ? url.href
      : undefined
  } catch {
    return undefined
  }
}

export function installedAppUrl(node: NodeConfig, app: InstalledApp): string | undefined {
  if (app.webUI) return safeAppUrl(app.webUI)
  if (app.appType !== 'website' && !app.appKey.startsWith('local')) return undefined
  const port = app.httpPort || app.httpsPort
  if (!Number.isInteger(port) || port < 1 || port > 65535) return undefined
  const url = new URL(getNodeOrigin(node))
  url.protocol = app.httpPort ? 'http:' : 'https:'
  url.port = String(port)
  return url.href
}
