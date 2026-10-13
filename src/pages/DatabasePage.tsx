import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'
import Banner from '@douyinfe/semi-ui/lib/es/banner'
import Button from '@douyinfe/semi-ui/lib/es/button'
import Card from '@douyinfe/semi-ui/lib/es/card'
import Empty from '@douyinfe/semi-ui/lib/es/empty'
import Select from '@douyinfe/semi-ui/lib/es/select'
import Tabs from '@douyinfe/semi-ui/lib/es/tabs'
import Tag from '@douyinfe/semi-ui/lib/es/tag'
import { IconPlus, IconServer } from '@douyinfe/semi-icons'
import { DatabaseCreateSheet } from '../components/database/DatabaseCreateSheet'
import { DatabaseDetailSheet } from '../components/database/DatabaseDetailSheet'
import { RedisOverview } from '../components/database/RedisOverview'
import { OperationModal } from '../components/management/OperationModal'
import type { ResourceOperation } from '../components/management/OperationModal'
import {
  ResourceToolbar,
  ResourcePagination,
  ResourceSearchInput,
  ResourceState,
} from '../components/management/ResourceLayout'
import type { ModulePageProps } from '../components/management/ResourceLayout'
import { usePanelQuery } from '../hooks/usePanelQuery'
import { useResourceSearch } from '../hooks/useResourceSearch'
import {
  deleteDatabase,
  fetchDatabaseInstances,
  searchDatabases,
  syncDatabases,
} from '../lib/database'
import { getPanelPath } from '../routes/panel'
import { databaseEngines } from '../types/database'
import type { Database, DatabaseEngine } from '../types/database'

