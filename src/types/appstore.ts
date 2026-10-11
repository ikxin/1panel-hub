import { z } from 'zod'

const text = z
  .string()
  .nullish()
  .transform((value) => value ?? '')
const strings = z
  .array(z.string())
  .nullish()
  .transform((value) => value ?? [])

export const appTagSchema = z.object({ key: z.string(), name: z.string() })

export const catalogAppSchema = z.object({
  id: z.number(),
  key: z.string(),
  name: z.string(),
  description: text,
  status: text,
  type: text,
  installed: z.boolean().default(false),
  limit: z.number().default(0),
  tags: strings,
  recommend: z.number().default(9999),
  gpuSupport: z.boolean().default(false),
})

export const appInfoSchema = z.object({
  id: z.number(),
  key: z.string(),
  name: z.string(),
  shortDescZh: text,
  shortDescEn: text,
  description: text,
  type: text,
  status: text,
  installed: z.boolean().default(false),
  versions: strings,
  website: text,
  github: text,
  document: text,
  readMe: text,
  architectures: text,
})

export type AppParamValue = string | number | boolean | string[]
export interface AppFormField {
  envKey: string
  type: string
  key?: string
  labelZh?: string
  labelEn?: string
  label?: { zh?: string; en?: string }
  description?: { zh?: string; en?: string }
  default?: AppParamValue | null
  required?: boolean
  random?: boolean
  disabled?: boolean
  rule?: string
  multiple?: boolean
  allowCreate?: boolean
  values?: { label: string; value: string | number }[]
  child?: AppFormField
  params?: { key: string; envKey: string; value: AppParamValue }[]
}

const paramValueSchema = z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])
const localeSchema = z.object({ zh: z.string().optional(), en: z.string().optional() })
const appFormFieldSchema: z.ZodType<AppFormField> = z.lazy(() =>
  z.object({
    envKey: z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/),
    type: z.string(),
    key: z.string().optional(),
    labelZh: z.string().optional(),
    labelEn: z.string().optional(),
    label: localeSchema.optional(),
    description: localeSchema.optional(),
    default: paramValueSchema.nullish(),
    required: z.boolean().optional(),
    random: z.boolean().optional(),
    disabled: z.boolean().optional(),
    rule: z.string().optional(),
    multiple: z.boolean().optional(),
    allowCreate: z.boolean().optional(),
    values: z
      .array(z.object({ label: z.string(), value: z.union([z.string(), z.number()]) }))
      .optional(),
    child: appFormFieldSchema.optional(),
    params: z
      .array(
        z.object({
          key: z.string(),
          envKey: z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/),
          value: paramValueSchema,
        }),
      )
      .optional(),
  }),
)

export const appDetailSchema = z.object({
  id: z.number(),
  appId: z.number(),
  version: z.string(),
  enable: z.boolean().default(true),
  params: z.object({
    formFields: z
      .array(appFormFieldSchema)
      .nullish()
      .transform((value) => value ?? []),
  }),
  dockerCompose: text,
  hostMode: z.boolean().default(false),
  architectures: text,
  memoryRequired: z.number().default(0),
})

export const installedAppSchema = z.object({
  id: z.number(),
  name: z.string(),
  appID: z.number(),
  appKey: z.string(),
  appName: z.string(),
  appType: text,
  appStatus: text,
  version: z.string(),
  status: z.string(),
  message: text,
  httpPort: z.number().default(0),
  httpsPort: z.number().default(0),
  canUpdate: z.boolean().default(false),
  ready: z.number().default(0),
  total: z.number().default(0),
  path: text,
  webUI: text,
  createdAt: text,
})

export const appServiceSchema = z.object({
  label: z.string(),
  value: z.string(),
  status: z.string(),
  from: text,
  config: z.record(z.string(), paramValueSchema).nullish(),
})

export const appVersionSchema = z.object({
  version: z.string(),
  detailId: z.number(),
  dockerCompose: text,
})
export const appResourceSchema = z.object({ type: z.string(), name: z.string() })

export type AppTag = z.infer<typeof appTagSchema>
export type CatalogApp = z.infer<typeof catalogAppSchema>
export type AppInfo = z.infer<typeof appInfoSchema>
export type AppDetail = z.infer<typeof appDetailSchema>
export type InstalledApp = z.infer<typeof installedAppSchema>
export type AppService = z.infer<typeof appServiceSchema>
export type AppVersion = z.infer<typeof appVersionSchema>
export type AppResource = z.infer<typeof appResourceSchema>
export type AppOperation = 'start' | 'stop' | 'restart' | 'delete' | 'upgrade'
export type AppStoreTab = 'catalog' | 'installed'
export type AppSource = 'all' | 'remote' | 'local'

export interface AppSearch {
  page: number
  pageSize: number
  name: string
  tags: string[]
  resource: AppSource
  recommend: boolean
  showCurrentArch: boolean
  update: boolean
}

export interface AppPage<T> {
  items: T[]
  total: number
}

export interface AppInstallValues {
  name: string
  params: Record<string, AppParamValue>
  allowPort: boolean
  pullImage: boolean
}
