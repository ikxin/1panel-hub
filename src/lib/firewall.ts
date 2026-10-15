import { z } from 'zod'
import type { NodeConfig } from './nodes'
import { panelRequest } from './panel'
import { waitForPanelTask } from './panelTask'
import { parseResponse } from '../types/management'
import type { ResourceSearch } from '../types/management'
import { firewallBaseSchema, firewallInventorySchema } from '../types/firewall'
import type {
  FirewallItem,
  FirewallProvider,
  FirewallRuleValues,
  FirewallScope,
} from '../types/firewall'

export function firewallScopes(provider: FirewallProvider): FirewallScope[] {
  if (provider === 'firewalld')
    return [{ provider, family: 'inet', zone: 'public', direction: 'input' }]
  if (provider === 'ufw')
    return [{ provider, family: 'inet', chain: 'incoming', direction: 'input' }]
  return (['ipv4', 'ipv6'] as const).flatMap((family) =>
    ['1PANEL_BASIC_BEFORE', '1PANEL_BASIC', '1PANEL_BASIC_AFTER'].map((chain) => ({
      provider,
      family,
      chain,
      table: 'filter',
      direction: 'input' as const,
    })),
  )
}
export async function fetchFirewallBase(node: NodeConfig, signal: AbortSignal) {
  return parseResponse(
    firewallBaseSchema,
    await panelRequest(node, '/hosts/firewall/base', signal, {
      method: 'POST',
      body: { name: 'base' },
      timeoutMs: 40000,
    }),
  )
}
export async function searchFirewallRules(
  node: NodeConfig,
  provider: FirewallProvider,
  search: ResourceSearch,
  action: string,
  signal: AbortSignal,
) {
  return parseResponse(
    firewallInventorySchema,
    await panelRequest(node, '/hosts/firewall/rules/search', signal, {
      method: 'POST',
      timeoutMs: 40000,
      body: {
        page: search.page,
        pageSize: search.pageSize,
        info: search.name,
        scopes: firewallScopes(provider),
        actions: action ? [action] : [],
        refresh: true,
      },
    }),
  )
}
const resultSchema = z
  .object({
    taskID: z.string().optional(),
    queued: z.boolean().optional(),
    failed: z.number().optional(),
    skipped: z.number().optional(),
    errors: z.array(z.object({ error: z.string().optional() })).nullish(),
  })
  .nullish()
async function completeFirewallOperation(
  node: NodeConfig,
  path: string,
  body: unknown,
  signal: AbortSignal,
) {
  const result = parseResponse(
    resultSchema,
    await panelRequest(node, path, signal, { method: 'POST', body, timeoutMs: 60000 }),
  )
  if (result?.taskID) await waitForPanelTask(node, result.taskID, signal)
  else if (result?.queued) throw new Error('操作已进入后台队列，但未返回任务编号，请刷新确认结果')
  if (result?.failed || result?.skipped)
    throw new Error(
      result.errors
        ?.map((item) => item.error)
        .filter(Boolean)
        .join('；') || '部分规则未能应用，请刷新列表确认',
    )
}
export async function operateFirewall(node: NodeConfig, operation: string, signal: AbortSignal) {
  if (['init-base', 'bind-base', 'unbind-base'].includes(operation)) {
    await completeFirewallOperation(
      node,
      '/hosts/firewall/filter/operate',
      { name: '1PANEL_BASIC', operate: operation },
      signal,
    )
  } else {
    await completeFirewallOperation(
      node,
      '/hosts/firewall/operate',
      { operation, withDockerRestart: false },
      signal,
    )
  }
}
export function canEditFirewallRule(item: FirewallItem) {
  return Boolean(
    item.desired?.uuid &&
    !item.desired.protected &&
    !item.observed?.protected &&
    !item.incompatible &&
    (!item.observed || item.observed.parseStatus === 'supported') &&
    ['tcp', 'udp', 'all'].includes(item.rule.protocol),
  )
}
function validatePorts(value: string) {
  return value.split(',').every((part) => {
    if (!/^\d+([:-]\d+)?$/.test(part)) return false
    const [start, end = start] = part.split(/[:-]/).map(Number)
    return start >= 1 && end <= 65535 && start <= end
  })
}
export async function saveFirewallRule(
  node: NodeConfig,
  provider: FirewallProvider,
  values: FirewallRuleValues,
  item: FirewallItem | undefined,
  signal: AbortSignal,
) {
  const sourceAddress = values.sourceAddress.trim()
  const destinationPort = values.destinationPort.replace(/\s/g, '').replace(/-/g, ':')
  if (sourceAddress) {
    const schema =
      values.family === 'ipv4'
        ? z.union([z.ipv4(), z.cidrv4()])
        : values.family === 'ipv6'
          ? z.union([z.ipv6(), z.cidrv6()])
          : z.union([z.ipv4(), z.ipv6(), z.cidrv4(), z.cidrv6()])
    if (!schema.safeParse(sourceAddress).success)
      throw new Error('来源地址必须是与所选地址族一致的 IP 或 CIDR 网段')
  }
  if (destinationPort && !validatePorts(destinationPort))
    throw new Error('端口范围为 1–65535，多个端口用逗号分隔，范围用冒号连接')
  if (!sourceAddress && !destinationPort)
    throw new Error('请至少指定来源地址或目标端口，避免创建匹配所有流量的规则')
  if (values.protocol === 'all' && destinationPort && !(provider === 'ufw' && item))
    throw new Error('指定端口时请选择 TCP 或 UDP 协议')
  const scope = item?.rule.scope ?? {
    ...firewallScopes(provider)[0],
    family: values.family,
    ...(provider === 'iptables' || provider === 'nftables' ? { chain: '1PANEL_BASIC' } : {}),
  }
  const rule = {
    ...item?.rule,
    scope,
    sourceAddress,
    destinationPort,
    protocol: values.protocol,
    action: values.action,
    description: values.description.trim(),
  }
  if (item) {
    if (!canEditFirewallRule(item)) throw new Error('此规则由系统或外部服务管理，无法在此修改')
    await completeFirewallOperation(
      node,
      '/hosts/firewall/rules/update',
      { uuid: item.desired!.uuid, rule },
      signal,
    )
  } else {
    await completeFirewallOperation(
      node,
      '/hosts/firewall/rules',
      { items: [{ rule, sourceKind: 'user' }] },
      signal,
    )
  }
}
export async function deleteFirewallRule(
  node: NodeConfig,
  item: FirewallItem,
  signal: AbortSignal,
) {
  if (!canEditFirewallRule(item)) throw new Error('此规则不可删除')
  await completeFirewallOperation(
    node,
    '/hosts/firewall/rules/delete',
    { uuids: [item.desired!.uuid] },
    signal,
  )
}
