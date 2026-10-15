import { z } from 'zod'

export const panelSettingsSchema = z.object({
  systemVersion: z.string(),
  panelName: z.string(),
  language: z.string(),
  theme: z.string(),
  menuTabs: z.string().default('Disable'),
  menuAccordion: z.string().default('Disable'),
  developerMode: z.string().default('Disable'),
  edition: z.string().default('cn'),
  docSource: z.string().default('withByRegion'),
  hideMenu: z.string().default('[]'),
  noAuthSetting: z.string().default('200'),
  allowIPTrustedProxies: z.string().default(''),
  ipv6: z.string().default('Disable'),
  sslType: z.string().default('self'),
  proxyType: z.string().default(''),
  proxyUrl: z.string().default(''),
  proxyPort: z.string().default(''),
  proxyUser: z.string().default(''),
  proxyPasswd: z.string().default(''),
  proxyPasswdKeep: z.string().default('Disable'),
  proxyDocker: z.string().default('Disable'),
  sessionTimeout: z.coerce.number(),
  expirationDays: z.coerce.number(),
  complexityVerification: z.string(),
  serverPort: z.coerce.number(),
  ssl: z.string(),
  bindAddress: z.string(),
  bindDomain: z.string(),
  securityEntrance: z.string(),
  allowIPs: z.string(),
  upgradeBackupCopies: z.string(),
})
export const agentSettingsSchema = z.object({
  systemVersion: z.string(),
  systemIP: z.string(),
  localTime: z.string(),
  timeZone: z.string(),
  ntpSite: z.string(),
  dockerSockPath: z.string(),
  fileRecycleBin: z.string(),
})
export type PanelSettings = z.infer<typeof panelSettingsSchema>
export interface PanelProxyValues extends Record<string, unknown> {
  proxyType: string
  proxyUrl: string
  proxyPort: number
  proxyUser: string
  proxyPasswd: string
  proxyPasswdKeep: boolean
  proxyDocker: boolean
  withDockerRestart: boolean
}
export interface PanelSSLValues extends Record<string, unknown> {
  ssl: string
  sslType: string
  domain: string
  cert: string
  key: string
}
export type SettingScope = 'panel' | 'agent' | 'monitor'
export interface SettingField {
  key: string
  field: string
  label: string
  description: string
  scope: SettingScope
  kind?: 'number' | 'select' | 'text' | 'password' | 'textarea'
  options?: { label: string; value: string }[]
  min?: number
  max?: number
  unit?: string
  required?: boolean
  warning?: string
}
export type SettingValues = Record<string, string | number | undefined>

