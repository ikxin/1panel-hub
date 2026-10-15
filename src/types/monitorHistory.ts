import { z } from 'zod'
import type { MonitorKind, MonitorSample } from './monitor'

export const monitorSettingsSchema = z.object({
  monitorStatus: z.string(),
  monitorInterval: z.string(),
  monitorStoreDays: z.string(),
  defaultNetwork: z.string(),
  defaultIO: z.string(),
})
export const monitorDataSchema = z
  .array(
    z.object({
      param: z.string(),
      date: z
        .array(z.string())
        .nullish()
        .transform((value) => value ?? []),
      value: z
        .array(
          z.object({
            cpu: z.number().optional(),
            memory: z.number().optional(),
            cpuLoad1: z.number().optional(),
            cpuLoad5: z.number().optional(),
            cpuLoad15: z.number().optional(),
            read: z.number().optional(),
            write: z.number().optional(),
            up: z.number().optional(),
            down: z.number().optional(),
          }),
        )
        .nullish()
        .transform((value) => value ?? []),
    }),
  )
  .nullable()
export type MonitorSettings = z.infer<typeof monitorSettingsSchema>
export type MonitorHistory = Record<MonitorKind, MonitorSample[]>
export interface MonitorRange {
  start: number
  end: number
}
