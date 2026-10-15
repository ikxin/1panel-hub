import { z } from 'zod'
import { panelRequest } from './panel'
import type { NodeConfig } from './nodes'
import { pageSchema, parseResponse } from '../types/management'
import type { ResourceSearch } from '../types/management'
import {
  apiKeySchema,
  createdAPIKeySchema,
  backupAccountSchema,
  backupOptionSchema,
  notificationSchema,
  snapshotSchema,
  snapshotDataSchema,
  licenseSchema,
  licenseStatusSchema,
  licenseNodeSchema,
  upgradeInfoSchema,
  resourceAlertTypes,
} from '../types/settingsResources'
import type {
  APIKeyValues,
  PanelAPIKey,
  BackupAccount,
  BackupAccountValues,
  NotificationConfig,
  NotificationValues,
  NotificationCommonValues,
  SnapshotCreateValues,
  SnapshotData,
  SnapshotTree,
} from '../types/settingsResources'

export function encodeSettingSecret(value: string) {
  return btoa(
    Array.from(new TextEncoder().encode(value), (byte) => String.fromCharCode(byte)).join(''),
  )
}
function decodeSecret(value: string) {
  try {
    return new TextDecoder().decode(Uint8Array.from(atob(value), (char) => char.charCodeAt(0)))
  } catch {
    throw new Error('无法读取账号凭据，请重新填写凭据')
  }
}
export function readSettingsObject(value: string): Record<string, unknown> {
  return parseResponse(z.record(z.string(), z.unknown()), JSON.parse(value || '{}'))
}
function legacySecret(value: unknown): string {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && 'value' in value && typeof value.value === 'string')
    return value.value
  return ''
}
export function validateIPEntries(value: string, required = false) {
  const items = value
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean)
  if (required && !items.length) return '请填写至少一个 IP 或 CIDR 网段'
  const schema = z.union([z.ipv4(), z.ipv6(), z.cidrv4(), z.cidrv6()])
  return items.every((item) => schema.safeParse(item).success) ? '' : '请输入有效的 IP 或 CIDR 网段'
}

export async function searchPanelAPIKeys(
  node: NodeConfig,
  search: ResourceSearch,
  signal: AbortSignal,
) {
  return parseResponse(
    pageSchema(apiKeySchema),
    await panelRequest(node, '/core/auth/api/keys/search', signal, {
      method: 'POST',
      body: { page: search.page, pageSize: search.pageSize, excludeRevoked: false },
    }),
  )
}
export async function savePanelAPIKey(
  node: NodeConfig,
  values: APIKeyValues,
  requestID: string,
  item: PanelAPIKey | undefined,
  signal: AbortSignal,
) {
  const ipError =
    validateIPEntries(values.ipWhiteList, true) || validateIPEntries(values.apiTrustedProxies)
  if (ipError) throw new Error(ipError)
  const expiresAt =
    item?.kind === 'legacy'
      ? null
      : values.expiresAt
        ? new Date(values.expiresAt).toISOString()
        : null
  if (expiresAt && Date.parse(expiresAt) <= Date.now()) throw new Error('到期时间必须晚于当前时间')
  const body = {
    ...values,
    name: values.name.trim(),
    expiresAt,
    ipWhiteList: values.ipWhiteList
      .split(/[\s,]+/)
      .filter(Boolean)
      .join('\n'),
    apiTrustedProxies: values.apiTrustedProxies
      .split(/[\s,]+/)
      .filter(Boolean)
      .join('\n'),
  }
  if (item) {
    await panelRequest(node, '/core/auth/api/keys/update', signal, {
      method: 'POST',
      body: { ...body, id: item.id, revision: item.revision },
    })
    return null
  }
  return parseResponse(
    createdAPIKeySchema,
    await panelRequest(node, '/core/auth/api/keys/create', signal, {
      method: 'POST',
      body: { ...body, requestID },
    }),
  )
}
export async function changePanelAPIKey(
  node: NodeConfig,
  item: PanelAPIKey,
  action: 'Enable' | 'Disable' | 'revoke',
  signal: AbortSignal,
) {
  await panelRequest(
    node,
    `/core/auth/api/keys/${action === 'revoke' ? 'revoke' : 'status'}`,
    signal,
    {
      method: 'POST',
      body: {
        id: item.id,
        revision: item.revision,
        ...(action === 'revoke' ? {} : { status: action }),
      },
    },
  )
}

