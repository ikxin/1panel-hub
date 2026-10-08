import { isTauri } from '@tauri-apps/api/core'
import type { BaseInfo, CurrentInfo } from '../types/dashboard'
import { getNodeOrigin } from './nodes'
import type { NodeConfig } from './nodes'

interface PanelResponse<T> {
  code: number
  message?: string
  data: T
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : '操作失败'
}

async function request<T>(url: string, options: RequestInit): Promise<T> {
  const controller = new AbortController()
  const abort = () => controller.abort()
  options.signal?.addEventListener('abort', abort, { once: true })
  if (options.signal?.aborted) controller.abort()
  let timedOut = false
  const timeout = window.setTimeout(() => {
    timedOut = true
    controller.abort()
  }, 10000)

  try {
    const fetch = isTauri() ? (await import('@tauri-apps/plugin-http')).fetch : globalThis.fetch
    const response = await fetch(url, { ...options, signal: controller.signal })
    const httpError = `请求失败（HTTP ${response.status}）`
    const result = (await response.json().catch(() => {
      throw new Error(response.ok ? '面板返回的数据格式错误' : httpError)
    })) as PanelResponse<T>
    if (!response.ok || result?.code !== 200) {
      throw new Error(result?.message || (response.ok ? '面板请求失败' : httpError))
    }
    return result.data
  } catch (error) {
    if (timedOut) throw new Error('连接超时')
    if (error instanceof TypeError) throw new Error('连接失败')
    if (error instanceof SyntaxError) throw new Error('数据格式错误')
    throw error
  } finally {
    window.clearTimeout(timeout)
    options.signal?.removeEventListener('abort', abort)
  }
}

async function panelRequest<T>(node: NodeConfig, path: string, signal: AbortSignal): Promise<T> {
  signal.throwIfAborted()
  if (!node.apiKey) throw new Error('请编辑节点并配置 1Panel v2 API Key')
  if (!globalThis.crypto?.subtle) {
    throw new Error('Web Crypto 不可用，请通过 HTTPS 或本机地址访问客户端')
  }

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(node.apiKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const timestamp = Math.floor(Date.now() / 1000).toString()
  // 1Panel v2.3.2: HMAC-SHA256(API Key, "1panel:" + UnixTimestamp)，小写十六进制。
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(`1panel:${timestamp}`))
  const token = Array.from(new Uint8Array(signature), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')
  signal.throwIfAborted()
  return request<T>(`${getNodeOrigin(node)}/api/v2${path}`, {
    method: 'GET',
    signal,
    credentials: 'omit',
    headers: {
      'Accept-Language': 'zh',
      '1Panel-Token': token,
      '1Panel-Timestamp': timestamp,
      '1Panel-Signature-Version': 'hmac-sha256',
      ...(node.apiKeyId ? { '1Panel-Key-ID': node.apiKeyId } : {}),
      CurrentNode: 'local',
    },
  })
}

export async function fetchDashboard(node: NodeConfig, signal: AbortSignal): Promise<BaseInfo> {
  const data = await panelRequest<BaseInfo>(node, '/dashboard/base/all/all', signal)
  if (!data?.currentInfo || !Number.isFinite(data.currentInfo.uptime)) {
    throw new Error('监控数据无效')
  }
  return data
}

export async function fetchCurrentInfo(
  node: NodeConfig,
  signal: AbortSignal,
): Promise<CurrentInfo> {
  const data = await panelRequest<CurrentInfo>(node, '/dashboard/current/all/all', signal)
  if (!data || !Number.isFinite(data.uptime)) throw new Error('监控数据无效')
  return data
}

export async function openExternal(url: string): Promise<void> {
  if (isTauri()) {
    const { open } = await import('@tauri-apps/plugin-shell')
    await open(url)
  } else {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}
