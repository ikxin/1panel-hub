import { z } from 'zod'

export const NODE_STORAGE_KEY = 'node-config'

export function isValidHost(host: string): boolean {
  if (!/^(?:[a-z\d.-]+|\[[a-f\d:]+\]|[a-f\d:]+)$/i.test(host)) return false
  try {
    const address = host.includes(':') && !host.startsWith('[') ? `[${host}]` : host
    return Boolean(new URL(`http://${address}`).hostname)
  } catch {
    return false
  }
}

export const nodeConfigSchema = z.object({
  name: z.string().trim().min(1, '请输入节点名称'),
  host: z.string().trim().refine(isValidHost, 'IP 地址无效'),
  port: z.number().int('端口必须为整数').min(1).max(65535),
  https: z.boolean(),
  apiKey: z.string().trim().min(1, '请输入 API Key'),
  apiKeyId: z.string().trim().default(''),
})

export type NodeConfig = z.infer<typeof nodeConfigSchema>

export function createDefaultNode(): NodeConfig {
  return {
    name: '',
    host: '',
    port: 10000,
    https: false,
    apiKey: '',
    apiKeyId: '',
  }
}

export function parseSavedNodes(raw: string | null): NodeConfig[] {
  // 保留已有节点地址供用户编辑，旧的登录凭据不再读取或使用。
  const savedNodeSchema = nodeConfigSchema.extend({ apiKey: z.string().trim().default('') })
  return raw ? z.array(savedNodeSchema).parse(JSON.parse(raw)) : []
}

export function saveNode(
  nodes: NodeConfig[],
  values: NodeConfig,
  originalName?: string,
): NodeConfig[] {
  const node = nodeConfigSchema.parse(values)
  if (nodes.some((item) => item.name === node.name && item.name !== originalName)) {
    throw new Error('节点名称已存在')
  }
  if (originalName && !nodes.some((item) => item.name === originalName)) {
    throw new Error('节点已不存在')
  }
  return originalName
    ? nodes.map((item) => (item.name === originalName ? node : item))
    : [...nodes, node]
}

export function getNodeOrigin(node: Pick<NodeConfig, 'host' | 'port' | 'https'>): string {
  const host = node.host.includes(':') && !node.host.startsWith('[') ? `[${node.host}]` : node.host
  return new URL(`${node.https ? 'https' : 'http'}://${host}:${node.port}`).origin
}
