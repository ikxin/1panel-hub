import { z } from 'zod'

export const notificationSchema = z.object({
  id: z.number(),
  type: z.string(),
  title: z.string(),
  config: z.string(),
  status: z.string(),
  updatedAt: z.string().optional(),
})
export type NotificationConfig = z.infer<typeof notificationSchema>
export const notificationTypes = [
  { label: '邮件', value: 'email' },
  { label: '企业微信', value: 'weCom' },
  { label: '钉钉', value: 'dingTalk' },
  { label: '飞书', value: 'feiShu' },
  { label: 'Bark', value: 'bark' },
  { label: '短信', value: 'sms' },
  { label: '自定义 Webhook', value: 'custom' },
]
export interface NotificationValues extends Record<string, unknown> {
  type: string
  displayName: string
  status: string
  host: string
  port: number
  sender: string
  userName: string
  password: string
  encryption: string
  recipient: string
  url: string
  phone: string
  alertDailyNum: number
  bodyType: string
  bodyTemplate: string
  formFields: string
  headers: string
}
export const resourceAlertTypes = [
  { label: 'CPU', value: 'cpu' },
  { label: '内存', value: 'memory' },
  { label: '磁盘', value: 'disk' },
  { label: '负载', value: 'load' },
  { label: '计划任务', value: 'cronJob' },
  { label: '病毒扫描', value: 'clams' },
  { label: '节点异常', value: 'nodeException' },
  { label: '许可证异常', value: 'licenseException' },
  { label: '面板登录', value: 'panelLogin' },
  { label: 'SSH 登录', value: 'sshLogin' },
  { label: '面板密码到期', value: 'panelPwdEndTime' },
  { label: '证书到期', value: 'ssl' },
  { label: '网站到期', value: 'siteEndTime' },
  { label: '面板更新', value: 'panelUpdate' },
]
export interface NotificationCommonValues extends Record<string, unknown> {
  noticeStart: string
  noticeEnd: string
  resourceStart: string
  resourceEnd: string
  resourceTypes: string[]
}

export const backupAccountSchema = z.object({
  id: z.number(),
  name: z.string(),
  type: z.string(),
  isPublic: z.boolean(),
  accessKey: z.string(),
  credential: z.string(),
  bucket: z.string(),
  backupPath: z.string(),
  vars: z.string(),
  rememberAuth: z.boolean().default(false),
  createdAt: z.string().optional(),
})
export type BackupAccount = z.infer<typeof backupAccountSchema>
export interface BackupAccountValues extends Record<string, unknown> {
  name: string
  type: string
  isPublic: boolean
  accessKey: string
  credential: string
  bucket: string
  backupPath: string
  endpoint: string
  region: string
  address: string
  port: number
  mode: string
  scType: string
  authMode: string
  passPhrase: string
  timeout: number
  client_id: string
  client_secret: string
  redirect_uri: string
  refresh_token: string
  drive_id: string
  token: string
  code: string
  rememberAuth: boolean
}
export const backupProviders = [
  { label: '本地磁盘', value: 'LOCAL' },
  { label: '阿里云 OSS', value: 'OSS' },
  { label: '腾讯云 COS', value: 'COS' },
  { label: 'Amazon S3', value: 'S3' },
  { label: 'MinIO', value: 'MINIO' },
  { label: '七牛 Kodo', value: 'KODO' },
  { label: '又拍云', value: 'UPYUN' },
  { label: 'SFTP', value: 'SFTP' },
  { label: 'WebDAV', value: 'WebDAV' },
  { label: 'OneDrive', value: 'OneDrive' },
  { label: 'Google Drive', value: 'GoogleDrive' },
  { label: '阿里云盘', value: 'ALIYUN' },
]
export const backupOptionSchema = z.object({ id: z.number(), name: z.string(), type: z.string() })
export type BackupOption = z.infer<typeof backupOptionSchema>

