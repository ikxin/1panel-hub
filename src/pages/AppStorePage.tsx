import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import Banner from '@douyinfe/semi-ui/lib/es/banner'
import Button from '@douyinfe/semi-ui/lib/es/button'
import Card from '@douyinfe/semi-ui/lib/es/card'
import Dropdown from '@douyinfe/semi-ui/lib/es/dropdown'
import Empty from '@douyinfe/semi-ui/lib/es/empty'
import Tabs from '@douyinfe/semi-ui/lib/es/tabs'
import {
  IconAppCenter,
  IconChevronDown,
  IconRefresh,
  IconSearch,
  IconServer,
} from '@douyinfe/semi-icons'
import { AppCatalogCard } from '../components/appstore/AppCatalogCard'
import { AppListSkeleton } from '../components/appstore/AppListSkeleton'
import { AppStoreFilters } from '../components/appstore/AppStoreFilters'
import { AppStorePagination } from '../components/appstore/AppStorePagination'
import { InstalledAppCard } from '../components/appstore/InstalledAppCard'
import { AppOperationModal } from '../components/appstore/AppOperationModal'
import { useAppCatalogSync } from '../hooks/useAppCatalogSync'
import { useAppSearch } from '../hooks/useAppSearch'
import { useAppStore } from '../hooks/useAppStore'
import type { NodeConfig } from '../lib/nodes'
import type { AppOperation, InstalledApp } from '../types/appstore'
import { formatTimestamp } from '../utils/formatter'

const AppDetailSheet = lazy(() =>
  import('../components/appstore/AppDetailSheet').then((module) => ({
    default: module.AppDetailSheet,
  })),
)

