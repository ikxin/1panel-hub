import { useCallback, useState } from 'react'
import Banner from '@douyinfe/semi-ui/lib/es/banner'
import Button from '@douyinfe/semi-ui/lib/es/button'
import Select from '@douyinfe/semi-ui/lib/es/select'
import Tabs from '@douyinfe/semi-ui/lib/es/tabs'
import { IconPlus } from '@douyinfe/semi-icons'
import { ContainerCreateSheet } from '../components/container/ContainerCreateSheet'
import { ContainerResourceCreateSheet } from '../components/container/ContainerResourceCreateSheet'
import { ContainerResourceCard } from '../components/container/ContainerResourceCard'
import { ContainerDetailSheet } from '../components/container/ContainerDetailSheet'
import { OperationModal } from '../components/management/OperationModal'
import type { ResourceOperation } from '../components/management/OperationModal'
import {
  ResourceToolbar,
  ResourceMetrics,
  ResourcePagination,
  ResourceSearchInput,
  ResourceState,
} from '../components/management/ResourceLayout'
import type { ModulePageProps } from '../components/management/ResourceLayout'
import { usePanelQuery } from '../hooks/usePanelQuery'
import { useResourceSearch } from '../hooks/useResourceSearch'
import {
  deleteContainerResource,
  fetchContainerCounts,
  fetchContainerStats,
  fetchDockerStatus,
  operateContainer,
  searchContainerResources,
} from '../lib/container'
import { containerTabs } from '../types/container'
import type { ContainerOperation, ContainerResource, ContainerTab } from '../types/container'
import { containerStates, resourceId, resourceName } from '../utils/container'

const operationLabels: Record<ContainerOperation, string> = {
  start: '启动',
  stop: '停止',
  restart: '重启',
  pause: '暂停',
  unpause: '恢复',
  remove: '删除',
}
const createLabels: Record<ContainerTab, string> = {
  container: '创建容器',
  image: '拉取镜像',
  network: '创建网络',
  volume: '创建存储卷',
}

