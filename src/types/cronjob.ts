import { z } from 'zod'
import { stringList } from './management'

export const cronjobSchema = z.object({
  id: z.number(),
  name: z.string(),
  type: z.string(),
  spec: z.string(),
  status: z.string(),
  lastRecordStatus: z.string().optional(),
  lastRecordTime: z.string().optional(),
  retainCopies: z.number(),
  retryTimes: z.number(),
  timeout: z.number(),
})
// 编辑时保留未在此页面展示的备份目标、告警与容器执行配置。
export const cronjobDetailSchema = z.looseObject({
  id: z.number(),
  name: z.string(),
  type: z.string(),
  spec: z.string(),
  script: z.string(),
  scriptMode: z.string(),
  executor: z.string(),
  url: z.string(),
  retainCopies: z.number(),
  retryTimes: z.number(),
  timeout: z.number(),
  scopes: stringList,
})
export const cronjobRecordSchema = z.object({
  id: z.number(),
  startTime: z.string(),
  status: z.string(),
  message: z.string(),
  interval: z.number(),
  taskID: z.string(),
  records: z.string(),
  targetPath: z.string(),
})
export type Cronjob = z.infer<typeof cronjobSchema>
export type CronjobDetail = z.infer<typeof cronjobDetailSchema>
export type CronjobRecord = z.infer<typeof cronjobRecordSchema>
export type CronjobValues = Record<string, unknown> & {
  name: string
  type: string
  spec: string
  script: string
  executor: string
  url: string
  retainCopies: number
  retryTimes: number
  timeout: number
  scopes: string[]
}
export const cronjobTypeLabels: Record<string, string> = {
  shell: '执行脚本',
  curl: '访问 URL',
  ntp: '同步时间',
  cleanLog: '清理网站日志',
  clean: '清理系统',
  website: '备份网站',
  database: '备份数据库',
  app: '备份应用',
  directory: '备份目录',
  snapshot: '面板快照',
  cutWebsiteLog: '切割网站日志',
}
export const creatableCronjobTypes = ['shell', 'curl', 'ntp', 'cleanLog'] as const
