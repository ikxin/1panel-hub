import { useCallback, useState } from 'react'
import Banner from '@douyinfe/semi-ui/lib/es/banner'
import Button from '@douyinfe/semi-ui/lib/es/button'
import Card from '@douyinfe/semi-ui/lib/es/card'
import Empty from '@douyinfe/semi-ui/lib/es/empty'
import Select from '@douyinfe/semi-ui/lib/es/select'
import Tag from '@douyinfe/semi-ui/lib/es/tag'
import { IconPlus, IconShield } from '@douyinfe/semi-icons'
import {
  ResourceToolbar,
  ResourceSearchInput,
  ResourceState,
  ResourcePagination,
  ResourceMetrics,
} from '../components/management/ResourceLayout'
import type { ModulePageProps } from '../components/management/ResourceLayout'
import { OperationModal } from '../components/management/OperationModal'
import type { ResourceOperation } from '../components/management/OperationModal'
import { FirewallRuleSheet } from '../components/firewall/FirewallRuleSheet'
import { usePanelQuery } from '../hooks/usePanelQuery'
import { useResourceSearch } from '../hooks/useResourceSearch'
import {
  canEditFirewallRule,
  deleteFirewallRule,
  fetchFirewallBase,
  operateFirewall,
  searchFirewallRules,
} from '../lib/firewall'
import { firewallProviders } from '../types/firewall'
import type { FirewallItem, FirewallProvider } from '../types/firewall'