export function DatabasePage(props: ModulePageProps) {
  const { node } = props
  const navigate = useNavigate()
  const [engine, setEngine] = useState<DatabaseEngine>('mysql')
  const [instanceName, setInstanceName] = useState('')
  const [create, setCreate] = useState(false)
  const [detail, setDetail] = useState<Database | null>(null)
  const [operation, setOperation] = useState<ResourceOperation | null>(null)
  const loadInstances = useCallback(
    (signal: AbortSignal) => fetchDatabaseInstances(node, engine, signal),
    [node, engine],
  )
  const instances = usePanelQuery(JSON.stringify([node, engine]), loadInstances, {
    enabled: Boolean(node.apiKey),
  })
  const instance =
    instances.data?.find((item) => item.database === instanceName) ?? instances.data?.[0]
  const filter = useResourceSearch(`${engine}:${instance?.database}`)
  const load = useCallback(
    (signal: AbortSignal) =>
      instance
        ? searchDatabases(node, engine, instance, filter.search, signal)
        : Promise.resolve({ total: 0, items: [] }),
    [node, engine, instance, filter.search],
  )
  const list = usePanelQuery(
    JSON.stringify([node, engine, instance?.database, filter.search]),
    load,
    { enabled: Boolean(node.apiKey && instance && engine !== 'redis') },
  )
  const disabled =
    !instance || list.loading || filter.pending || Boolean(list.error || instances.error)
  const refresh = () => {
    instances.refresh()
    list.refresh()
  }
  return (
    <div className="mx-auto flex w-full max-w-400 flex-col gap-5 text-(--semi-color-text-0)">
      <ResourceToolbar
        loading={instances.loading || list.loading}
        onRefresh={refresh}
        actions={
          <>
            <Button onClick={() => navigate(getPanelPath(node.name, 'appstore'))}>
              安装数据库服务
            </Button>
            {engine !== 'redis' && (
              <Button
                icon={<IconPlus />}
                theme="solid"
                disabled={!instance || Boolean(instances.error)}
                onClick={() => setCreate(true)}
              >
                创建数据库
              </Button>
            )}
          </>
        }
      >
        <div className="w-full overflow-x-auto">
          <Tabs
            type="button"
            activeKey={engine}
            onChange={(value) => {
              setEngine(value as DatabaseEngine)
              setInstanceName('')
              setDetail(null)
              setCreate(false)
            }}
            tabList={databaseEngines.map((item) => ({ itemKey: item.value, tab: item.label }))}
          />
        </div>
        {engine !== 'redis' && (
          <ResourceSearchInput
            value={filter.query}
            onChange={filter.setQuery}
            placeholder="搜索数据库名称"
          />
        )}
        <Select
          aria-label="数据库实例"
          placeholder={instances.loading ? '正在读取实例…' : '暂无实例'}
          value={instance?.database}
          style={{ minWidth: 200, maxWidth: '100%' }}
          optionList={(instances.data ?? []).map((item) => ({
            label: `${item.database} · ${item.from === 'local' ? '本地' : '远程'}`,
            value: item.database,
          }))}
          onChange={(value) => {
            setInstanceName(String(value))
            setDetail(null)
          }}
        />
        {engine !== 'redis' && (
          <Button
            disabled={disabled}
            onClick={() =>
              instance &&
              setOperation({
                title: '同步数据库',
                description: `读取「${instance.database}」中的数据库并更新面板记录。`,
                action: (signal) => syncDatabases(node, engine, instance, signal),
              })
            }
          >
            从服务同步
          </Button>
        )}
      </ResourceToolbar>
      {instances.error && (
        <Banner
          type="danger"
          closeIcon={null}
          description={
            <>
              {instances.error}
              <Button theme="borderless" onClick={instances.refresh}>
                重试
              </Button>
            </>
          }
        />
      )}
      {instance && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-(--semi-color-text-2)">
          <Tag color="blue">{instance.type}</Tag>
          <span>{instance.version || '版本未知'}</span>
          <span>· {instance.address || (instance.from === 'local' ? '本地服务' : '远程服务')}</span>
        </div>
      )}
      {node.apiKey && !instances.loading && instances.data && !instances.data.length ? (
        <Card>
          <Empty
            image={<IconServer size="extra-large" />}
            title="没有可用的数据库实例"
            description="在应用商店安装数据库服务后，即可在这里创建和管理数据库。"
          >
            <Button
              className="mt-4"
              theme="solid"
              onClick={() => navigate(getPanelPath(node.name, 'appstore'))}
            >
              前往应用商店
            </Button>
          </Empty>
        </Card>
      ) : engine === 'redis' && instance ? (
        <RedisOverview key={instance.database} node={node} instance={instance} />
      ) : (
        <ResourceState
          {...props}
          loading={instances.loading || list.loading}
          error={list.error}
          hasData={Boolean(list.data)}
          empty={!list.data?.items.length}
          filtered={Boolean(filter.query)}
          onRetry={refresh}
          emptyTitle="此实例还没有数据库"
          emptyDescription="创建一个数据库，或从服务同步已有数据库。"
        >
          <section
            aria-label="数据库列表"
            aria-busy={list.loading || filter.pending}
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
          >
            {list.data?.items.map((database) => (
              <Card key={database.id} style={{ minWidth: 0 }} bodyStyle={{ height: '100%' }}>
                <article className="flex h-full flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-(--semi-color-fill-0) text-(--semi-color-primary)">
                      <IconServer size="large" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="m-0 truncate text-base font-semibold" title={database.name}>
                        {database.name}
                      </h2>
                      <p className="mt-1 mb-0 text-xs text-(--semi-color-text-2)">
                        {database.format || instance?.type}
                      </p>
                    </div>
                    <Tag>{database.from === 'local' ? '本地' : '远程'}</Tag>
                  </div>
                  <div className="rounded-lg bg-(--semi-color-fill-0) p-3 text-xs">
                    <span className="text-(--semi-color-text-2)">访问用户</span>
                    <p className="mb-0 wrap-anywhere">
                      {database.authorizedUsers
                        ?.map((user) => `${user.username}@${user.host}`)
                        .join('、') ||
                        database.username ||
                        '未绑定用户'}
                    </p>
                  </div>
                  <p
                    className="m-0 truncate text-xs text-(--semi-color-text-2)"
                    title={database.description}
                  >
                    {database.description || '暂无备注'}
                  </p>
                  <div className="mt-auto flex flex-wrap justify-between gap-2 border-t border-(--semi-color-border) pt-3">
                    <Button theme="light" disabled={disabled} onClick={() => setDetail(database)}>
                      管理
                    </Button>
                    <Button
                      type="danger"
                      theme="borderless"
                      disabled={disabled}
                      onClick={() =>
                        instance &&
                        setOperation({
                          title: '删除数据库',
                          description: `永久删除「${database.name}」及其数据，已有备份将保留。提交前会检查关联资源。`,
                          confirmName: database.name,
                          danger: true,
                          action: (signal) =>
                            deleteDatabase(node, engine, instance, database, signal),
                        })
                      }
                    >
                      删除
                    </Button>
                  </div>
                </article>
              </Card>
            ))}
          </section>
        </ResourceState>
      )}
      {engine !== 'redis' && list.data && (
        <ResourcePagination
          total={list.data.total}
          search={filter.search}
          loading={disabled}
          receivedAt={list.receivedAt}
          onPageChange={filter.changePage}
          onPageSizeChange={filter.changePageSize}
        />
      )}
      {create && instance && (
        <DatabaseCreateSheet
          node={node}
          engine={engine}
          instance={instance}
          onClose={() => setCreate(false)}
          onComplete={() => {
            setCreate(false)
            list.refresh()
          }}
        />
      )}
      {detail && instance && (
        <DatabaseDetailSheet
          node={node}
          engine={engine}
          instance={instance}
          database={detail}
          onClose={() => setDetail(null)}
          onChanged={list.refresh}
        />
      )}
      {operation && (
        <OperationModal
          operation={operation}
          onClose={() => setOperation(null)}
          onComplete={() => {
            setOperation(null)
            list.refresh()
          }}
        />
      )}
    </div>
  )
}