export const snapshotSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  status: z.string(),
  sourceAccounts: z
    .array(z.string())
    .nullish()
    .transform((value) => value ?? []),
  downloadAccount: z.string(),
  createdAt: z.string(),
  version: z.string(),
  message: z.string(),
  size: z.number().default(0),
  taskID: z.string().default(''),
  recoverStatus: z.string().default(''),
  recoverMessage: z.string().default(''),
  rollbackStatus: z.string().default(''),
  rollbackMessage: z.string().default(''),
})
export type Snapshot = z.infer<typeof snapshotSchema>
export interface SnapshotTree extends Record<string, unknown> {
  id: string
  label: string
  name: string
  isCheck: boolean
  isDisable: boolean
  children: SnapshotTree[]
}
const snapshotTreeSchema: z.ZodType<SnapshotTree> = z.lazy(() =>
  z.looseObject({
    id: z.string(),
    label: z.string(),
    name: z.string().default(''),
    isCheck: z.boolean().default(true),
    isDisable: z.boolean().default(false),
    children: z
      .array(snapshotTreeSchema)
      .nullish()
      .transform((value) => value ?? []),
  }),
)
export const snapshotDataSchema = z.object({
  appData: z
    .array(snapshotTreeSchema)
    .nullish()
    .transform((value) => value ?? []),
  panelData: z
    .array(snapshotTreeSchema)
    .nullish()
    .transform((value) => value ?? []),
  backupData: z
    .array(snapshotTreeSchema)
    .nullish()
    .transform((value) => value ?? []),
  withDockerConf: z.boolean().default(true),
  withMonitorData: z.boolean().default(false),
  withLoginLog: z.boolean().default(false),
  withOperationLog: z.boolean().default(false),
  withSystemLog: z.boolean().default(false),
  withTaskLog: z.boolean().default(false),
  ignoreFiles: z
    .array(z.string())
    .nullish()
    .transform((value) => value ?? []),
})
export type SnapshotData = z.infer<typeof snapshotDataSchema>
export interface SnapshotCreateValues extends Record<string, unknown> {
  accounts: number[]
  downloadAccountID: number
  description: string
  secret: string
  timeout: number
  withApps: boolean
  withPanel: boolean
  withBackups: boolean
  withDockerConf: boolean
  withMonitorData: boolean
  withLoginLog: boolean
  withOperationLog: boolean
  withSystemLog: boolean
  withTaskLog: boolean
  ignoreFiles: string
}

export const apiKeySchema = z.object({
  id: z.string(),
  kind: z.string(),
  name: z.string(),
  description: z.string(),
  keyHint: z.string(),
  status: z.string(),
  revision: z.number(),
  ipWhiteList: z.string(),
  apiTrustedProxies: z.string(),
  apiKeyValidityTime: z.number(),
  allowAppBinding: z.boolean(),
  expiresAt: z.string().nullable(),
  createdAt: z.string().nullable(),
})
export type PanelAPIKey = z.infer<typeof apiKeySchema>
export interface APIKeyValues extends Record<string, unknown> {
  name: string
  description: string
  ipWhiteList: string
  apiTrustedProxies: string
  apiKeyValidityTime: number
  expiresAt: string
  allowAppBinding: boolean
}
export const createdAPIKeySchema = z.object({ item: apiKeySchema, apiKey: z.string() })
export type CreatedAPIKey = z.infer<typeof createdAPIKeySchema>

export const licenseSchema = z.object({
  id: z.number(),
  licenseName: z.string(),
  assigneeName: z.string(),
  status: z.string(),
  message: z.string().default(''),
  versionConstraint: z.string().default(''),
  expiresAt: z.string().default(''),
  trial: z
    .union([z.boolean(), z.string()])
    .default(false)
    .transform((value) => value === true || value === 'yes'),
  productPro: z.string().default('0'),
  bindNode: z.string().default(''),
})
export type PanelLicense = z.infer<typeof licenseSchema>
export const licenseStatusSchema = z
  .object({ status: z.string(), productPro: z.string().default('') })
  .nullable()
export const licenseNodeSchema = z.object({
  id: z.number(),
  name: z.string(),
  addr: z.string(),
  isXpack: z.boolean().default(false),
})
export const upgradeInfoSchema = z.object({
  testVersion: z.string(),
  newVersion: z.string(),
  latestVersion: z.string(),
  releaseNote: z.string(),
})
