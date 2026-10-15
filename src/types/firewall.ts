import { z } from 'zod'
import { pageSchema } from './management'

export const firewallProviders = ['iptables', 'nftables', 'firewalld', 'ufw'] as const
export type FirewallProvider = (typeof firewallProviders)[number]
export const firewallBaseSchema = z.object({
  name: z.string(),
  backend: z.string(),
  version: z.string(),
  isExist: z.boolean(),
  isActive: z.boolean(),
  isInit: z.boolean(),
  isBind: z.boolean(),
  pingStatus: z.string(),
  message: z.string().optional(),
  reason: z.string().optional(),
  lifecycleTaskID: z.string().optional(),
})
export const firewallScopeSchema = z.object({
  provider: z.enum(firewallProviders),
  family: z.enum(['ipv4', 'ipv6', 'inet']),
  direction: z.literal('input'),
  table: z.string().optional(),
  chain: z.string().optional(),
  zone: z.string().optional(),
})
export const firewallRuleSchema = z.object({
  uuid: z.string().optional(),
  scope: firewallScopeSchema,
  protocol: z.string(),
  action: z.string(),
  sourceAddress: z.string().optional(),
  sourcePort: z.string().optional(),
  destinationAddress: z.string().optional(),
  destinationPort: z.string().optional(),
  interface: z.string().optional(),
  connectionStates: z.array(z.string()).optional(),
  priority: z.number().optional(),
  orderIndex: z.number().optional(),
  description: z.string().optional(),
})
export const firewallItemSchema = z.object({
  rule: firewallRuleSchema,
  state: z.string(),
  match: z.string(),
  incompatible: z.boolean().optional(),
  error: z.string().optional(),
  observed: z
    .object({ protected: z.boolean(), parseStatus: z.string(), raw: z.string().optional() })
    .optional(),
  desired: z.object({ uuid: z.string(), protected: z.boolean().optional() }).optional(),
})
export const firewallInventorySchema = pageSchema(firewallItemSchema).extend({
  allTotal: z.number(),
  managedTotal: z.number(),
})
export type FirewallBase = z.infer<typeof firewallBaseSchema>
export type FirewallScope = z.infer<typeof firewallScopeSchema>
export type FirewallRule = z.infer<typeof firewallRuleSchema>
export type FirewallItem = z.infer<typeof firewallItemSchema>
export type FirewallRuleValues = Record<string, unknown> & {
  family: 'ipv4' | 'ipv6' | 'inet'
  protocol: string
  action: string
  sourceAddress: string
  destinationPort: string
  description: string
}