export async function searchNotificationConfigs(
  node: NodeConfig,
  search: ResourceSearch,
  signal: AbortSignal,
) {
  return parseResponse(
    pageSchema(notificationSchema),
    await panelRequest(node, '/alert/config/search', signal, {
      method: 'POST',
      body: { page: search.page, pageSize: search.pageSize, excludeTypes: [] },
    }),
  )
}
export function notificationInitialValues(item?: NotificationConfig): NotificationValues {
  const config = item ? readSettingsObject(item.config) : {}
  const body = z.record(z.string(), z.unknown()).safeParse(config.body)
  const fields = z
    .array(z.object({ key: z.string(), value: z.string() }))
    .safeParse(body.success ? body.data.fields : [])
  const headers = z
    .array(
      z.object({ key: z.string(), value: z.string().optional(), secret: z.boolean().optional() }),
    )
    .safeParse(config.headers ?? [])
  return {
    type: item?.type ?? 'email',
    displayName: String(config.displayName ?? ''),
    status: item?.status ?? 'Enable',
    host: String(config.host ?? ''),
    port: Number(config.port ?? 465),
    sender: String(config.sender ?? ''),
    userName: String(config.userName ?? ''),
    password: '',
    encryption: String(config.encryption ?? 'NONE'),
    recipient: Array.isArray(config.recipients)
      ? config.recipients.join(',')
      : String(config.recipient ?? ''),
    url: typeof config.url === 'string' ? config.url : '',
    phone: typeof config.phone === 'string' ? config.phone : '',
    alertDailyNum: Number(config.alertDailyNum ?? 50),
    bodyType: body.success ? String(body.data.type ?? 'json') : 'json',
    bodyTemplate: body.success
      ? String(body.data.template ?? '')
      : '{\n  "title": "{{title}}",\n  "message": "{{message}}",\n  "node_name": "{{nodeName}}"\n}',
    formFields: fields.success
      ? fields.data.map((item) => `${item.key}=${item.value}`).join('\n')
      : '',
    headers: headers.success
      ? headers.data
          .filter((item) => !item.secret)
          .map((item) => `${item.key}=${item.value ?? ''}`)
          .join('\n')
      : '',
  }
}
function parseWebhookPairs(value: string) {
  return value
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => {
      const index = line.indexOf('=')
      if (index < 1) throw new Error('请求头和表单字段需要使用「名称=值」格式')
      return { key: line.slice(0, index).trim(), value: line.slice(index + 1) }
    })
}
function customWebhookConfig(values: NotificationValues, previous: Record<string, unknown>) {
  if (values.bodyType === 'json') {
    try {
      JSON.parse(values.bodyTemplate)
    } catch {
      throw new Error('请求体模板需要是有效的 JSON')
    }
  }
  const previousHeaders = parseResponse(
    z.array(
      z.object({ uid: z.string().optional(), key: z.string(), secret: z.boolean().default(false) }),
    ),
    previous.headers ?? [],
  )
  const headers = parseWebhookPairs(values.headers).map((entry) => {
    const existing = previousHeaders.find(
      (item) => item.key.toLowerCase() === entry.key.toLowerCase(),
    )
    return {
      ...entry,
      uid: existing?.uid ?? crypto.randomUUID(),
      secret: existing?.secret || /authorization|cookie|token|api[-_]?key/i.test(entry.key),
      action: 'replace',
    }
  })
  const kept = previousHeaders
    .filter(
      (item) =>
        item.secret && !headers.some((entry) => entry.key.toLowerCase() === item.key.toLowerCase()),
    )
    .map((item) => ({ ...item, action: 'keep' }))
  return {
    schemaVersion: 1,
    displayName: values.displayName,
    preset: previous.preset ?? 'custom',
    method: 'POST',
    url: values.url ? { action: 'replace', value: values.url.trim() } : { action: 'keep' },
    body: {
      type: values.bodyType,
      template: values.bodyType === 'form' ? '' : values.bodyTemplate,
      fields: values.bodyType === 'form' ? parseWebhookPairs(values.formFields) : [],
    },
    headers: [...headers, ...kept],
  }
}
export async function saveNotificationConfig(
  node: NodeConfig,
  values: NotificationValues,
  item: NotificationConfig | undefined,
  signal: AbortSignal,
) {
  const previous = item ? readSettingsObject(item.config) : {}
  const config =
    values.type === 'custom'
      ? customWebhookConfig(values, previous)
      : values.type === 'email'
        ? {
            ...previous,
            displayName: values.displayName,
            host: values.host,
            port: values.port,
            sender: values.sender,
            userName: values.userName,
            password: values.password || legacySecret(previous.password),
            encryption: values.encryption,
            recipient: values.recipient,
            recipients: values.recipient.split(/[,\s]+/).filter(Boolean),
          }
        : values.type === 'sms'
          ? {
              ...previous,
              displayName: values.displayName,
              phone: values.phone || legacySecret(previous.phone),
              alertDailyNum: values.alertDailyNum,
            }
          : {
              ...previous,
              displayName: values.displayName,
              url: values.url || legacySecret(previous.url),
            }
  await panelRequest(node, '/alert/config/update', signal, {
    method: 'POST',
    body: {
      id: item?.id ?? 0,
      revision: item?.updatedAt,
      type: values.type,
      title:
        item?.title ??
        `xpack.alert.${values.type === 'email' ? 'emailConfig' : values.type === 'sms' ? 'smsConfig' : values.type}`,
      status: values.status,
      displayName: values.displayName,
      config: JSON.stringify(config),
    },
  })
}
export async function fetchNotificationCommon(node: NodeConfig, signal: AbortSignal) {
  const items = parseResponse(
    z.array(notificationSchema),
    await panelRequest(node, '/alert/config/info', signal, {
      method: 'POST',
      body: { excludeTypes: [] },
    }),
  )
  return items.find((item) => item.type === 'common') ?? null
}
export function notificationCommonInitialValues(
  item: NotificationConfig | null,
): NotificationCommonValues {
  const config = item ? readSettingsObject(item.config) : {}
  const timeRange = parseResponse(
    z.object({
      noticeAlert: z.object({ sendTimeRange: z.string(), type: z.array(z.string()) }),
      resourceAlert: z.object({ sendTimeRange: z.string(), type: z.array(z.string()) }),
    }),
    config.alertSendTimeRange ?? {
      noticeAlert: {
        sendTimeRange: '08:00:00 - 23:59:59',
        type: ['panelPwdEndTime', 'ssl', 'siteEndTime', 'panelUpdate'],
      },
      resourceAlert: {
        sendTimeRange: '00:00:00 - 23:59:59',
        type: [
          'clams',
          'cronJob',
          'cpu',
          'memory',
          'load',
          'disk',
          'nodeException',
          'licenseException',
          'panelLogin',
          'sshLogin',
        ],
      },
    },
  )
  const [noticeStart, noticeEnd] = timeRange.noticeAlert.sendTimeRange.split(' - ')
  const [resourceStart, resourceEnd] = timeRange.resourceAlert.sendTimeRange.split(' - ')
  return {
    noticeStart,
    noticeEnd,
    resourceStart,
    resourceEnd,
    resourceTypes: timeRange.resourceAlert.type,
  }
}
export async function saveNotificationCommon(
  node: NodeConfig,
  item: NotificationConfig | null,
  values: NotificationCommonValues,
  signal: AbortSignal,
) {
  const config = item ? readSettingsObject(item.config) : {}
  const time = (value: string) => {
    if (!/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(value))
      throw new Error('请输入有效的发送时间')
    return value.length === 5 ? `${value}:00` : value
  }
  const previousRange = z
    .object({
      noticeAlert: z.object({ type: z.array(z.string()) }),
      resourceAlert: z.object({ type: z.array(z.string()) }),
    })
    .safeParse(config.alertSendTimeRange)
  const known = resourceAlertTypes.map((item) => item.value)
  const allTypes = [
    ...new Set([
      ...known,
      ...(previousRange.success
        ? [...previousRange.data.noticeAlert.type, ...previousRange.data.resourceAlert.type]
        : []),
    ]),
  ]
  await panelRequest(node, '/alert/config/update', signal, {
    method: 'POST',
    body: {
      id: item?.id ?? 0,
      revision: item?.updatedAt,
      type: 'common',
      title: 'xpack.alert.commonConfig',
      status: 'Enable',
      displayName: '通用配置',
      config: JSON.stringify({
        ...config,
        alertSendTimeRange: {
          noticeAlert: {
            sendTimeRange: `${time(values.noticeStart)} - ${time(values.noticeEnd)}`,
            type: allTypes.filter((type) => !values.resourceTypes.includes(type)),
          },
          resourceAlert: {
            sendTimeRange: `${time(values.resourceStart)} - ${time(values.resourceEnd)}`,
            type: values.resourceTypes,
          },
        },
      }),
    },
  })
}
export async function changeNotificationConfig(
  node: NodeConfig,
  item: NotificationConfig,
  action: 'Enable' | 'Disable' | 'delete',
  signal: AbortSignal,
) {
  await panelRequest(node, `/alert/config/${action === 'delete' ? 'del' : 'status'}`, signal, {
    method: 'POST',
    body: { id: item.id, ...(action === 'delete' ? {} : { status: action }) },
  })
}

