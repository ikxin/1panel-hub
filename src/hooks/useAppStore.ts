import { useCallback, useEffect, useState } from 'react'
import { fetchAppTags, searchCatalog, searchInstalled } from '../lib/appstore'
import type { NodeConfig } from '../lib/nodes'
import { errorMessage } from '../lib/panel'
import type {
  AppPage,
  AppSearch,
  AppStoreTab,
  AppTag,
  CatalogApp,
  InstalledApp,
} from '../types/appstore'

export const APP_PAGE_SIZE = 12
export const defaultAppSearch: AppSearch = {
  page: 1,
  pageSize: APP_PAGE_SIZE,
  name: '',
  tags: [],
  resource: 'all',
  recommend: false,
  showCurrentArch: true,
  update: false,
}

export function useAppStore(node: NodeConfig, tab: AppStoreTab, search: AppSearch) {
  const [revision, setRevision] = useState(0)
  const [tags, setTags] = useState<AppTag[]>([])
  const [tagError, setTagError] = useState('')
  const [result, setResult] = useState<{
    key: string
    paginationKey?: string
    total?: number
    catalog?: AppPage<CatalogApp>
    installed?: AppPage<InstalledApp>
    error: string
    loading: boolean
    receivedAt?: number
  }>({ key: '', loading: true, error: '' })
  const key = JSON.stringify([node, tab, search])
  // 翻页时保留总数，节点或筛选条件变化时清空。
  const paginationKey = JSON.stringify([
    node,
    tab,
    { ...search, page: undefined, pageSize: undefined },
  ])
  const refresh = useCallback(() => setRevision((value) => value + 1), [])

  useEffect(() => {
    const controller = new AbortController()
    fetchAppTags(node, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setTags(data)
          setTagError('')
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) setTagError(errorMessage(error))
      })
    return () => controller.abort()
  }, [node, revision])

  useEffect(() => {
    const controller = new AbortController()
    let timer: number | undefined
    setResult((previous) => ({
      ...(previous.key === key
        ? previous
        : {
            key,
            paginationKey,
            total: previous.paginationKey === paginationKey ? previous.total : undefined,
          }),
      loading: true,
      error: '',
    }))

    const load = async () => {
      try {
        const data =
          tab === 'catalog'
            ? { catalog: await searchCatalog(node, search, controller.signal) }
            : { installed: await searchInstalled(node, search, controller.signal) }
        if (!controller.signal.aborted) {
          setResult({
            key,
            paginationKey,
            total: data.catalog?.total ?? data.installed?.total,
            ...data,
            loading: false,
            error: '',
            receivedAt: Date.now(),
          })
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setResult((previous) => ({ ...previous, loading: false, error: errorMessage(error) }))
        }
      } finally {
        if (!controller.signal.aborted && tab === 'installed') {
          timer = window.setTimeout(loadWhenVisible, 5000)
        }
      }
    }
    const loadWhenVisible = () => {
      if (controller.signal.aborted) return
      if (document.visibilityState === 'hidden') timer = window.setTimeout(loadWhenVisible, 5000)
      else void load()
    }
    void load()
    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [node, tab, search, key, paginationKey, revision])

  return {
    ...(result.key === key
      ? result
      : {
          loading: true,
          error: '',
          total: result.paginationKey === paginationKey ? result.total : undefined,
        }),
    tags,
    tagError,
    refresh,
  }
}
