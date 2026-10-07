import { useState } from 'react'
import { NODE_STORAGE_KEY, parseSavedNodes, saveNode } from '../lib/nodes'
import type { NodeConfig } from '../lib/nodes'

export function useNodes() {
  const [initial] = useState(() => {
    try {
      return { nodes: parseSavedNodes(localStorage.getItem(NODE_STORAGE_KEY)), error: '' }
    } catch {
      return { nodes: [], error: '读取节点配置失败' }
    }
  })
  const [nodes, setNodes] = useState<NodeConfig[]>(initial.nodes)

  const persist = (next: NodeConfig[]) => {
    if (initial.error) throw new Error(initial.error)
    localStorage.setItem(NODE_STORAGE_KEY, JSON.stringify(next))
    setNodes(next)
  }

  return {
    nodes,
    storageError: initial.error,
    save: (node: NodeConfig, originalName?: string) => persist(saveNode(nodes, node, originalName)),
    remove: (name: string) => persist(nodes.filter((node) => node.name !== name)),
  }
}
