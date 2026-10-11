import { useCallback, useEffect, useState } from 'react'
import type { AppSearch, AppStoreTab } from '../types/appstore'
import { defaultAppSearch } from './useAppStore'

export function useAppSearch() {
  const [tab, setTab] = useState<AppStoreTab>('catalog')
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState<AppSearch>(defaultAppSearch)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch((previous) =>
        previous.name === query.trim() ? previous : { ...previous, name: query.trim(), page: 1 },
      )
    }, 300)
    return () => window.clearTimeout(timer)
  }, [query])

  const clearFilters = () => {
    setQuery('')
    setSearch((previous) => ({ ...defaultAppSearch, pageSize: previous.pageSize }))
  }
  const changeTab = (value: string) => {
    setTab(value === 'installed' ? 'installed' : 'catalog')
    clearFilters()
  }
  const changeFilters = (values: Partial<AppSearch>) =>
    setSearch((previous) => ({ ...previous, ...values, page: 1 }))
  const changePage = useCallback(
    (page: number) =>
      setSearch((previous) => (previous.page === page ? previous : { ...previous, page })),
    [],
  )
  const changePageSize = (pageSize: number) =>
    setSearch((previous) =>
      previous.pageSize === pageSize ? previous : { ...previous, pageSize, page: 1 },
    )
  const filtered = Boolean(
    query.trim() ||
    search.name ||
    search.tags.length ||
    (tab === 'catalog'
      ? search.resource !== 'all' || search.recommend || !search.showCurrentArch
      : search.update),
  )

  return {
    tab,
    query,
    search,
    filtered,
    pendingQuery: query.trim() !== search.name,
    changeQuery: setQuery,
    changeTab,
    changeFilters,
    changePage,
    changePageSize,
    clearFilters,
  }
}