const stateLabels: Record<string, string> = {
  managed: '面板管理',
  adopted: '已接管',
  external: '外部规则',
  drifted: '规则有偏差',
  protected: '系统保护',
}
export function FirewallPage(props: ModulePageProps) {
  const { node } = props
  const [action, setAction] = useState('')
  const [editor, setEditor] = useState<{ item?: FirewallItem } | null>(null)
  const [operation, setOperation] = useState<ResourceOperation | null>(null)
  const loadBase = useCallback((signal: AbortSignal) => fetchFirewallBase(node, signal), [node])
  const base = usePanelQuery(JSON.stringify(node), loadBase, {
    enabled: Boolean(node.apiKey),
    interval: 15000,
  })
  const provider = firewallProviders.find((value) => value === base.data?.backend)
  const direct = provider === 'iptables' || provider === 'nftables'
  const ready = Boolean(
    provider && base.data?.isExist && (direct ? base.data.isInit : base.data.isActive),
  )
  const filter = useResourceSearch(`${provider}:${action}`)
  const load = useCallback(
    (signal: AbortSignal) =>
      searchFirewallRules(node, provider as FirewallProvider, filter.search, action, signal),
    [node, provider, filter.search, action],
  )
  const list = usePanelQuery(JSON.stringify([node, provider, filter.search, action]), load, {
    enabled: Boolean(node.apiKey && ready),
  })
  const disabled =
    base.loading ||
    list.loading ||
    filter.pending ||
    Boolean(base.error || list.error || base.data?.lifecycleTaskID)
  const refresh = () => {
    base.refresh()
    list.refresh()
  }
  const serviceAction = (title: string, operation: string, description: string) =>
    setOperation({
      title,
      description,
      danger: true,
      confirmName: node.name,
      action: (signal) => operateFirewall(node, operation, signal),
    })
  return (
    <div className="mx-auto flex w-full max-w-400 flex-col gap-5 text-(--semi-color-text-0)">
      <ResourceToolbar
        loading={base.loading || list.loading}
        onRefresh={refresh}
        actions={
          <Button
            theme="solid"
            icon={<IconPlus />}
            disabled={!ready || disabled}
            onClick={() => setEditor({})}
          >
            添加规则
          </Button>
        }
      >
        <ResourceSearchInput
          value={filter.query}
          onChange={filter.setQuery}
          placeholder="搜索端口、地址或备注"
        />
        <Select
          aria-label="规则策略"
          value={action}
          onChange={(value) => setAction(String(value))}
          style={{ width: 150 }}
          optionList={[
            { label: '全部策略', value: '' },
            { label: '允许', value: 'accept' },
            { label: '拒绝 / 丢弃', value: 'deny' },
          ]}
        />
      </ResourceToolbar>
      <ResourceState
        {...props}
        loading={base.loading}
        error={base.error}
        hasData={Boolean(base.data)}
        empty={false}
        onRetry={refresh}
        emptyTitle="未发现防火墙"
        emptyDescription="请在节点上安装防火墙服务。"
      >
        <ResourceMetrics
          items={[
            {
              label: '防火墙后端',
              value: base.data?.name || '—',
              hint: `版本 ${base.data?.version || '—'}`,
            },
            { label: '全部规则', value: list.data?.allTotal, hint: '包含系统与外部规则' },
            { label: '面板管理', value: list.data?.managedTotal, hint: '由 1Panel 管理的规则' },
            {
              label: '防护状态',
              value: base.data
                ? direct
                  ? base.data.isBind
                    ? '已绑定'
                    : '未绑定'
                  : base.data.isActive
                    ? '已启用'
                    : '已停止'
                : '—',
              hint: direct ? '检查规则链是否作用于流量' : '由系统防火墙服务提供防护',
            },
          ]}
        />
        {base.data?.message && (
          <Banner type="warning" closeIcon={null} description={base.data.message} />
        )}
        {base.data?.lifecycleTaskID && (
          <Banner
            type="info"
            closeIcon={null}
            description="防火墙后台操作正在执行，状态每 15 秒更新。"
          />
        )}
        {!base.data?.isExist || !provider ? (
          <Card>
            <Empty
              image={<IconShield size="extra-large" />}
              title="没有可用的防火墙后端"
              description="请先在节点上安装并配置 iptables、nftables、firewalld 或 UFW。"
            />
          </Card>
        ) : (
          <>
            <Card bodyStyle={{ padding: 16 }}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-medium">{base.data.name}</span>
                  <Tag color={base.data.isActive ? 'green' : 'grey'}>
                    {base.data.isActive ? '服务运行中' : '服务未运行'}
                  </Tag>
                </div>
                <div className="flex flex-wrap gap-2">
                  {direct ? (
                    <Button
                      disabled={disabled}
                      onClick={() =>
                        serviceAction(
                          base.data!.isInit
                            ? base.data!.isBind
                              ? '解除防火墙绑定'
                              : '绑定防火墙规则'
                            : '初始化防火墙',
                          !base.data!.isInit
                            ? 'init-base'
                            : base.data!.isBind
                              ? 'unbind-base'
                              : 'bind-base',
                          '此操作会改变 1Panel 规则链的生效状态，可能影响现有连接。',
                        )
                      }
                    >
                      {!base.data.isInit
                        ? '初始化规则链'
                        : base.data.isBind
                          ? '解除绑定'
                          : '启用规则链'}
                    </Button>
                  ) : (
                    <>
                      <Button
                        disabled={disabled}
                        type={base.data.isActive ? 'danger' : 'primary'}
                        onClick={() =>
                          serviceAction(
                            base.data!.isActive ? '停止防火墙' : '启动防火墙',
                            base.data!.isActive ? 'stop' : 'start',
                            '此操作会改变节点防火墙状态，可能影响 SSH、面板和容器端口访问。',
                          )
                        }
                      >
                        {base.data.isActive ? '停止服务' : '启动服务'}
                      </Button>
                      <Button
                        disabled={disabled || !base.data.isActive}
                        onClick={() =>
                          serviceAction(
                            '重启防火墙',
                            'restart',
                            '重启期间网络规则会重新加载，现有连接可能暂时中断。',
                          )
                        }
                      >
                        重启服务
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
            {ready ? (
              <ResourceState
                {...props}
                loading={list.loading}
                error={list.error}
                hasData={Boolean(list.data)}
                empty={!list.data?.items.length}
                filtered={Boolean(filter.query || action)}
                onRetry={refresh}
                emptyTitle="还没有访问规则"
                emptyDescription="添加端口或来源地址规则，开始管理节点入站访问。"
              >
                <section aria-label="防火墙规则" className="grid gap-3">
                  {list.data?.items.map((item, index) => (
                    <Card
                      key={item.desired?.uuid ?? `${item.rule.uuid ?? 'external'}:${index}`}
                      bodyStyle={{ padding: 16 }}
                    >
                      <article className="flex flex-col gap-4 lg:flex-row lg:items-center">
                        <div className="flex min-w-0 flex-1 flex-col gap-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Tag color={item.rule.action === 'accept' ? 'green' : 'red'}>
                              {item.rule.action === 'accept'
                                ? '允许'
                                : item.rule.action === 'reject'
                                  ? '拒绝'
                                  : item.rule.action === 'drop'
                                    ? '丢弃'
                                    : item.rule.action}
                            </Tag>
                            <span className="font-mono text-sm font-semibold">
                              {item.rule.protocol.toUpperCase() || '原生规则'} ·{' '}
                              {item.rule.destinationPort || '全部端口'}
                            </span>
                            <Tag size="small">{item.rule.scope.family.toUpperCase()}</Tag>
                            <Tag size="small" color={item.state === 'drifted' ? 'orange' : 'grey'}>
                              {stateLabels[item.state] ?? item.state}
                            </Tag>
                          </div>
                          <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-(--semi-color-text-2)">
                            <span className="wrap-anywhere">
                              来源：{item.rule.sourceAddress || '任意地址'}
                              {item.rule.sourcePort ? `:${item.rule.sourcePort}` : ''}
                            </span>
                            <span className="wrap-anywhere">
                              目标：{item.rule.destinationAddress || '本机'}
                            </span>
                            <span>{item.rule.scope.chain || item.rule.scope.zone || '入站'}</span>
                          </div>
                          {(item.rule.description || item.error) && (
                            <p className="m-0 wrap-anywhere text-xs text-(--semi-color-text-2)">
                              {item.error || item.rule.description}
                            </p>
                          )}
                          {item.observed?.parseStatus !== 'supported' && item.observed?.raw && (
                            <pre className="m-0 max-h-28 overflow-auto whitespace-pre-wrap wrap-anywhere rounded bg-(--semi-color-fill-0) p-2 text-xs">
                              {item.observed.raw}
                            </pre>
                          )}
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <Button
                            disabled={disabled || !canEditFirewallRule(item)}
                            onClick={() => setEditor({ item })}
                          >
                            编辑
                          </Button>
                          <Button
                            type="danger"
                            theme="borderless"
                            disabled={disabled || !canEditFirewallRule(item)}
                            onClick={() =>
                              setOperation({
                                title: '删除访问规则',
                                description: `删除 ${item.rule.protocol.toUpperCase()} / ${item.rule.destinationPort || '全部端口'} 规则，来源 ${item.rule.sourceAddress || '任意地址'}。移除允许规则可能导致连接中断。`,
                                danger: true,
                                action: (signal) => deleteFirewallRule(node, item, signal),
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
            ) : (
              <Banner
                type="info"
                closeIcon={null}
                description={
                  direct
                    ? '初始化规则链后即可管理访问规则。'
                    : '启动防火墙服务后即可读取和管理规则。'
                }
              />
            )}
          </>
        )}
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
      {editor && provider && (
        <FirewallRuleSheet
          node={node}
          provider={provider}
          item={editor.item}
          onClose={() => setEditor(null)}
          onComplete={() => {
            setEditor(null)
            refresh()
          }}
        />
      )}
      {operation && (
        <OperationModal
          operation={operation}
          onClose={() => setOperation(null)}
          onComplete={() => {
            setOperation(null)
            refresh()
          }}
        />
      )}
    </div>
  )
}
