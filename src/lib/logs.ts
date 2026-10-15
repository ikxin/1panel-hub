import type { NodeConfig } from './nodes'
import { panelRequest } from './panel'
import { pageSchema, parseResponse, stringList } from '../types/management'
import type { ResourceSearch, ResourcePage } from '../types/management'
import {
  loginLogSchema,
  operationLogSchema,
  systemLogSchema,
  systemLogStatusSchema,
} from '../types/logs'
import type { AuditLog, AuditLogKind, SystemLogFilter } from '../types/logs'

export async function searchAuditLogs(
  node: NodeConfig,
  kind: AuditLogKind,
  search: ResourceSearch,
  status: string,
  signal: AbortSignal,
): Promise<ResourcePage<AuditLog>> {
  const result = await panelRequest(node, `/core/logs/${kind}`, signal, {
    method: 'POST',
    body: {
      page: search.page,
      pageSize: search.pageSize,
      status,
      ...(kind === 'operation'
        ? { operation: search.name, source: '', node: '' }
        : { info: search.name }),
    },
  })
  if (kind === 'operation') {
    const page = parseResponse(pageSchema(operationLogSchema), result)
    return {
      total: page.total,
      items: page.items.map((item) => ({
        id: item.id,
        time: item.createdAt,
        status: item.status,
        user: item.user || item.apiKeyName || '—',
        ip: item.ip,
        summary: item.detailZH || item.message || `${item.method} ${item.path}`,
        details: [
          { label: '请求', value: `${item.method} ${item.path}` },
          { label: '操作描述', value: item.detailZH },
          { label: '返回消息', value: item.message },
          { label: '来源', value: item.source },
          { label: '目标节点', value: item.node || '本机' },
          { label: '耗时', value: `${(item.latency / 1000000).toFixed(2)} ms` },
          { label: '客户端', value: item.userAgent },
        ],
      })),
    }
  }
  const page = parseResponse(pageSchema(loginLogSchema), result)
  return {
    total: page.total,
    items: page.items.map((item) => ({
      id: item.id,
      time: item.createdAt,
      status: item.status,
      user: item.user || '—',
      ip: item.ip,
      summary: item.message || `${item.user || '用户'}登录`,
      details: [
        { label: '消息', value: item.message },
        { label: '归属地', value: item.address },
        { label: '客户端', value: item.agent },
      ],
    })),
  }
}
export async function cleanAuditLogs(node: NodeConfig, kind: AuditLogKind, signal: AbortSignal) {
  await panelRequest(node, '/core/logs/clean', signal, { method: 'POST', body: { logType: kind } })
}
export async function fetchSystemLogStatus(node: NodeConfig, signal: AbortSignal) {
  return parseResponse(
    systemLogStatusSchema,
    await panelRequest(node, '/logs/system/status', signal),
  )
}
export async function fetchSystemLogServices(node: NodeConfig, signal: AbortSignal) {
  return parseResponse(stringList, await panelRequest(node, '/logs/system/services', signal))
}
export async function fetchSystemLogs(
  node: NodeConfig,
  filter: SystemLogFilter,
  cursor: string,
  signal: AbortSignal,
) {
  return parseResponse(
    systemLogSchema,
    await panelRequest(node, '/logs/system/read', signal, {
      method: 'POST',
      timeoutMs: 40000,
      body: { ...filter, cursor, pageSize: 100 },
    }),
  )
}
