import { useEffect, useState } from 'react'
import type { NodeConfig } from '../lib/nodes'
import type { BaseInfo } from '../types/dashboard'
import { errorMessage, fetchCurrentInfo, fetchDashboard } from '../lib/panel'
import { updateStatus } from '../lib/status'
import type { NodeStatus } from '../lib/status'
import { MONITOR_POLL_MS } from '../lib/monitor'

export function useNodeStatus(nodes: NodeConfig[]) {
  const [snapshot, setSnapshot] = useState<{
    nodes: NodeConfig[]
    statuses: Record<string, NodeStatus>
  }>({ nodes, statuses: {} })
  const [now, setNow] = useState(Date.now)

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const timers = new Set<number>()

    const poll = async (node: NodeConfig, base?: BaseInfo, baseReceivedAt = 0) => {
      try {
        if (!base || Date.now() - baseReceivedAt >= 60000) {
          base = await fetchDashboard(node, controller.signal)
          baseReceivedAt = Date.now()
        } else {
          base = { ...base, currentInfo: await fetchCurrentInfo(node, controller.signal) }
        }
        const data = base
        const receivedAt = Date.now()
        if (!controller.signal.aborted) {
          setSnapshot((previous) => {
            const statuses = previous.nodes === nodes ? previous.statuses : {}
            return {
              nodes,
              statuses: {
                ...statuses,
                [node.name]: updateStatus(data, statuses[node.name], receivedAt),
              },
            }
          })
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setSnapshot((previous) => {
            const statuses = previous.nodes === nodes ? previous.statuses : {}
            return {
              nodes,
              statuses: {
                ...statuses,
                [node.name]: { ...statuses[node.name], error: errorMessage(error) },
              },
            }
          })
        }
      } finally {
        if (!controller.signal.aborted) {
          const timer = window.setTimeout(() => {
            timers.delete(timer)
            void poll(node, base, baseReceivedAt)
          }, MONITOR_POLL_MS)
          timers.add(timer)
        }
      }
    }

    nodes.forEach((node) => void poll(node))
    return () => {
      controller.abort()
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [nodes])

  return { statuses: snapshot.nodes === nodes ? snapshot.statuses : {}, now }
}
