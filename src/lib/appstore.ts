import { z } from 'zod'
import type { NodeConfig } from './nodes'
import { panelRequest } from './panel'
import {
  appDetailSchema,
  appInfoSchema,
  appResourceSchema,
  appServiceSchema,
  appTagSchema,
  appVersionSchema,
  catalogAppSchema,
  installedAppSchema,
} from '../types/appstore'
import type { AppInstallValues, AppOperation, AppSearch, AppVersion } from '../types/appstore'

function parse<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) throw new Error('节点返回的应用数据格式不兼容，请检查 1Panel 版本')
  return result.data
}

const pageSchema = <T>(item: z.ZodType<T>) =>
  z.object({
    total: z.number().int().nonnegative(),
    items: z
      .array(item)
      .nullish()
      .transform((value) => value ?? []),
  })

export async function fetchAppTags(node: NodeConfig, signal: AbortSignal) {
  return (
    parse(z.array(appTagSchema).nullable(), await panelRequest(node, '/apps/tags', signal)) ?? []
  )
}

export async function searchCatalog(node: NodeConfig, search: AppSearch, signal: AbortSignal) {
  const { page, pageSize, name, tags, resource, recommend, showCurrentArch } = search
  const data = await panelRequest(node, '/apps/search', signal, {
    method: 'POST',
    body: { page, pageSize, name, tags, resource, recommend, showCurrentArch },
  })
  return parse(pageSchema(catalogAppSchema), data)
}

export async function searchInstalled(node: NodeConfig, search: AppSearch, signal: AbortSignal) {
  const { page, pageSize, name, tags, update } = search
  const data = await panelRequest(node, '/apps/installed/search', signal, {
    method: 'POST',
    body: { page, pageSize, name, tags, update, sync: true, checkUpdate: true },
    timeoutMs: 40000,
  })
  const result = parse(pageSchema(installedAppSchema), data)
  // 1Panel 的可升级筛选返回完整列表，需要在客户端分页。
  return update
    ? { ...result, items: result.items.slice((page - 1) * pageSize, page * pageSize) }
    : result
}

export async function fetchAppInfo(node: NodeConfig, key: string, signal: AbortSignal) {
  return parse(appInfoSchema, await panelRequest(node, `/apps/${encodeURIComponent(key)}`, signal))
}

export async function fetchAppDetail(
  node: NodeConfig,
  id: number,
  version: string,
  signal: AbortSignal,
) {
  const detail = parse(
    appDetailSchema,
    await panelRequest(node, `/apps/detail/${id}/${encodeURIComponent(version)}/app`, signal, {
      timeoutMs: 40000,
    }),
  )
  if (detail.params.formFields.some((field) => field.envKey === 'WEBSITE_DIR')) {
    const directory = parse(z.string(), await panelRequest(node, '/settings/website/dir', signal))
    detail.params.formFields = detail.params.formFields.map((field) =>
      field.envKey === 'WEBSITE_DIR' ? { ...field, default: directory } : field,
    )
  }
  return detail
}

export async function fetchAppServices(node: NodeConfig, key: string, signal: AbortSignal) {
  return (
    parse(
      z.array(appServiceSchema).nullable(),
      await panelRequest(node, `/apps/services/${encodeURIComponent(key)}`, signal),
    ) ?? []
  )
}

export async function fetchAppVersions(
  node: NodeConfig,
  id: number,
  signal: AbortSignal,
  version?: string,
) {
  return (
    parse(
      z.array(appVersionSchema).nullable(),
      await panelRequest(node, '/apps/installed/update/versions', signal, {
        method: 'POST',
        body: { appInstallID: id, updateVersion: version },
        timeoutMs: 40000,
      }),
    ) ?? []
  )
}

export async function fetchAppResources(node: NodeConfig, id: number, signal: AbortSignal) {
  return (
    parse(
      z.array(appResourceSchema).nullable(),
      await panelRequest(node, `/apps/installed/delete/check/${id}`, signal),
    ) ?? []
  )
}

export function fetchAppIcon(node: NodeConfig, key: string, signal: AbortSignal) {
  return panelRequest<Blob>(
    node,
    `/apps/icon/${encodeURIComponent(key)}?operateNode=local`,
    signal,
    { responseType: 'blob' },
  )
}

export async function installApp(
  node: NodeConfig,
  detailId: number,
  values: AppInstallValues,
  signal: AbortSignal,
) {
  await panelRequest(node, '/apps/install', signal, {
    method: 'POST',
    timeoutMs: 40000,
    body: {
      ...values,
      name: values.name.trim(),
      appDetailId: detailId,
      taskID: crypto.randomUUID(),
      advanced: true,
      restartPolicy: 'always',
      memoryUnit: 'M',
      cpuQuota: 0,
      memoryLimit: 0,
    },
  })
}

export async function operateApp(
  node: NodeConfig,
  id: number,
  operate: AppOperation,
  signal: AbortSignal,
  version?: AppVersion,
) {
  // 卸载保留备份和镜像，不强制移除依赖；升级前由节点创建备份。
  await panelRequest(node, '/apps/installed/op', signal, {
    method: 'POST',
    timeoutMs: 40000,
    body: {
      installId: id,
      operate,
      taskID: crypto.randomUUID(),
      forceDelete: false,
      deleteBackup: false,
      deleteImage: false,
      deleteDB: false,
      backup: true,
      pullImage: true,
      detailId: version?.detailId,
      dockerCompose: version?.dockerCompose,
    },
  })
}

export async function syncAppCatalog(
  node: NodeConfig,
  source: 'remote' | 'local',
  signal: AbortSignal,
) {
  if (source === 'remote') {
    const state = parse(
      z.object({ canUpdate: z.boolean(), isSyncing: z.boolean() }),
      await panelRequest(node, '/apps/checkupdate', signal, { timeoutMs: 40000 }),
    )
    if (state.isSyncing) throw new Error('节点正在同步应用目录，请稍后刷新')
    if (!state.canUpdate) return null
  }
  const taskID = crypto.randomUUID()
  await panelRequest(node, `/apps/sync/${source}`, signal, {
    method: 'POST',
    body: { taskID },
    timeoutMs: 40000,
  })
  return taskID
}

export async function fetchAppTask(node: NodeConfig, taskID: string, signal: AbortSignal) {
  return parse(
    z.object({ taskStatus: z.string(), lines: z.array(z.string()).nullish() }),
    await panelRequest(node, '/logs/tasks/read', signal, {
      method: 'POST',
      body: { taskID, type: 'task', page: 1, pageSize: 30, latest: true },
      timeoutMs: 40000,
    }),
  )
}
