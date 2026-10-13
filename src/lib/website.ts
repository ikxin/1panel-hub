import { z } from 'zod'
import type { NodeConfig } from './nodes'
import { panelRequest } from './panel'
import { waitForPanelTask } from './panelTask'
import { pageSchema, parseResponse } from '../types/management'
import type { ResourceSearch } from '../types/management'
import {
  domainSchema,
  websiteSchema,
  websiteDetailSchema,
  websiteGroupSchema,
} from '../types/website'
import type { WebsiteCreateValues, WebsiteDetail } from '../types/website'
import { parseDomains } from '../utils/website'

export async function searchWebsites(
  node: NodeConfig,
  search: ResourceSearch,
  type: string,
  group: number,
  signal: AbortSignal,
) {
  return parseResponse(
    pageSchema(websiteSchema),
    await panelRequest(node, '/websites/search', signal, {
      method: 'POST',
      body: { ...search, type, websiteGroupId: group, orderBy: 'created_at', order: 'descending' },
    }),
  )
}
export async function fetchWebsiteGroups(node: NodeConfig, signal: AbortSignal) {
  return (
    parseResponse(
      z.array(websiteGroupSchema).nullable(),
      await panelRequest(node, '/groups/search', signal, {
        method: 'POST',
        body: { type: 'website' },
      }),
    ) ?? []
  )
}
export async function createWebsite(
  node: NodeConfig,
  values: WebsiteCreateValues,
  signal: AbortSignal,
) {
  const taskID = crypto.randomUUID()
  if (!['static', 'proxy'].includes(values.type)) throw new Error('请选择网站类型')
  if (!values.webSiteGroupId) throw new Error('请选择网站分组')
  if (!/^[a-z\d][a-z\d_.-]{0,99}$/i.test(values.alias) || values.alias === 'default')
    throw new Error('网站代号请使用字母、数字、点、下划线或连字符，且不能为 default')
  if (values.type === 'proxy') {
    try {
      const url = new URL(values.proxy)
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password)
        throw new Error()
    } catch {
      throw new Error('请输入有效的 HTTP 或 HTTPS 代理地址')
    }
  }
  await panelRequest(node, '/websites', signal, {
    method: 'POST',
    timeoutMs: 40000,
    body: {
      ...values,
      domains: parseDomains(values.domains, values.port),
      appType: 'installed',
      proxyType: 'tcp',
      enableSSL: false,
      taskID,
    },
  })
  await waitForPanelTask(node, taskID, signal)
}
export async function operateWebsite(
  node: NodeConfig,
  id: number,
  operate: 'start' | 'stop',
  signal: AbortSignal,
) {
  await panelRequest(node, '/websites/operate', signal, { method: 'POST', body: { id, operate } })
}
export async function deleteWebsite(node: NodeConfig, id: number, signal: AbortSignal) {
  await panelRequest(node, '/websites/del', signal, {
    method: 'POST',
    timeoutMs: 40000,
    body: { id, deleteApp: false, deleteBackup: false, forceDelete: false, deleteDB: false },
  })
}
export async function fetchWebsiteDetail(node: NodeConfig, id: number, signal: AbortSignal) {
  return parseResponse(websiteDetailSchema, await panelRequest(node, `/websites/${id}`, signal))
}
export async function updateWebsite(node: NodeConfig, detail: WebsiteDetail, signal: AbortSignal) {
  await panelRequest(node, '/websites/update', signal, { method: 'POST', body: detail })
}
export async function fetchDomains(node: NodeConfig, id: number, signal: AbortSignal) {
  return (
    parseResponse(
      z.array(domainSchema).nullable(),
      await panelRequest(node, `/websites/domains/${id}`, signal),
    ) ?? []
  )
}
export async function createDomains(
  node: NodeConfig,
  websiteID: number,
  domains: string,
  port: number,
  signal: AbortSignal,
) {
  await panelRequest(node, '/websites/domains', signal, {
    method: 'POST',
    body: { websiteID, domains: parseDomains(domains, port) },
  })
}
export async function deleteDomain(node: NodeConfig, id: number, signal: AbortSignal) {
  await panelRequest(node, '/websites/domains/del/', signal, { method: 'POST', body: { id } })
}
export async function fetchWebsiteLog(
  node: NodeConfig,
  id: number,
  logType: string,
  signal: AbortSignal,
) {
  return parseResponse(
    z.object({ content: z.string(), enable: z.boolean(), path: z.string().default('') }),
    await panelRequest(node, '/websites/log/search', signal, {
      method: 'POST',
      body: { id, logType: `${logType}.log`, page: 1, pageSize: 100 },
    }),
  )
}
