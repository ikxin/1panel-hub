import { fetchAppIcon } from './appstore'
import { getNodeOrigin } from './nodes'
import type { NodeConfig } from './nodes'

const ICON_CACHE_LIMIT = 128
const ICON_CACHE_DURATION = 5 * 60 * 1000
const icons = new Map<string, { blob: Blob; expiresAt: number }>()
const requests = new Map<string, Promise<Blob>>()

function iconKey(node: NodeConfig, appKey: string) {
  return JSON.stringify([getNodeOrigin(node), node.apiKey, node.apiKeyId, appKey])
}

export function loadAppIcon(node: NodeConfig, appKey: string): Promise<Blob> {
  const key = iconKey(node, appKey)
  const cached = icons.get(key)
  if (cached && cached.expiresAt > Date.now()) {
    icons.delete(key)
    icons.set(key, cached)
    return Promise.resolve(cached.blob)
  }
  icons.delete(key)

  const pending = requests.get(key)
  if (pending) return pending

  // 共享请求不随单个组件卸载而取消，超时由面板请求模块处理。
  const request = fetchAppIcon(node, appKey, new AbortController().signal)
    .then((blob) => {
      if (!blob.size) throw new Error('应用图标为空')
      for (const [cachedKey, entry] of icons) {
        if (entry.expiresAt <= Date.now()) icons.delete(cachedKey)
      }
      icons.set(key, { blob, expiresAt: Date.now() + ICON_CACHE_DURATION })
      if (icons.size > ICON_CACHE_LIMIT) {
        const oldestKey = icons.keys().next().value
        if (oldestKey !== undefined) icons.delete(oldestKey)
      }
      return blob
    })
    .finally(() => requests.delete(key))
  requests.set(key, request)
  return request
}

export function clearAppIcon(node: NodeConfig, appKey: string) {
  icons.delete(iconKey(node, appKey))
}