export function ContainerPage(props: ModulePageProps) {
  const { node } = props
  const [tab, setTab] = useState<ContainerTab>('container')
  const [status, setStatus] = useState('all')
  const [create, setCreate] = useState<ContainerTab | null>(null)
  const [detail, setDetail] = useState<ContainerResource | null>(null)
  const [operation, setOperation] = useState<ResourceOperation | null>(null)
  const filter = useResourceSearch(`${tab}:${status}`)
  const load = useCallback(
    (signal: AbortSignal) => searchContainerResources(node, tab, filter.search, status, signal),
    [node, tab, filter.search, status],
  )
  const loadCounts = useCallback(
    (signal: AbortSignal) => fetchContainerCounts(node, signal),
    [node],
  )
  const loadStats = useCallback((signal: AbortSignal) => fetchContainerStats(node, signal), [node])
  const loadDocker = useCallback((signal: AbortSignal) => fetchDockerStatus(node, signal), [node])
  const docker = usePanelQuery(JSON.stringify(node), loadDocker, {
    enabled: Boolean(node.apiKey),
    interval: 30000,
  })
  const enabled = Boolean(node.apiKey && docker.data?.isActive)
  const list = usePanelQuery(JSON.stringify([node, tab, filter.search, status]), load, {
    enabled,
    interval: tab === 'container' ? 10000 : 0,
  })
  const counts = usePanelQuery(JSON.stringify(node), loadCounts, { enabled, interval: 10000 })
  const stats = usePanelQuery(JSON.stringify(node), loadStats, {
    enabled: enabled && tab === 'container',
    interval: 10000,
  })
  const disabled = !enabled || list.loading || filter.pending || Boolean(list.error || docker.error)
  const refresh = () => {
    docker.refresh()
    list.refresh()
    counts.refresh()
    stats.refresh()
  }
  const changed = () => {
    setCreate(null)
    setOperation(null)
    refresh()
  }
  return (
    <div className="mx-auto flex w-full max-w-400 flex-col gap-5 text-(--semi-color-text-0)">
      <ResourceToolbar
        loading={list.loading || docker.loading}
        onRefresh={refresh}
        actions={
          <Button
            theme="solid"
            icon={<IconPlus />}
            disabled={!enabled || Boolean(docker.error)}
            onClick={() => setCreate(tab)}
          >
            {createLabels[tab]}
          </Button>
        }
      >
        <div className="w-full overflow-x-auto">
          <Tabs
            type="button"
            activeKey={tab}
            onChange={(value) => setTab(value as ContainerTab)}
            tabList={containerTabs.map((item) => ({ itemKey: item.value, tab: item.label }))}
          />
        </div>
        <ResourceSearchInput
          value={filter.query}
          onChange={filter.setQuery}
          placeholder={`搜索${containerTabs.find((item) => item.value === tab)?.label}名称`}
        />
        {tab === 'container' && (
          <Select
            aria-label="容器状态"
            value={status}
            onChange={(value) => setStatus(String(value))}
            style={{ minWidth: 140 }}
            optionList={[{ value: 'all', label: '全部状态' }, ...containerStates]}
          />
        )}
      </ResourceToolbar>
      <ResourceMetrics
        items={[
          {
            label: '容器',
            value: counts.data?.containerCount,
            hint: counts.data
              ? `${counts.data.running} 个运行中 · ${counts.data.paused} 个暂停`
              : '节点容器总数',
          },
          { label: '镜像', value: counts.data?.imageCount, hint: '节点本地镜像' },
          { label: '网络', value: counts.data?.networkCount, hint: '容器互联网络' },
          { label: '存储卷', value: counts.data?.volumeCount, hint: '持久化数据存储' },
        ]}
      />
      {docker.data && (!docker.data.isExist || !docker.data.isActive) && (
        <Banner
          type="warning"
          closeIcon={null}
          description={
            docker.data.isExist
              ? 'Docker 服务未运行，请在节点启动 Docker 后刷新。'
              : '节点尚未安装 Docker，请安装后刷新。'
          }
        />
      )}
      {(counts.error || stats.error) && (
        <Banner
          type="warning"
          closeIcon={null}
          description={`部分指标读取失败：${counts.error || stats.error}`}
        />
      )}
      <ResourceState
        {...props}
        loading={docker.loading || list.loading}
        error={docker.error || list.error}
        hasData={Boolean(list.data)}
        empty={!list.data?.items.length}
        filtered={Boolean(filter.query || (tab === 'container' && status !== 'all'))}
        onRetry={refresh}
        emptyTitle={`还没有${containerTabs.find((item) => item.value === tab)?.label}`}
        emptyDescription={`点击右上角「${createLabels[tab]}」添加资源。`}
      >
        <section
          aria-label="容器资源列表"
          aria-busy={list.loading || filter.pending}
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {list.data?.items.map((resource) => (
            <ContainerResourceCard
              key={resourceId(resource)}
              resource={resource}
              stats={
                !stats.error
                  ? stats.data?.find((item) => item.containerID === resourceId(resource))
                  : undefined
              }
              disabled={disabled}
              onInspect={() => setDetail(resource)}
              onOperate={(action) => {
                if (resource.kind === 'container')
                  setOperation({
                    title: `${operationLabels[action]}容器`,
                    description: `在节点「${node.name}」上${operationLabels[action]}「${resource.data.name}」。${['stop', 'restart', 'pause'].includes(action) ? '操作期间依赖该容器的服务可能暂时不可用。' : ''}`,
                    action: (signal) => operateContainer(node, resource.data.name, action, signal),
                  })
              }}
              onDelete={() =>
                setOperation({
                  title: `删除${containerTabs.find((item) => item.value === resource.kind)?.label}`,
                  description: `删除「${resourceName(resource)}」。${resource.kind === 'volume' ? '存储卷中的全部数据将永久删除。' : resource.kind === 'container' ? '容器可写层中的数据将丢失，挂载的存储卷将保留。' : '正在使用的资源无法删除。'}`,
                  danger: true,
                  confirmName: resourceName(resource),
                  action: (signal) => deleteContainerResource(node, resource, signal),
                })
              }
            />
          ))}
        </section>
      </ResourceState>
      {list.data && (
        <ResourcePagination
          total={list.data.total}
          search={filter.search}
          loading={disabled}
          receivedAt={list.receivedAt}
          onPageChange={filter.changePage}
          onPageSizeChange={filter.changePageSize}
        />
      )}
      {create === 'container' && (
        <ContainerCreateSheet node={node} onClose={() => setCreate(null)} onComplete={changed} />
      )}
      {create && create !== 'container' && (
        <ContainerResourceCreateSheet
          node={node}
          type={create}
          onClose={() => setCreate(null)}
          onComplete={changed}
        />
      )}
      {detail && (
        <ContainerDetailSheet node={node} resource={detail} onClose={() => setDetail(null)} />
      )}
      {operation && (
        <OperationModal
          operation={operation}
          onClose={() => setOperation(null)}
          onComplete={changed}
        />
      )}
    </div>
  )
}
