import { useCallback, useState } from 'react'
import Banner from '@douyinfe/semi-ui/lib/es/banner'
import Button from '@douyinfe/semi-ui/lib/es/button'
import Select from '@douyinfe/semi-ui/lib/es/select'
import { IconPlus } from '@douyinfe/semi-icons'
import {
  ResourceToolbar,
  ResourceMetrics,
  ResourcePagination,
  ResourceSearchInput,
  ResourceState,
} from '../components/management/ResourceLayout'
import type { ModulePageProps } from '../components/management/ResourceLayout'
import { OperationModal } from '../components/management/OperationModal'
import type { ResourceOperation } from '../components/management/OperationModal'
import { WebsiteCard } from '../components/website/WebsiteCard'
import { WebsiteCreateSheet } from '../components/website/WebsiteCreateSheet'
import { WebsiteDetailSheet } from '../components/website/WebsiteDetailSheet'
import { WebsiteHttpsSheet } from '../components/website/WebsiteHttpsSheet'
import { usePanelQuery } from '../hooks/usePanelQuery'
import { useResourceSearch } from '../hooks/useResourceSearch'
import { deleteWebsite, fetchWebsiteGroups, operateWebsite, searchWebsites } from '../lib/website'
import type { Website } from '../types/website'
import { websiteTypes } from '../utils/website'

export function WebsitePage(props: ModulePageProps) {
  const { node } = props
  const [type, setType] = useState('')
  const [group, setGroup] = useState(0)
  const [create, setCreate] = useState(false)
  const [detail, setDetail] = useState<Website | null>(null)
  const [https, setHttps] = useState<Website | null>(null)
  const [operation, setOperation] = useState<ResourceOperation | null>(null)
  const filter = useResourceSearch(`${type}:${group}`)
  const load = useCallback(
    (signal: AbortSignal) => searchWebsites(node, filter.search, type, group, signal),
    [node, filter.search, type, group],
  )
  const list = usePanelQuery(JSON.stringify([node, filter.search, type, group]), load, {
    enabled: Boolean(node.apiKey),
  })
  const loadGroups = useCallback((signal: AbortSignal) => fetchWebsiteGroups(node, signal), [node])
  const groups = usePanelQuery(JSON.stringify(node), loadGroups, { enabled: Boolean(node.apiKey) })
  const items = list.data?.items
  const disabled = list.loading || filter.pending || Boolean(list.error)
  const refresh = () => {
    list.refresh()
    groups.refresh()
  }
  return (
    <div className="mx-auto flex w-full max-w-400 flex-col gap-5 text-(--semi-color-text-0)">
      <ResourceToolbar
        loading={list.loading}
        onRefresh={refresh}
        actions={
          <Button
            theme="solid"
            icon={<IconPlus />}
            disabled={!node.apiKey || !groups.data?.length}
            onClick={() => setCreate(true)}
          >
            创建网站
          </Button>
        }
      >
        <ResourceSearchInput
          value={filter.query}
          onChange={filter.setQuery}
          placeholder="搜索域名或网站名称"
        />
        <Select
          aria-label="网站类型"
          value={type}
          onChange={(value) => setType(String(value))}
          optionList={[{ label: '全部类型', value: '' }, ...websiteTypes]}
          style={{ minWidth: 130 }}
        />
        <Select
          aria-label="网站分组"
          value={group}
          onChange={(value) => setGroup(Number(value))}
          optionList={[
            { label: '全部分组', value: 0 },
            ...(groups.data ?? []).map((item) => ({ label: item.name, value: item.id })),
          ]}
          style={{ minWidth: 130 }}
        />
      </ResourceToolbar>
      {groups.error && (
        <Banner type="warning" closeIcon={null} description={`网站分组加载失败：${groups.error}`} />
      )}
      <ResourceMetrics
        items={[
          { label: '网站总数', value: list.data?.total, hint: '当前筛选结果' },
          {
            label: '运行中',
            value: items?.filter((item) => item.status === 'Running').length,
            hint: '当前页面',
          },
          {
            label: 'HTTPS',
            value: items?.filter((item) => item.protocol.toLowerCase() === 'https').length,
            hint: '当前页面',
          },
          {
            label: '已停止',
            value: items?.filter((item) => item.status === 'Stopped').length,
            hint: '当前页面',
          },
        ]}
      />
      <ResourceState
        {...props}
        loading={list.loading}
        error={list.error}
        hasData={Boolean(list.data)}
        empty={!items?.length}
        filtered={Boolean(type || group || filter.query)}
        onRetry={refresh}
        emptyTitle="还没有网站"
        emptyDescription="创建静态网站或反向代理，将域名连接到你的服务。"
      >
        <section
          aria-label="网站列表"
          aria-busy={list.loading || filter.pending}
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {items?.map((website) => (
            <WebsiteCard
              key={website.id}
              website={website}
              disabled={disabled}
              onDetail={() => setDetail(website)}
              onHttps={() => setHttps(website)}
              onOperate={() => {
                const action = website.status === 'Running' ? 'stop' : 'start'
                setOperation({
                  title: `${action === 'stop' ? '停止' : '启动'}网站`,
                  description: `在节点「${node.name}」上${action === 'stop' ? '停止' : '启动'}「${website.primaryDomain}」。${action === 'stop' ? '停止后网站将无法正常访问。' : ''}`,
                  action: (signal) => operateWebsite(node, website.id, action, signal),
                })
              }}
              onDelete={() =>
                setOperation({
                  title: '删除网站',
                  description: `删除「${website.primaryDomain}」及其网站配置、站点目录。站点文件无法恢复，关联应用、数据库及已有备份将保留。`,
                  danger: true,
                  confirmName: website.primaryDomain,
                  action: (signal) => deleteWebsite(node, website.id, signal),
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
      {create && (
        <WebsiteCreateSheet
          node={node}
          groups={groups.data ?? []}
          onClose={() => setCreate(false)}
          onComplete={() => {
            setCreate(false)
            list.refresh()
          }}
        />
      )}
      {detail && (
        <WebsiteDetailSheet
          node={node}
          website={detail}
          onClose={() => setDetail(null)}
          onChanged={list.refresh}
        />
      )}
      {https && (
        <WebsiteHttpsSheet
          node={node}
          website={https}
          onClose={() => setHttps(null)}
          onComplete={() => {
            setHttps(null)
            list.refresh()
          }}
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