export async function searchBackupAccounts(
  node: NodeConfig,
  search: ResourceSearch,
  signal: AbortSignal,
) {
  return parseResponse(
    pageSchema(backupAccountSchema),
    await panelRequest(node, '/backups/search', signal, {
      method: 'POST',
      body: { page: search.page, pageSize: search.pageSize, type: search.name },
    }),
  )
}
export async function fetchBackupOptions(node: NodeConfig, signal: AbortSignal) {
  return parseResponse(
    z.array(backupOptionSchema),
    await panelRequest(node, '/backups/options', signal),
  )
}
export function backupInitialValues(item?: BackupAccount): BackupAccountValues {
  const vars = item ? readSettingsObject(item.vars) : {}
  return {
    ...vars,
    name: item?.name ?? '',
    type: item?.type ?? 'S3',
    isPublic: item?.isPublic ?? false,
    accessKey: item?.rememberAuth ? decodeSecret(item.accessKey) : '',
    credential: item?.rememberAuth ? decodeSecret(item.credential) : '',
    bucket: item?.bucket ?? '',
    backupPath: item?.backupPath ?? '',
    endpoint: String(vars.endpoint ?? vars.domain ?? ''),
    region: String(vars.region ?? ''),
    address: String(vars.address ?? ''),
    port: Number(vars.port ?? 22),
    mode: String(vars.mode ?? 'virtual hosted'),
    scType: String(vars.scType ?? ((item?.type ?? 'S3') === 'S3' ? 'STANDARD' : 'Standard')),
    authMode: String(vars.authMode ?? 'password'),
    passPhrase: String(vars.passPhrase ?? ''),
    timeout: Number(vars.timeout ?? 1),
    client_id: String(vars.client_id ?? ''),
    client_secret: String(vars.client_secret ?? ''),
    redirect_uri: String(vars.redirect_uri ?? ''),
    refresh_token: String(vars.refresh_token ?? ''),
    drive_id: String(vars.drive_id ?? ''),
    token: '',
    code: '',
    rememberAuth: item?.rememberAuth ?? false,
  }
}
export async function saveBackupAccount(
  node: NodeConfig,
  values: BackupAccountValues,
  item: BackupAccount | undefined,
  signal: AbortSignal,
) {
  if (['OneDrive', 'GoogleDrive'].includes(values.type) && !values.code && !values.refresh_token)
    throw new Error('请填写授权码或 Refresh Token')
  const previous = item ? readSettingsObject(item.vars) : {}
  const scType =
    values.scType === 'STANDARD' && ['OSS', 'COS'].includes(values.type)
      ? 'Standard'
      : values.scType === 'Standard' && values.type === 'S3'
        ? 'STANDARD'
        : values.scType
  const vars = {
    ...previous,
    endpoint: values.endpoint,
    domain: values.endpoint,
    region: values.region,
    address: values.address,
    port: String(values.port),
    mode: values.mode,
    scType,
    authMode: values.authMode,
    passPhrase: values.passPhrase,
    timeout: Number(values.timeout),
    client_id: values.client_id,
    client_secret: values.client_secret,
    redirect_uri: values.redirect_uri,
    refresh_token: values.refresh_token,
    drive_id: values.drive_id,
    code: values.code ? decodeURIComponent(values.code) : '',
  }
  const body = {
    id: item?.id ?? 0,
    name: values.name.trim(),
    type: values.type,
    isPublic: values.isPublic,
    bucket: values.bucket,
    backupPath: values.backupPath,
    rememberAuth: values.rememberAuth,
    accessKey: encodeSettingSecret(values.accessKey),
    credential: encodeSettingSecret(values.credential),
    vars: JSON.stringify(vars),
  }
  if (['OneDrive', 'GoogleDrive'].includes(values.type) && values.code) {
    const result = parseResponse(
      z.object({ isOk: z.boolean(), msg: z.string(), token: z.string() }),
      await panelRequest(node, '/backups/conn/check', signal, {
        method: 'POST',
        body,
        timeoutMs: 60000,
      }),
    )
    if (!result.isOk) throw new Error(`账号授权失败：${result.msg}`)
    vars.refresh_token = decodeSecret(result.token)
    body.vars = JSON.stringify({ ...vars, code: '', refresh_status: 'Success' })
  }
  await panelRequest(
    node,
    `${values.isPublic ? '/core/backups' : '/backups'}${item ? '/update' : ''}`,
    signal,
    {
      method: 'POST',
      timeoutMs: 60000,
      body,
    },
  )
}
export async function deleteBackupAccount(
  node: NodeConfig,
  item: BackupAccount,
  signal: AbortSignal,
) {
  await panelRequest(node, item.isPublic ? '/core/backups/del' : '/backups/del', signal, {
    method: 'POST',
    body: item.isPublic ? { name: item.name } : { id: item.id },
  })
}

