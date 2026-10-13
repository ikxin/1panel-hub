import { z } from 'zod'
import type { NodeConfig } from './nodes'
import { panelRequest, errorMessage } from './panel'
import { parseResponse, stringList } from '../types/management'

const taskSchema = z.object({ taskStatus: z.string(), lines: stringList })
function delay(signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    signal.throwIfAborted()
    const abort = () => {
      window.clearTimeout(timer)
      reject(signal.reason)
    }
    const timer = window.setTimeout(() => {
      signal.removeEventListener('abort', abort)
      resolve()
    }, 2000)
    signal.addEventListener('abort', abort, { once: true })
  })
}
export async function waitForPanelTask(node: NodeConfig, taskID: string, signal: AbortSignal) {
  const deadline = Date.now() + 10 * 60 * 1000
  let failures = 0
  while (Date.now() < deadline) {
    await delay(signal)
    let task: z.infer<typeof taskSchema>
    try {
      task = parseResponse(
        taskSchema,
        await panelRequest(node, '/logs/tasks/read', signal, {
          method: 'POST',
          body: { taskID, type: 'task', page: 1, pageSize: 20, latest: true },
        }),
      )
      failures = 0
    } catch (error) {
      signal.throwIfAborted()
      if (++failures < 3) continue
      throw new Error(
        `无法确认任务结果：${errorMessage(error)}。任务可能仍在执行，请刷新资源或在节点任务中心查看。任务 ID：${taskID}`,
      )
    }
    if (['Success', 'Done'].includes(task.taskStatus)) return
    if (['Failed', 'Canceled'].includes(task.taskStatus))
      throw new Error(
        `任务${task.taskStatus === 'Canceled' ? '已取消' : '失败'}：${task.lines.slice(-3).join('\n') || '请在节点任务中心查看详情'}`,
      )
  }
  throw new Error(`任务仍未结束，请刷新资源或在节点任务中心查看进度。任务 ID：${taskID}`)
}
