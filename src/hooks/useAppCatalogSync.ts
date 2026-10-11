import { useEffect, useState } from 'react'
import { fetchAppTask, syncAppCatalog } from '../lib/appstore'
import type { NodeConfig } from '../lib/nodes'
import { errorMessage } from '../lib/panel'
import { useAppMutation } from './useAppMutation'

export function useAppCatalogSync(node: NodeConfig, onComplete: () => void) {
  const mutation = useAppMutation()
  const [taskID, setTaskID] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [pollError, setPollError] = useState('')

  useEffect(() => {
    if (!taskID) return
    const controller = new AbortController()
    let timer: number | undefined
    const poll = async () => {
      let finished = false
      try {
        const task = await fetchAppTask(node, taskID, controller.signal)
        if (controller.signal.aborted) return
        setPollError('')
        if (['Success', 'Done'].includes(task.taskStatus)) {
          finished = true
          setTaskID(null)
          setMessage('应用目录已同步')
          onComplete()
        } else if (['Failed', 'Canceled'].includes(task.taskStatus)) {
          finished = true
          setTaskID(null)
          setMessage('')
          setPollError(
            task.taskStatus === 'Canceled'
              ? '同步已取消'
              : `同步失败：${task.lines?.slice(-3).join(' ') || '请检查节点网络或任务日志'}`,
          )
        }
      } catch (error) {
        if (!controller.signal.aborted)
          setPollError(`暂时无法读取同步进度：${errorMessage(error)}，正在重试。`)
      } finally {
        if (!finished && !controller.signal.aborted)
          timer = window.setTimeout(() => void poll(), 5000)
      }
    }
    void poll()
    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [node, taskID, onComplete])

  const sync = async (source: 'remote' | 'local') => {
    if (taskID) return
    setMessage('')
    setPollError('')
    let id: string | null = null
    if (
      await mutation.run(async (signal) => {
        id = await syncAppCatalog(node, source, signal)
      })
    ) {
      setTaskID(id)
      setMessage(id ? '正在同步应用目录，完成后将自动刷新。' : '应用目录已是最新')
      if (!id) onComplete()
    }
  }
  return {
    sync,
    busy: mutation.busy || Boolean(taskID),
    message,
    error: mutation.error || pollError,
  }
}
