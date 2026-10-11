import { useEffect, useRef, useState } from 'react'
import { errorMessage } from '../lib/panel'

export function useAppMutation() {
  const request = useRef<AbortController | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => () => request.current?.abort(), [])

  const run = async (action: (signal: AbortSignal) => Promise<void>) => {
    if (request.current) return false
    const controller = new AbortController()
    request.current = controller
    setBusy(true)
    setError('')
    try {
      await action(controller.signal)
      return !controller.signal.aborted
    } catch (error) {
      if (!controller.signal.aborted) {
        const message = errorMessage(error)
        setError(
          message === '连接超时' || message === '连接失败'
            ? `${message}。操作可能仍在执行，请刷新应用状态后再决定是否重试。`
            : message,
        )
      }
      return false
    } finally {
      if (!controller.signal.aborted) {
        request.current = null
        setBusy(false)
      }
    }
  }
  return { busy, error, run }
}
