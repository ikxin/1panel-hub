import { z } from 'zod'

export type AuditLogKind = 'operation' | 'login'
export const operationLogSchema = z.object({
  id: z.number(),
  createdAt: z.string(),
  status: z.string(),
  user: z.string(),
  ip: z.string(),
  source: z.string(),
  node: z.string(),
  path: z.string(),
  method: z.string(),
  latency: z.number(),
  message: z.string(),
  detailZH: z.string(),
  userAgent: z.string(),
  apiKeyName: z.string().optional(),
})
export const loginLogSchema = z.object({
  id: z.number(),
  createdAt: z.string(),
  status: z.string(),
  user: z.string(),
  ip: z.string(),
  address: z.string(),
  agent: z.string(),
  message: z.string(),
})
export interface AuditLog {
  id: number
  time: string
  status: string
  user: string
  ip: string
  summary: string
  details: { label: string; value: string }[]
}
export const systemLogStatusSchema = z.object({
  source: z.enum(['journalctl', 'file']),
  version: z.string(),
  keywordFilterSupported: z.boolean(),
  message: z.string(),
})
export const systemLogSchema = z.object({
  source: z.string(),
  hasMore: z.boolean(),
  nextCursor: z.string(),
  items: z
    .array(
      z.object({
        time: z.string(),
        priority: z.string(),
        service: z.string(),
        message: z.string(),
        raw: z.string(),
      }),
    )
    .nullish()
    .transform((value) => value ?? []),
})
export interface SystemLogFilter {
  keyword: string
  priority: string
  service: string
}
