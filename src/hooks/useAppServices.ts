import { useEffect, useState } from 'react'
import { fetchAppServices } from '../lib/appstore'
import type { NodeConfig } from '../lib/nodes'
import { errorMessage } from '../lib/panel'
import type { AppService } from '../types/appstore'

export function useAppServices(node: NodeConfig, key: string) {
  const [state, setState] = useState<{
    key: string
    services: AppService[]
    loading: boolean
    error: string
  }>({ key: '', services: [], loading: false, error: '' })
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    if (!key) return
    const controller = new AbortController()
    setState({ key, services: [], loading: true, error: '' })
    fetchAppServices(node, key, controller.signal)
      .then((services) => {
        if (!controller.signal.aborted) setState({ key, services, loading: false, error: '' })
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({ key, services: [], loading: false, error: errorMessage(error) })
      })
    return () => controller.abort()
  }, [node, key, revision])
  return {
    ...(state.key === key ? state : { services: [], loading: Boolean(key), error: '' }),
    retry: () => setRevision((value) => value + 1),
  }
}
