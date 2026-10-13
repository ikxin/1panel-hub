import { z } from 'zod'
import type { NodeConfig } from './nodes'
import { panelRequest } from './panel'
import { waitForPanelTask } from './panelTask'
import { pageSchema, parseResponse } from '../types/management'
import type { ResourcePage, ResourceSearch } from '../types/management'
import {
  containerSchema,
  imageSchema,
  networkSchema,
  volumeSchema,
  containerCountsSchema,
  containerStatsSchema,
} from '../types/container'
import type {
  ContainerCreateValues,
  ContainerOperation,
  ContainerResource,
  ContainerTab,
} from '../types/container'
import { containerCreateBody, resourceId, textLines } from '../utils/container'

export async function searchContainerResources(
  node: NodeConfig,
  tab: ContainerTab,
  search: ResourceSearch,
  state: string,
  signal: AbortSignal,
): Promise<ResourcePage<ContainerResource>> {
  const path = tab === 'container' ? '/containers/search' : `/containers/${tab}/search`
  const raw = await panelRequest(node, path, signal, {
    method: 'POST',
    timeoutMs: 40000,
    body: {
      ...search,
      info: search.name,
      state,
      filters: '',
      orderBy: 'createdAt',
      order: 'descending',
    },
  })
  switch (tab) {
    case 'container': {
      const result = parseResponse(pageSchema(containerSchema), raw)
      return {
        total: result.total,
        items: result.items.map((data) => ({ kind: 'container', data })),
      }
    }
    case 'image': {
      const result = parseResponse(pageSchema(imageSchema), raw)
      return { total: result.total, items: result.items.map((data) => ({ kind: 'image', data })) }
    }
    case 'network': {
      const result = parseResponse(pageSchema(networkSchema), raw)
      return { total: result.total, items: result.items.map((data) => ({ kind: 'network', data })) }
    }
    case 'volume': {
      const result = parseResponse(pageSchema(volumeSchema), raw)
      return { total: result.total, items: result.items.map((data) => ({ kind: 'volume', data })) }
    }
  }
}
export async function fetchContainerCounts(node: NodeConfig, signal: AbortSignal) {
  return parseResponse(
    containerCountsSchema,
    await panelRequest(node, '/containers/status', signal, { timeoutMs: 40000 }),
  )
}
export async function fetchContainerStats(node: NodeConfig, signal: AbortSignal) {
  return (
    parseResponse(
      z.array(containerStatsSchema).nullable(),
      await panelRequest(node, '/containers/list/stats', signal, { timeoutMs: 40000 }),
    ) ?? []
  )
}
export async function fetchDockerStatus(node: NodeConfig, signal: AbortSignal) {
  return parseResponse(
    z.object({ isActive: z.boolean(), isExist: z.boolean() }),
    await panelRequest(node, '/containers/docker/status', signal),
  )
}
export async function fetchContainerNetworks(node: NodeConfig, signal: AbortSignal) {
  return (
    parseResponse(
      z.array(z.object({ option: z.string() })).nullable(),
      await panelRequest(node, '/containers/network', signal),
    ) ?? []
  )
}
export async function operateContainer(
  node: NodeConfig,
  name: string,
  operation: ContainerOperation,
  signal: AbortSignal,
) {
  const taskID = crypto.randomUUID()
  await panelRequest(node, '/containers/operate', signal, {
    method: 'POST',
    timeoutMs: 40000,
    body: { taskID, names: [name], operation },
  })
  await waitForPanelTask(node, taskID, signal)
}
export async function createContainer(
  node: NodeConfig,
  values: ContainerCreateValues,
  signal: AbortSignal,
) {
  const body = containerCreateBody(values)
  const taskID = crypto.randomUUID()
  await panelRequest(node, '/containers', signal, {
    method: 'POST',
    timeoutMs: 40000,
    body: { ...body, taskID },
  })
  await waitForPanelTask(node, taskID, signal)
}
export async function pullImage(node: NodeConfig, names: string, signal: AbortSignal) {
  const imageName = textLines(names)
  if (!imageName.length || imageName.some((name) => /\s/.test(name)))
    throw new Error('请填写镜像名称，每行一个')
  const taskID = crypto.randomUUID()
  await panelRequest(node, '/containers/image/pull', signal, {
    method: 'POST',
    timeoutMs: 40000,
    body: { taskID, repoID: 0, imageName },
  })
  await waitForPanelTask(node, taskID, signal)
}
export async function deleteContainerResource(
  node: NodeConfig,
  resource: ContainerResource,
  signal: AbortSignal,
) {
  if (resource.kind === 'container')
    return operateContainer(node, resource.data.name, 'remove', signal)
  const taskID = crypto.randomUUID()
  await panelRequest(
    node,
    `/containers/${resource.kind}/${resource.kind === 'image' ? 'remove' : 'del'}`,
    signal,
    {
      method: 'POST',
      timeoutMs: 40000,
      body: { taskID, names: [resourceId(resource)], force: false },
    },
  )
  if (resource.kind === 'image') await waitForPanelTask(node, taskID, signal)
}
export async function createNetwork(
  node: NodeConfig,
  values: { name: string; subnet: string; gateway: string },
  signal: AbortSignal,
) {
  if (!/^[a-z\d][a-z\d_.-]*$/i.test(values.name)) throw new Error('请输入有效的网络名称')
  await panelRequest(node, '/containers/network', signal, {
    method: 'POST',
    body: {
      ...values,
      driver: 'bridge',
      ipv4: true,
      ipv6: false,
      options: [],
      labels: [],
      ipRange: '',
      auxAddress: [],
    },
  })
}
export async function createVolume(node: NodeConfig, name: string, signal: AbortSignal) {
  if (!/^[a-z\d][a-z\d_.-]*$/i.test(name)) throw new Error('请输入有效的存储卷名称')
  await panelRequest(node, '/containers/volume', signal, {
    method: 'POST',
    body: { name, driver: 'local', options: [], labels: [] },
  })
}
export async function inspectContainerResource(
  node: NodeConfig,
  resource: ContainerResource,
  signal: AbortSignal,
) {
  return parseResponse(
    z.string(),
    await panelRequest(node, '/containers/inspect', signal, {
      method: 'POST',
      body: { id: resourceId(resource), type: resource.kind, detail: '' },
    }),
  )
}
export async function fetchContainerLogs(node: NodeConfig, name: string, signal: AbortSignal) {
  const blob = await panelRequest<Blob>(node, '/containers/download/log', signal, {
    method: 'POST',
    timeoutMs: 40000,
    responseType: 'blob',
    body: { container: name, since: '24h', tail: 200, containerType: 'container' },
  })
  return blob.text()
}
