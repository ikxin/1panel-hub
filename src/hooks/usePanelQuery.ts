import { useCallback, useEffect, useState } from 'react'
import { errorMessage } from '../lib/panel'

export function usePanelQuery<T>(
  key: string,
  load: (signal: AbortSignal) => Promise<T>,
  { enabled = true, interval = 0 }: { enabled?: boolean; interval?: number } = {},
) {
  const [revision, setRevision] = useState(0)
  const [result, setResult] = useState<{
    key: string
    data?: T
    loading: boolean
    error: string
    receivedAt?: number
  }>({ key: '', loading: true, error: '' })
  const refresh = useCallback(() => setRevision((value) => value + 1), [])
  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    let timer: number | undefined
    setResult((previous) => ({
      ...(previous.key === key ? previous : { key }),
      loading: true,
      error: '',
    }))
    const poll = async () => {
      try {
        const data = await load(controller.signal)
        if (!controller.signal.aborted)
          setResult({ key, data, loading: false, error: '', receivedAt: Date.now() })
      } catch (error) {
        if (!controller.signal.aborted)
          setResult((previous) => ({ ...previous, loading: false, error: errorMessage(error) }))
      } finally {
        if (interval && !controller.signal.aborted)
          timer = window.setTimeout(loadWhenVisible, interval)
      }
    }
    const loadWhenVisible = () => {
      if (document.visibilityState === 'hidden')
        timer = window.setTimeout(loadWhenVisible, interval)
      else void poll()
    }
    void poll()
    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [key, load, enabled, interval, revision])
  return {
    ...(enabled && result.key === key
      ? result
      : { loading: enabled, error: '', data: undefined, receivedAt: undefined }),
    refresh,
  }
}
