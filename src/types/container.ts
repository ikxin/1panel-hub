import { z } from 'zod'
import { stringList } from './management'

export const containerTabs = [
  { value: 'container', label: '容器' },
  { value: 'image', label: '镜像' },
  { value: 'network', label: '网络' },
  { value: 'volume', label: '存储卷' },
] as const
export type ContainerTab = (typeof containerTabs)[number]['value']
export type ContainerOperation = 'start' | 'stop' | 'restart' | 'pause' | 'unpause' | 'remove'
export const containerSchema = z.object({
  containerID: z.string(),
  name: z.string(),
  imageName: z.string(),
  state: z.string(),
  createTime: z.string(),
  runTime: z.string().default(''),
  network: stringList,
  ports: stringList,
  isFromApp: z.boolean().default(false),
  isFromCompose: z.boolean().default(false),
})
export const imageSchema = z.object({
  id: z.string(),
  tags: stringList,
  size: z.number(),
  createdAt: z.string(),
  isUsed: z.boolean(),
})
export const networkSchema = z.object({
  id: z.string(),
  name: z.string(),
  driver: z.string(),
  subnet: z.string(),
  gateway: z.string(),
  createdAt: z.string(),
  labels: stringList,
})
export const volumeSchema = z.object({
  name: z.string(),
  driver: z.string(),
  mountpoint: z.string(),
  createdAt: z.string(),
})
export const containerCountsSchema = z.object({
  containerCount: z.number(),
  running: z.number(),
  paused: z.number(),
  exited: z.number(),
  imageCount: z.number(),
  networkCount: z.number(),
  volumeCount: z.number(),
})
export const containerStatsSchema = z.object({
  containerID: z.string(),
  cpuPercent: z.number(),
  memoryPercent: z.number(),
  memoryUsage: z.number(),
  memoryLimit: z.number(),
})
export type Container = z.infer<typeof containerSchema>
export type ContainerStats = z.infer<typeof containerStatsSchema>
export type ContainerResource =
  | { kind: 'container'; data: Container }
  | { kind: 'image'; data: z.infer<typeof imageSchema> }
  | { kind: 'network'; data: z.infer<typeof networkSchema> }
  | { kind: 'volume'; data: z.infer<typeof volumeSchema> }
export type ContainerCreateValues = {
  name: string
  image: string
  network: string
  restartPolicy: string
  ports: string
  volumes: string
  env: string
  memory: number
  cpus: number
  forcePull: boolean
}
