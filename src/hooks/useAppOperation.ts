import { useEffect, useState } from 'react'
import { fetchAppResources, fetchAppVersions, operateApp } from '../lib/appstore'
import type { NodeConfig } from '../lib/nodes'
import { errorMessage } from '../lib/panel'
import type { AppOperation, AppResource, AppVersion, InstalledApp } from '../types/appstore'
import { useAppMutation } from './useAppMutation'

export function useAppOperation(node: NodeConfig, app: InstalledApp, operation: AppOperation) {
  const [versions, setVersions] = useState<AppVersion[]>([])
  const [resources, setResources] = useState<AppResource[]>([])
  const [version, setVersion] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [revision, setRevision] = useState(0)
  const mutation = useAppMutation()

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setLoadError('')
    const load = async () => {
      try {
        if (operation === 'delete') {
          const data = await fetchAppResources(node, app.id, controller.signal)
          if (!controller.signal.aborted) setResources(data)
        } else if (operation === 'upgrade') {
          const data = await fetchAppVersions(node, app.id, controller.signal)
          if (!controller.signal.aborted) {
            setVersions(data)
            setVersion(data[0]?.version ?? '')
          }
        }
      } catch (error) {
        if (!controller.signal.aborted) setLoadError(errorMessage(error))
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [node, app.id, operation, revision])

  const run = () =>
    mutation.run(async (signal) => {
      if (loading || loadError) throw new Error('请先完成应用检查')
      if (operation === 'delete') {
        const dependencies = await fetchAppResources(node, app.id, signal)
        if (dependencies.length)
          throw new Error(`应用仍被引用：${dependencies.map((item) => item.name).join('、')}`)
      }
      let target: AppVersion | undefined
      if (operation === 'upgrade') {
        const latest = await fetchAppVersions(node, app.id, signal, version)
        target = latest.find((item) => item.version === version)
        if (!target) throw new Error('所选版本已不可用，请重新加载')
      }
      await operateApp(node, app.id, operation, signal, target)
    })
  return {
    versions,
    resources,
    version,
    setVersion,
    loading,
    loadError,
    mutation,
    run,
    retry: () => setRevision((value) => value + 1),
  }
}
