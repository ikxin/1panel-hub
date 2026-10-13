import { useCallback, useEffect, useState } from 'react'
import type { ResourceSearch } from '../types/management'

export function useResourceSearch(scope: string) {
  const [query, setQuery] = useState('')
  const [state, setState] = useState<{ scope: string; search: ResourceSearch }>({
    scope,
    search: { page: 1, pageSize: 12, name: '' },
  })
  // 切换实例或分类时，同一帧就使用第一页，避免向新实例请求旧页码。
  const search = state.scope === scope ? state.search : { ...state.search, page: 1 }
  useEffect(() => {
    const timer = window.setTimeout(
      () =>
        setState((previous) =>
          previous.search.name === query.trim()
            ? previous
            : { ...previous, search: { ...previous.search, name: query.trim(), page: 1 } },
        ),
      300,
    )
    return () => window.clearTimeout(timer)
  }, [query])
  useEffect(() => {
    setState((previous) =>
      previous.scope === scope ? previous : { scope, search: { ...previous.search, page: 1 } },
    )
  }, [scope])
  const changePage = useCallback(
    (page: number) =>
      setState((previous) => ({ ...previous, search: { ...previous.search, page } })),
    [],
  )
  const changePageSize = (pageSize: number) =>
    setState((previous) => ({ ...previous, search: { ...previous.search, page: 1, pageSize } }))
  return {
    query,
    setQuery,
    search,
    changePage,
    changePageSize,
    pending: query.trim() !== search.name,
  }
}
