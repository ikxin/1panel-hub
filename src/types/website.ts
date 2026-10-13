import { z } from 'zod'

export const websiteSchema = z.object({
  id: z.number(),
  primaryDomain: z.string(),
  type: z.string(),
  alias: z.string(),
  status: z.string(),
  protocol: z.string().default('http'),
  remark: z.string().default(''),
  sitePath: z.string().default(''),
  appName: z.string().default(''),
  runtimeName: z.string().default(''),
  sslExpireDate: z.string().nullish(),
})
export const websiteDetailSchema = z.object({
  id: z.number(),
  primaryDomain: z.string(),
  alias: z.string(),
  remark: z.string().default(''),
  sitePath: z.string().default(''),
  accessLogPath: z.string().default(''),
  errorLogPath: z.string().default(''),
  webSiteGroupId: z.number(),
  IPV6: z.boolean().default(false),
  favorite: z.boolean().default(false),
})
export const domainSchema = z.object({
  id: z.number(),
  domain: z.string(),
  port: z.number(),
  ssl: z.boolean().default(false),
})
export const websiteGroupSchema = z.object({ id: z.number(), name: z.string() })
export type Website = z.infer<typeof websiteSchema>
export type WebsiteDetail = z.infer<typeof websiteDetailSchema>
export type WebsiteGroup = z.infer<typeof websiteGroupSchema>
export type WebsiteDomain = z.infer<typeof domainSchema>
export const certificateSchema = z.object({
  id: z.number(),
  primaryDomain: z.string(),
  expireDate: z.string(),
  status: z.string().default(''),
  pem: z.string().default(''),
})
export const websiteHttpsSchema = z.object({
  enable: z.boolean(),
  SSL: certificateSchema,
  httpConfig: z.string(),
  SSLProtocol: z.array(z.string()).nullable(),
  algorithm: z.string(),
  hsts: z.boolean(),
  hstsIncludeSubDomains: z.boolean().default(false),
  httpsPort: z.string(),
  http3: z.boolean(),
})
export type WebsiteHttps = z.infer<typeof websiteHttpsSchema>
export type WebsiteHttpsValues = { enable: boolean; websiteSSLId: number; httpConfig: string }
export type WebsiteCreateValues = {
  type: string
  alias: string
  domains: string
  port: number
  webSiteGroupId: number
  proxy: string
  remark: string
}