export function AppStorePage({
  node,
  onEdit,
  editDisabled,
}: {
  node: NodeConfig
  onEdit: () => void
  editDisabled: boolean
}) {
  const {
    tab,
    query,
    search,
    filtered,
    pendingQuery,
    changeQuery,
    changeTab,
    changeFilters,
    changePage,
    changePageSize,
    clearFilters,
  } = useAppSearch()
  const [selection, setSelection] = useState<{ key: string; tab: 'detail' | 'install' } | null>(
    null,
  )
  const [operation, setOperation] = useState<{ app: InstalledApp; action: AppOperation } | null>(
    null,
  )
  const store = useAppStore(node, tab, search)
  const sync = useAppCatalogSync(node, store.refresh)
  const page = tab === 'catalog' ? store.catalog : store.installed
  const pending = store.loading || pendingQuery
  const listRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (
      page &&
      search.page > 1 &&
      search.page > Math.max(1, Math.ceil(page.total / search.pageSize))
    ) {
      changePage(Math.max(1, Math.ceil(page.total / search.pageSize)))
    }
  }, [page, search.page, search.pageSize, changePage])

  return (
    <div className="mx-auto flex w-full max-w-400 flex-col gap-5 text-(--semi-color-text-0)">
      <Card bodyStyle={{ padding: 0 }} style={{ minWidth: 0 }}>
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <Tabs
            activeKey={tab}
            onChange={changeTab}
            tabList={[
              { itemKey: 'catalog', tab: '应用目录' },
              { itemKey: 'installed', tab: '已安装应用' },
            ]}
            type="button"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              icon={<IconRefresh />}
              onClick={store.refresh}
              loading={store.loading}
              disabled={!node.apiKey}
            >
              刷新
            </Button>
            <Dropdown
              trigger="click"
              position="bottomRight"
              render={
                <Dropdown.Menu>
                  <Dropdown.Item onClick={() => void sync.sync('remote')}>
                    同步远程应用
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => void sync.sync('local')}>
                    同步本地应用
                  </Dropdown.Item>
                </Dropdown.Menu>
              }
            >
              <Button
                theme="solid"
                icon={<IconChevronDown />}
                iconPosition="right"
                loading={sync.busy}
                disabled={!node.apiKey}
              >
                同步应用目录
              </Button>
            </Dropdown>
          </div>
        </div>
        {node.apiKey && (
          <AppStoreFilters
            tab={tab}
            query={query}
            search={search}
            tags={store.tags}
            tagError={store.tagError}
            filtered={filtered}
            onQueryChange={changeQuery}
            onFilterChange={changeFilters}
            onClear={clearFilters}
          />
        )}
      </Card>

      {(sync.error || sync.message) && (
        <Banner
          type={sync.error ? 'warning' : sync.busy ? 'info' : 'success'}
          closeIcon={null}
          description={
            <span className="whitespace-pre-wrap wrap-anywhere" role="status">
              {sync.error || sync.message}
            </span>
          }
        />
      )}

      {!node.apiKey ? (
        <Card>
          <Empty
            image={<IconServer size="extra-large" />}
            title="配置节点后浏览应用"
            description="请填写 1Panel API Key，并在面板中启用 API 访问。"
          >
            <Button className="mt-4" theme="solid" disabled={editDisabled} onClick={onEdit}>
              编辑节点配置
            </Button>
          </Empty>
        </Card>
      ) : (
        <>
          {store.error && (
            <Banner
              type="danger"
              closeIcon={null}
              description={
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span>
                    {store.error}
                    {page ? '，当前显示最近一次读取的数据。' : ''}
                  </span>
                  <div className="flex gap-1">
                    <Button theme="borderless" onClick={store.refresh}>
                      重试
                    </Button>
                    <Button theme="borderless" disabled={editDisabled} onClick={onEdit}>
                      节点配置
                    </Button>
                  </div>
                </div>
              }
            />
          )}
          <section
            ref={listRef}
            aria-label={tab === 'catalog' ? '应用目录' : '已安装应用'}
            aria-busy={pending}
            className="flex min-w-0 flex-col gap-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-(--semi-color-text-2)" role="status" aria-live="polite">
                {pending
                  ? '正在加载…'
                  : page
                    ? `共 ${page.total} ${tab === 'catalog' ? '款应用' : '个实例'}`
                    : '暂未获取数据'}
              </span>
              {store.receivedAt && (
                <span className="text-[11px] text-(--semi-color-text-2)">
                  {tab === 'installed' ? '状态自动刷新 · ' : '最近更新 '}
                  {formatTimestamp(store.receivedAt)}
                </span>
              )}
            </div>

            {store.loading || (pendingQuery && !page) ? (
              <AppListSkeleton tab={tab} count={page?.items.length || search.pageSize} />
            ) : !page ? (
              <Card>
                <div className="py-10">
                  <Empty
                    image={<IconAppCenter size="extra-large" />}
                    title="暂时无法读取应用"
                    description="请检查节点连接、API 权限和 1Panel 版本后重试。"
                  >
                    <Button className="mt-4" theme="solid" onClick={store.refresh}>
                      重新加载
                    </Button>
                  </Empty>
                </div>
              </Card>
            ) : !page.items.length ? (
              <Card>
                <div className="py-10">
                  <Empty
                    image={
                      filtered ? (
                        <IconSearch size="extra-large" />
                      ) : (
                        <IconAppCenter size="extra-large" />
                      )
                    }
                    title={
                      filtered
                        ? '没有找到匹配的应用'
                        : tab === 'catalog'
                          ? '应用目录还是空的'
                          : '还没有安装应用'
                    }
                    description={
                      filtered
                        ? '试试其他关键词，或清除筛选条件。'
                        : tab === 'catalog'
                          ? '同步应用目录，获取可安装的应用。'
                          : '从应用目录选择合适的服务，开始部署。'
                    }
                  >
                    <Button
                      className="mt-4"
                      theme="solid"
                      loading={tab === 'catalog' && !filtered && sync.busy}
                      onClick={() => {
                        if (filtered) clearFilters()
                        else if (tab === 'installed') changeTab('catalog')
                        else void sync.sync('remote')
                      }}
                    >
                      {filtered
                        ? '清除筛选'
                        : tab === 'installed'
                          ? '浏览应用目录'
                          : '同步应用目录'}
                    </Button>
                  </Empty>
                </div>
              </Card>
            ) : (
              <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {tab === 'catalog'
                  ? store.catalog?.items.map((app) => (
                      <AppCatalogCard
                        key={app.id}
                        node={node}
                        app={app}
                        onDetail={() => setSelection({ key: app.key, tab: 'detail' })}
                        onInstall={() => setSelection({ key: app.key, tab: 'install' })}
                      />
                    ))
                  : store.installed?.items.map((app) => (
                      <InstalledAppCard
                        key={app.id}
                        node={node}
                        app={app}
                        disabled={Boolean(store.error)}
                        onDetail={() => setSelection({ key: app.appKey, tab: 'detail' })}
                        onOperation={(action) => setOperation({ app, action })}
                      />
                    ))}
              </div>
            )}

            {store.total !== undefined && store.total > 0 && (
              <AppStorePagination
                tab={tab}
                total={store.total}
                currentPage={search.page}
                pageSize={search.pageSize}
                pending={pending}
                onPageChange={(value) => {
                  changePage(value)
                  listRef.current?.scrollIntoView({ block: 'start' })
                }}
                onPageSizeChange={(value) => {
                  changePageSize(value)
                  listRef.current?.scrollIntoView({ block: 'start' })
                }}
              />
            )}
          </section>
        </>
      )}
      {selection && (
        <Suspense
          fallback={
            <div
              role="status"
              className="fixed right-4 bottom-4 z-50 rounded-(--semi-border-radius-medium) border border-(--semi-color-border) bg-(--semi-color-bg-0) px-4 py-3 text-sm shadow-sm"
            >
              正在加载应用详情…
            </div>
          }
        >
          <AppDetailSheet
            key={selection.key}
            node={node}
            appKey={selection.key}
            initialTab={selection.tab}
            onClose={() => setSelection(null)}
            onInstalled={() => {
              setSelection(null)
              changeTab('installed')
              store.refresh()
            }}
          />
        </Suspense>
      )}
      {operation && (
        <AppOperationModal
          node={node}
          app={operation.app}
          operation={operation.action}
          onClose={() => setOperation(null)}
          onComplete={() => {
            setOperation(null)
            store.refresh()
          }}
        />
      )}
    </div>
  )
}