export const enableOptions = [
  { label: '启用', value: 'Enable' },
  { label: '停用', value: 'Disable' },
]
export const agentSettingFields: SettingField[] = [
  {
    key: 'SystemIP',
    field: 'systemIP',
    label: '默认访问地址',
    description: '应用跳转、容器访问等功能使用的 IP 或域名，可为每个节点分别设置。',
    scope: 'agent',
  },
]
export const panelSettingFields: SettingField[] = [
  {
    key: 'Theme',
    field: 'theme',
    label: '主题颜色',
    description: '',
    scope: 'panel',
    kind: 'select',
    options: [
      { label: '亮色', value: 'light' },
      { label: '暗色', value: 'dark' },
      { label: '跟随系统', value: 'auto' },
    ],
  },
  {
    key: 'MenuTabs',
    field: 'menuTabs',
    label: '菜单标签页',
    description: '在节点原生面板中显示最近访问的菜单，可锁定标签页以保持页面会话。',
    scope: 'panel',
    kind: 'select',
    options: enableOptions,
  },
  {
    key: 'PanelName',
    field: 'panelName',
    label: '面板别名',
    description: '',
    scope: 'panel',
    required: true,
  },
  {
    key: 'Language',
    field: 'language',
    label: '系统语言',
    description: '',
    scope: 'panel',
    kind: 'select',
    options: [
      { label: '简体中文', value: 'zh' },
      { label: '繁体中文', value: 'zh-Hant' },
      { label: '英语', value: 'en' },
      { label: '日语', value: 'ja' },
      { label: '葡萄牙语（巴西）', value: 'pt-BR' },
      { label: '韩语', value: 'ko' },
      { label: '俄语', value: 'ru' },
      { label: '马来语', value: 'ms' },
      { label: '土耳其语', value: 'tr' },
      { label: '西班牙语', value: 'es-ES' },
      { label: '波斯语', value: 'fa' },
      { label: '老挝语', value: 'lo' },
    ],
  },
  {
    key: 'SessionTimeout',
    field: 'sessionTimeout',
    label: '面板超时时间',
    description: '超过此时间未操作节点面板时，自动退出登录。',
    scope: 'panel',
    kind: 'number',
    min: 300,
    max: 864000,
    unit: '秒',
  },
  ...agentSettingFields,
  {
    key: 'DeveloperMode',
    field: 'developerMode',
    label: '预览体验计划',
    description: '获取 1Panel 预览版本。',
    scope: 'panel',
    kind: 'select',
    options: enableOptions,
  },
  {
    key: 'MenuAccordion',
    field: 'menuAccordion',
    label: '菜单手风琴',
    description: '展开菜单时自动收起其他菜单分组。',
    scope: 'panel',
    kind: 'select',
    options: enableOptions,
  },
  {
    key: 'Edition',
    field: 'edition',
    label: '运行区域',
    description: '影响应用商店和服务资源的获取区域。',
    scope: 'panel',
    kind: 'select',
    options: [
      { label: '中国大陆', value: 'cn' },
      { label: '国际', value: 'intl' },
    ],
  },
  {
    key: 'DocSource',
    field: 'docSource',
    label: '文档源',
    description: '',
    scope: 'panel',
    kind: 'select',
    options: [
      { label: '跟随运行区域', value: 'withByRegion' },
      { label: '跟随系统语言', value: 'withByLang' },
    ],
  },
]
export const upgradeSettingFields: SettingField[] = [
  {
    key: 'UpgradeBackupCopies',
    field: 'upgradeBackupCopies',
    label: '升级备份保留份数',
    description: '保留用于面板升级恢复的备份数量。',
    scope: 'panel',
    kind: 'number',
    min: 0,
    max: 100,
    unit: '份',
  },
]
export const securitySettingFields: SettingField[] = [
  {
    key: 'NoAuthSetting',
    field: 'noAuthSetting',
    label: '未认证响应',
    description: '未通过安全入口访问面板时返回的状态。',
    scope: 'panel',
    kind: 'select',
    options: [
      { label: '200 · 安全入口提示', value: '200' },
      { label: '400 · 错误请求', value: '400' },
      { label: '401 · 未认证', value: '401' },
      { label: '403 · 禁止访问', value: '403' },
      { label: '404 · 页面不存在', value: '404' },
      { label: '408 · 请求超时', value: '408' },
      { label: '416 · 范围错误', value: '416' },
      { label: '444 · 关闭连接', value: '444' },
      { label: '500 · 服务器错误', value: '500' },
    ],
  },
  {
    key: 'ComplexityVerification',
    field: 'complexityVerification',
    label: '密码复杂度校验',
    description: '对新设置的登录密码进行复杂度校验。',
    scope: 'panel',
    kind: 'select',
    options: enableOptions,
  },
  {
    key: 'ExpirationDays',
    field: 'expirationDays',
    label: '密码有效期',
    description: '到期后需要修改密码，0 表示不设置有效期。',
    scope: 'panel',
    kind: 'number',
    min: 0,
    max: 3650,
    unit: '天',
  },
  {
    key: 'SecurityEntrance',
    field: 'securityEntrance',
    label: '安全入口',
    description: '5–116 位字母或数字，不包含斜杠；留空表示关闭安全入口。',
    scope: 'panel',
    warning: '修改后需要通过新的安全入口登录原生面板，请记录该入口。',
  },
  {
    key: 'BindDomain',
    field: 'bindDomain',
    label: '绑定域名',
    description: '限制访问面板的域名，留空表示不限制。',
    scope: 'panel',
    warning: '请确认域名已解析到节点。修改后可能需要在节点配置中同步主机地址。',
  },
  {
    key: 'AllowIPs',
    field: 'allowIPs',
    label: '授权 IP',
    description: '使用逗号分隔 IP 或 CIDR 网段，留空表示不限制。',
    scope: 'panel',
    warning: '请保留当前客户端的出口 IP，否则可能无法继续访问面板。',
    kind: 'textarea',
  },
  {
    key: 'AllowIPTrustedProxies',
    field: 'allowIPTrustedProxies',
    label: '可信代理',
    description: '反向代理的 IP 或 CIDR 网段，使用逗号分隔；只信任受控的代理。',
    scope: 'panel',
    kind: 'textarea',
  },
]
export const monitorSettingFields: SettingField[] = [
  {
    key: 'MonitorStatus',
    field: 'monitorStatus',
    label: '监控采集',
    description: '控制节点是否持续保存历史监控数据。',
    scope: 'monitor',
    kind: 'select',
    options: enableOptions,
  },
  {
    key: 'MonitorInterval',
    field: 'monitorInterval',
    label: '采集间隔',
    description: '每次记录 CPU、内存、网络和磁盘数据的时间间隔。',
    scope: 'monitor',
    kind: 'number',
    min: 10,
    max: 43200,
    unit: '秒',
  },
  {
    key: 'MonitorStoreDays',
    field: 'monitorStoreDays',
    label: '历史保留时长',
    description: '超过保留期限的监控记录会被自动清理。',
    scope: 'monitor',
    kind: 'number',
    min: 1,
    max: 3650,
    unit: '天',
  },
]
