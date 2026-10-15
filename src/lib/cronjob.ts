import { z } from 'zod'
import type { NodeConfig } from './nodes'
import { panelRequest } from './panel'
import { pageSchema, parseResponse, stringList } from '../types/management'
import type { ResourceSearch } from '../types/management'
import { cronjobDetailSchema, cronjobRecordSchema, cronjobSchema } from '../types/cronjob'
import type { CronjobDetail, CronjobValues } from '../types/cronjob'

export async function searchCronjobs(
  node: NodeConfig,
  search: ResourceSearch,
  signal: AbortSignal,
) {
  return parseResponse(
    pageSchema(cronjobSchema),
    await panelRequest(node, '/cronjobs/search', signal, {
      method: 'POST',
      body: {
        page: search.page,
        pageSize: search.pageSize,
        info: search.name,
        groupIDs: [],
        orderBy: 'createdAt',
        order: 'descending',
      },
    }),
  )
}
export async function fetchCronjob(node: NodeConfig, id: number, signal: AbortSignal) {
  return parseResponse(
    cronjobDetailSchema,
    await panelRequest(node, '/cronjobs/load/info', signal, { method: 'POST', body: { id } }),
  )
}
export async function previewCronSchedule(node: NodeConfig, spec: string, signal: AbortSignal) {
  const specs = spec.split('&&').map((item) => item.trim())
  if (specs.some((item) => !item)) throw new Error('请填写完整的 Cron 表达式')
  if (specs.length > 10) throw new Error('最多设置 10 个执行周期')
  if (specs.some((item) => item.startsWith('@every') && !/^@every [1-9]\d*[sm]$/.test(item)))
    throw new Error('固定间隔请使用 @every 30s 或 @every 5m 格式')
  const times = await Promise.all(
    specs.map(async (item) =>
      parseResponse(
        stringList,
        await panelRequest(node, '/cronjobs/next', signal, {
          method: 'POST',
          body: { spec: item },
        }),
      ),
    ),
  )
  return [...new Set(times.flat())].sort().slice(0, 5)
}
export async function saveCronjob(
  node: NodeConfig,
  values: CronjobValues,
  original: CronjobDetail | undefined,
  signal: AbortSignal,
) {
  if (!values.name.trim()) throw new Error('请输入任务名称')
  if (
    values.name.includes('/') ||
    values.name.includes('\\') ||
    values.name === '.' ||
    values.name === '..'
  )
    throw new Error('任务名称不能包含路径分隔符')
  for (const [label, value, min] of [
    ['保留份数', values.retainCopies, 1],
    ['重试次数', values.retryTimes, 0],
    ['超时时间', values.timeout, 1],
  ] as const) {
    if (!Number.isInteger(value) || value < min) throw new Error(`${label}需为不小于 ${min} 的整数`)
  }
  const type = original?.type ?? values.type
  if (type === 'shell' && (!original || original.scriptMode === 'input') && !values.script?.trim())
    throw new Error('请输入要执行的脚本')
  if (type === 'curl') {
    const urls = (values.url ?? '')
      .split(/[\n,]/)
      .map((value) => value.trim())
      .filter(Boolean)
    if (!urls.length) throw new Error('请至少填写一个 URL')
    for (const value of urls) {
      let url: URL
      try {
        url = new URL(value)
      } catch {
        throw new Error(`URL 格式错误：${value}`)
      }
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('仅支持 HTTP 或 HTTPS 地址')
    }
  }
  if (type === 'cleanLog' && !values.scopes?.length) throw new Error('请选择要清理的日志范围')
  await previewCronSchedule(node, values.spec, signal)
  await panelRequest(node, original ? '/cronjobs/update' : '/cronjobs', signal, {
    method: 'POST',
    body: {
      groupID: 0,
      scriptID: 0,
      appID: '',
      website: '',
      exclusionRules: '',
      dbType: '',
      dbName: '',
      isDir: true,
      sourceDir: '',
      snapshotRule: { withImage: false, ignoreAppIDs: [] },
      sourceAccountIDs: '',
      downloadAccountID: 0,
      ignoreErr: false,
      secret: '',
      alertCount: 0,
      alertTitle: '',
      alertMethod: '',
      args: '',
      containerName: '',
      user: '',
      command: '',
      scriptMode: 'input',
      ...original,
      ...values,
      id: original?.id ?? 0,
      type,
      name: values.name.trim(),
      spec: values.spec.trim(),
      specCustom: true,
      url:
        type === 'curl'
          ? values.url
              .split(/[\n,]/)
              .map((value) => value.trim())
              .filter(Boolean)
              .join(',')
          : (original?.url ?? ''),
    },
  })
}
export async function operateCronjob(
  node: NodeConfig,
  id: number,
  operation: 'run' | 'enable' | 'disable' | 'delete',
  signal: AbortSignal,
) {
  const paths = {
    run: '/cronjobs/handle',
    enable: '/cronjobs/status',
    disable: '/cronjobs/status',
    delete: '/cronjobs/del',
  }
  const body =
    operation === 'delete'
      ? { ids: [id], cleanData: false, cleanRemoteData: false }
      : operation === 'enable' || operation === 'disable'
        ? { id, status: operation === 'enable' ? 'Enable' : 'Disable' }
        : { id }
  await panelRequest(node, paths[operation], signal, { method: 'POST', body, timeoutMs: 40000 })
}
export async function stopCronjobRecord(node: NodeConfig, recordID: number, signal: AbortSignal) {
  // 停止接口接受执行记录 ID，而不是计划任务 ID。
  await panelRequest(node, '/cronjobs/stop', signal, { method: 'POST', body: { id: recordID } })
}
export async function searchCronjobRecords(
  node: NodeConfig,
  id: number,
  search: ResourceSearch,
  status: string,
  days: number,
  signal: AbortSignal,
) {
  return parseResponse(
    pageSchema(cronjobRecordSchema),
    await panelRequest(node, '/cronjobs/search/records', signal, {
      method: 'POST',
      body: {
        page: search.page,
        pageSize: search.pageSize,
        cronjobID: id,
        status,
        startTime: new Date(Date.now() - days * 86400000).toISOString(),
        endTime: new Date().toISOString(),
      },
    }),
  )
}
export async function fetchCronjobRecordLog(node: NodeConfig, id: number, signal: AbortSignal) {
  return (
    parseResponse(
      z.string().nullable(),
      await panelRequest(node, '/cronjobs/records/log', signal, {
        method: 'POST',
        body: { id },
        timeoutMs: 40000,
      }),
    ) ?? ''
  )
}
