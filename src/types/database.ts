import { z } from 'zod'

export const databaseEngines = [
  { value: 'mysql', label: 'MySQL / MariaDB' },
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'mongodb', label: 'MongoDB' },
  { value: 'redis', label: 'Redis' },
] as const
export type DatabaseEngine = (typeof databaseEngines)[number]['value']
export const databaseInstanceSchema = z.object({
  id: z.number(),
  database: z.string(),
  type: z.string(),
  from: z.string(),
  version: z.string().default(''),
  address: z.string().default(''),
})
export const databaseSchema = z.object({
  id: z.number(),
  name: z.string(),
  from: z.string(),
  createdAt: z.string().optional(),
  format: z.string().default(''),
  username: z.string().default(''),
  permission: z.string().default(''),
  description: z.string().default(''),
  authorizedUsers: z.array(z.object({ username: z.string(), host: z.string() })).nullish(),
})
export const redisStatusSchema = z.object({
  connected_clients: z.string(),
  used_memory: z.string(),
  instantaneous_ops_per_sec: z.string(),
  uptime_in_days: z.string(),
  total_commands_processed: z.string(),
  keyspace_hits: z.string(),
  keyspace_misses: z.string(),
})
export type DatabaseInstance = z.infer<typeof databaseInstanceSchema>
export type Database = z.infer<typeof databaseSchema>
export type DatabaseCreateValues = {
  name: string
  username: string
  password: string
  format: string
  permission: string
  description: string
}
