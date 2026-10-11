import { useEffect, useState } from 'react'
import { fetchAppDetail, fetchAppInfo } from '../lib/appstore'
import type { NodeConfig } from '../lib/nodes'
import { errorMessage } from '../lib/panel'
import type { AppDetail, AppInfo } from '../types/appstore'

export function useAppDetail(node: NodeConfig, appKey: string) {
  const [info, setInfo] = useState<AppInfo>()
  const [detail, setDetail] = useState<AppDetail>()
  const [version, setVersion] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    setInfo(undefined)
    setDetail(undefined)
    setVersion('')
    fetchAppInfo(node, appKey, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return
        setInfo(data)
        setVersion(data.versions[0] ?? '')
        if (!data.versions.length) setLoading(false)
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setError(errorMessage(error))
          setLoading(false)
        }
      })
    return () => controller.abort()
  }, [node, appKey, revision])

  useEffect(() => {
    if (!info || !version) return
    const controller = new AbortController()
    setLoading(true)
    setError('')
    setDetail(undefined)
    fetchAppDetail(node, info.id, version, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setDetail(data)
          setLoading(false)
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setError(errorMessage(error))
          setLoading(false)
        }
      })
    return () => controller.abort()
  }, [node, info, version])

  return {
    info,
    detail: detail?.version === version ? detail : undefined,
    version,
    setVersion,
    loading,
    error,
    retry: () => setRevision((value) => value + 1),
  }
}