export async function searchSnapshots(
  node: NodeConfig,
  search: ResourceSearch,
  signal: AbortSignal,
) {
  return parseResponse(
    pageSchema(snapshotSchema),
    await panelRequest(node, '/settings/snapshot/search', signal, {
      method: 'POST',
      body: {
        page: search.page,
        pageSize: search.pageSize,
        info: search.name,
        orderBy: 'createdAt',
        order: 'descending',
      },
    }),
  )
}
export async function fetchSnapshotData(node: NodeConfig, signal: AbortSignal) {
  return parseResponse(
    snapshotDataSchema,
    await panelRequest(node, '/settings/snapshot/load', signal, { timeoutMs: 60000 }),
  )
}
export async function fetchSnapshotHostInfo(node: NodeConfig, signal: AbortSignal) {
  return parseResponse(
    z.object({ kernelArch: z.string(), diskSize: z.number() }),
    await panelRequest(node, '/dashboard/base/os', signal),
  )
}
function selectSnapshotTree(items: SnapshotTree[], selected: boolean): SnapshotTree[] {
  return items.map((item) => ({
    ...item,
    isCheck: item.isDisable ? item.isCheck : selected,
    children: selectSnapshotTree(item.children, selected),
  }))
}
export async function fetchSnapshotFiles(node: NodeConfig, accountID: number, signal: AbortSignal) {
  return parseResponse(
    z
      .array(z.string())
      .nullable()
      .transform((value) => value ?? []),
    await panelRequest(node, '/backups/search/files', signal, {
      method: 'POST',
      body: { id: accountID },
    }),
  )
}
export async function createSnapshot(
  node: NodeConfig,
  values: SnapshotCreateValues,
  data: SnapshotData,
  taskID: string,
  signal: AbortSignal,
) {
  if (!values.accounts.includes(values.downloadAccountID))
    throw new Error('默认下载账号必须包含在备份账号中')
  await panelRequest(node, '/settings/snapshot', signal, {
    method: 'POST',
    body: {
      ...values,
      id: 0,
      taskID,
      sourceAccountIDs: values.accounts.join(','),
      downloadAccountID: values.downloadAccountID,
      appData: selectSnapshotTree(data.appData, values.withApps),
      panelData: selectSnapshotTree(data.panelData, values.withPanel),
      backupData: selectSnapshotTree(data.backupData, values.withBackups),
      ignoreFiles: values.ignoreFiles
        .split('\n')
        .map((value) => value.trim())
        .filter(Boolean),
    },
  })
}
export async function operateSnapshot(
  node: NodeConfig,
  action: 'recreate' | 'recover' | 'rollback' | 'del' | 'import',
  body: unknown,
  signal: AbortSignal,
) {
  await panelRequest(node, `/settings/snapshot/${action}`, signal, {
    method: 'POST',
    body,
    timeoutMs: 60000,
  })
}

