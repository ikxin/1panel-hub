import type { NodeConfig } from './nodes'
import { isValidHost } from './nodes'
import { errorMessage, panelRequest } from './panel'
import { parseResponse } from '../types/management'
import { agentSettingsSchema, panelSettingsSchema } from '../types/settings'
import type { SettingField, SettingValues } from '../types/settings'
import { z } from 'zod'
import { fetchMonitorOptions } from './monitorHistory'
import type { PanelSettings, PanelProxyValues, PanelSSLValues } from '../types/settings'
import { encodeSettingSecret } from './settingsResources'

export async function updatePanelProxy(
  node: NodeConfig,
  values: PanelProxyValues,
  signal: AbortSignal,
) {
  const closed = values.proxyType === 'close'
  await panelRequest(node, '/core/settings/proxy/update', signal, {
    method: 'POST',
    timeoutMs: 60000,
    body: {
      ...values,
      proxyType: closed ? '' : values.proxyType,
      proxyUrl: closed ? '' : values.proxyUrl.trim(),
      proxyPort: closed ? '' : String(values.proxyPort),
      proxyUser: closed ? '' : values.proxyUser,
      proxyPasswd: closed ? '' : encodeSettingSecret(values.proxyPasswd),
      proxyPasswdKeep: !closed && values.proxyPasswdKeep ? 'Enable' : 'Disable',
      proxyDocker: !closed && values.proxyDocker,
    },
  })
}
export async function updatePanelPort(node: NodeConfig, serverPort: number, signal: AbortSignal) {
  await panelRequest(node, '/core/settings/port/update', signal, {
    method: 'POST',
    body: { serverPort },
  })
}
export async function updatePanelBind(
  node: NodeConfig,
  values: { bindAddress: string; ipv6: string },
  signal: AbortSignal,
) {
  if (!z.union([z.ipv4(), z.ipv6()]).safeParse(values.bindAddress).success)
    throw new Error('请输入有效的监听 IP')
  await panelRequest(node, '/core/settings/bind/update', signal, { method: 'POST', body: values })
}
export async function updatePanelSSL(
  node: NodeConfig,
  values: PanelSSLValues,
  signal: AbortSignal,
) {
  if (
    values.ssl !== 'Disable' &&
    values.sslType === 'import-paste' &&
    (!values.cert.trim() || !values.key.trim())
  )
    throw new Error('请填写证书和私钥内容')
  await panelRequest(node, '/core/settings/ssl/update', signal, {
    method: 'POST',
    body: { ...values, sslID: 0 },
  })
}

export async function fetchPanelSettings(node: NodeConfig, signal: AbortSignal) {
  return parseResponse(
    panelSettingsSchema,
    await panelRequest(node, '/core/settings/search', signal, { method: 'POST' }),
  )
}
export async function fetchAgentSettings(node: NodeConfig, signal: AbortSignal) {
  return parseResponse(
    agentSettingsSchema,
    await panelRequest(node, '/settings/search', signal, { method: 'POST', body: {} }),
  )
}
export async function fetchGeneralSettings(
  node: NodeConfig,
  section: 'panel' | 'security' | 'monitor',
  signal: AbortSignal,
): Promise<{
  values: Record<string, unknown>
  panel?: PanelSettings
  networks: string[]
  disks: string[]
}> {
  if (section === 'monitor') {
    const data = await fetchMonitorOptions(node, signal)
    return { values: data.settings, networks: data.networks, disks: data.disks }
  }
  const panel = await fetchPanelSettings(node, signal)
  const agent = section === 'panel' ? await fetchAgentSettings(node, signal) : undefined
  return {
    values: { ...panel, ...(agent ? { systemIP: agent.systemIP } : {}) },
    panel,
    networks: [],
    disks: [],
  }
}
export function normalizeSettingValue(field: SettingField, value: string | number | undefined) {
  let text = String(value ?? '').trim()
  if (field.required && !text) throw new Error(`请填写${field.label}`)
  if (
    field.kind === 'number' &&
    (!text ||
      !Number.isInteger(Number(text)) ||
      Number(text) < (field.min ?? 0) ||
      Number(text) > (field.max ?? Number.MAX_SAFE_INTEGER))
  )
    throw new Error(`${field.label}需为 ${field.min ?? 0} 至 ${field.max} 的整数`)
  if (field.kind === 'select' && !field.options?.some((option) => option.value === text))
    throw new Error('请选择有效的选项')
  if (field.key === 'BindDomain' && text && !z.hostname().safeParse(text).success)
    throw new Error('请输入域名，不包含协议、端口或路径')
  if (field.key === 'SecurityEntrance' && text && !/^[A-Za-z0-9]{5,116}$/.test(text))
    throw new Error('安全入口需为 5–116 位字母或数字，不包含斜杠')
  if (
    ['AllowIPs', 'AllowIPTrustedProxies'].includes(field.key) &&
    text &&
    !text
      .split(/[\s,]+/)
      .filter(Boolean)
      .every(
        (item) =>
          z.union([z.ipv4(), z.ipv6(), z.cidrv4(), z.cidrv6()]).safeParse(item.trim()).success,
      )
  )
    throw new Error('请输入有效的 IP 或 CIDR 网段，使用逗号分隔')
  if (['AllowIPs', 'AllowIPTrustedProxies'].includes(field.key))
    text = text
      .split(/[\s,]+/)
      .filter(Boolean)
      .map((item) => item.trim())
      .join(',')
  if (field.key === 'SystemIP' && text && !isValidHost(text))
    throw new Error('请输入有效的 IP 或域名，不包含协议、端口或路径')
  return text
}

export function getSettingValues(
  fields: SettingField[],
  values: Record<string, unknown>,
): SettingValues {
  return Object.fromEntries(
    fields.map((field) => [
      field.field,
      field.kind === 'number' ? Number(values[field.field]) : String(values[field.field] ?? ''),
    ]),
  )
}

export function getChangedSettings(
  fields: SettingField[],
  values: SettingValues,
  saved: SettingValues,
) {
  return fields.filter(
    (field) => String(values[field.field] ?? '').trim() !== String(saved[field.field] ?? '').trim(),
  )
}

async function updateSetting(
  node: NodeConfig,
  field: SettingField,
  value: string,
  signal: AbortSignal,
) {
  const path =
    field.scope === 'monitor'
      ? '/hosts/monitor/setting/update'
      : field.scope === 'agent'
        ? '/settings/update'
        : '/core/settings/update'
  await panelRequest(node, path, signal, { method: 'POST', body: { key: field.key, value } })
}

export async function saveSettings(
  node: NodeConfig,
  fields: SettingField[],
  values: SettingValues,
  signal: AbortSignal,
  onSaved: (field: SettingField, value: string) => void,
) {
  // 先校验全部更改，避免输入错误导致只保存部分字段。
  const changes = fields.map((field) => ({
    field,
    value: normalizeSettingValue(field, values[field.field]),
  }))
  let completed = 0
  for (const { field, value } of changes) {
    signal.throwIfAborted()
    try {
      await updateSetting(node, field, value, signal)
      signal.throwIfAborted()
      onSaved(field, value)
      completed += 1
    } catch (error) {
      if (signal.aborted) throw error
      throw new Error(
        `${field.label}保存失败：${errorMessage(error)}。${completed ? `已保存 ${completed} 项更改，` : ''}未完成的更改已保留，可刷新确认状态或重试。`,
      )
    }
  }
}