export async function searchLicenses(
  node: NodeConfig,
  search: ResourceSearch,
  signal: AbortSignal,
) {
  return parseResponse(
    pageSchema(licenseSchema),
    await panelRequest(node, '/core/licenses/search', signal, {
      method: 'POST',
      body: { page: search.page, pageSize: search.pageSize },
    }),
  )
}
export async function fetchLicenseStatus(node: NodeConfig, signal: AbortSignal) {
  return parseResponse(
    licenseStatusSchema,
    await panelRequest(node, '/core/licenses/status', signal),
  )
}
export async function fetchLicenseNodes(node: NodeConfig, signal: AbortSignal) {
  return parseResponse(
    z.array(licenseNodeSchema),
    await panelRequest(node, '/core/nodes/list', signal, {
      method: 'POST',
      body: { type: 'free' },
    }),
  )
}
export async function operateLicense(
  node: NodeConfig,
  action: 'sync' | 'del' | 'bind' | 'unbind',
  body: unknown,
  signal: AbortSignal,
) {
  await panelRequest(node, `/core/licenses/${action}`, signal, {
    method: 'POST',
    body,
    timeoutMs: 60000,
  })
}
export async function uploadPanelLicense(
  node: NodeConfig,
  file: File,
  oldLicense: string,
  signal: AbortSignal,
) {
  const data = new FormData()
  data.append('file', file)
  data.append('isForce', 'false')
  if (oldLicense) data.append('oldLicenseName', oldLicense)
  await panelRequest(node, `/core/licenses/${oldLicense ? 'update' : 'upload'}`, signal, {
    method: 'POST',
    body: data,
    timeoutMs: 60000,
  })
}
export async function fetchUpgradeInfo(node: NodeConfig, signal: AbortSignal) {
  return parseResponse(
    upgradeInfoSchema,
    await panelRequest(node, '/core/settings/upgrade', signal),
  )
}
export async function upgradePanel(node: NodeConfig, version: string, signal: AbortSignal) {
  await panelRequest(node, '/core/settings/upgrade', signal, { method: 'POST', body: { version } })
}
