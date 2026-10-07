import { useState } from 'react'
import type { ReactNode } from 'react'
import Banner from '@douyinfe/semi-ui/lib/es/banner'
import Button from '@douyinfe/semi-ui/lib/es/button'
import Card from '@douyinfe/semi-ui/lib/es/card'
import Descriptions from '@douyinfe/semi-ui/lib/es/descriptions'
import Empty from '@douyinfe/semi-ui/lib/es/empty'
import Input from '@douyinfe/semi-ui/lib/es/input'
import Popconfirm from '@douyinfe/semi-ui/lib/es/popconfirm'
import Progress from '@douyinfe/semi-ui/lib/es/progress'
import Space from '@douyinfe/semi-ui/lib/es/space'
import Table from '@douyinfe/semi-ui/lib/es/table'
import Tag from '@douyinfe/semi-ui/lib/es/tag'
import Tooltip from '@douyinfe/semi-ui/lib/es/tooltip'
import type { ColumnProps } from '@douyinfe/semi-ui/lib/es/table'
import { IconArrowDown, IconArrowRight, IconArrowUp, IconDelete, IconEdit, IconPlus, IconSearch, IconServer } from '@douyinfe/semi-icons'
import type { NodeConfig } from '../lib/nodes'
import { isOnline } from '../lib/status'
import type { NodeStatus } from '../lib/status'
import type { DiskInfo } from '../types/dashboard'
import { computeSize, computeSizeFromByte, computeSizePair, formatUptime } from '../utils/formatter'

interface Props {
  nodes: NodeConfig[]
  statuses: Record<string, NodeStatus>
  now: number
  onCreate: () => void
  createDisabled?: boolean
  onEdit: (node: NodeConfig) => void
  onDelete: (node: NodeConfig) => void
  onOpen: (node: NodeConfig) => void
}

function Usage({ value }: { value?: number }) {
  if (value === undefined || !Number.isFinite(value)) return <span>—</span>
  const percent = Math.min(100, Math.max(0, value))
  const label = `${percent.toFixed(1)}%`
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_3.5rem] items-center gap-2">
      <Progress percent={percent} showInfo={false} aria-label="使用率" aria-valuetext={label} />
      <span className="whitespace-nowrap text-right font-semibold tabular-nums">{label}</span>
    </div>
  )
}

function Network({
  received,
  sent,
  speed = false,
}: {
  received?: number
  sent?: number
  speed?: boolean
}) {
  const format = (value: number | undefined) => {
    if (value === undefined) return '—'
    return speed ? `${computeSizeFromByte(value)}/s` : computeSize(value)
  }
  return (
    <div className="flex flex-col gap-1 whitespace-nowrap">
      <Space spacing="tight">
        <IconArrowDown aria-label="下载" />
        <span>{format(received)}</span>
      </Space>
      <Space spacing="tight">
        <IconArrowUp aria-label="上传" />
        <span>{format(sent)}</span>
      </Space>
    </div>
  )
}

interface ConnectionState {
  label: string
  kind: 'online' | 'offline' | 'attention' | 'pending'
  tagColor: 'green' | 'orange' | 'red' | 'grey'
  tone: string
}

function connectionState(node: NodeConfig, status: NodeStatus | undefined, now: number): ConnectionState {
  if (!node.apiKey) return { label: '待配置', kind: 'attention', tagColor: 'orange', tone: 'warning' }
  if (isOnline(status, now)) return { label: '在线', kind: 'online', tagColor: 'green', tone: 'success' }
  if (status?.error) return { label: '离线', kind: 'offline', tagColor: 'red', tone: 'danger' }
  if (status?.data) return { label: '等待更新', kind: 'attention', tagColor: 'grey', tone: 'warning' }
  return { label: '连接中', kind: 'pending', tagColor: 'grey', tone: 'text-2' }
}

function NodeState({ node, status, now }: { node: NodeConfig; status?: NodeStatus; now: number }) {
  const connection = connectionState(node, status, now)
  const tag = (
    <Tag color={connection.tagColor}>{connection.label}</Tag>
  )
  return status?.error ? (
    <Tooltip content={status.error}>
      <span>{tag}</span>
    </Tooltip>
  ) : tag
}

function formatVirtualization(value: string): string {
  // v2 的 virtualizationSystem 字段包含序列化后的主机信息。
  try {
    const host = JSON.parse(value) as { virtualizationSystem?: string; virtualizationRole?: string }
    return [host.virtualizationSystem, host.virtualizationRole].filter(Boolean).join(' / ') || '—'
  } catch {
    return value || '—'
  }
}

function ResourceMeter({ label, value, detail }: {
  label: string
  value?: number
  detail: string
}) {
  const percent = value !== undefined && Number.isFinite(value)
    ? Math.min(100, Math.max(0, value))
    : undefined
  const tone = percent !== undefined && percent >= 90 ? 'danger'
    : percent !== undefined && percent >= 75 ? 'warning' : 'primary'

  return (
    <div className="min-w-0">
      <div className="text-xs text-(--semi-color-text-2)">{label}</div>
      <div className="mt-2 flex items-baseline gap-1 tabular-nums">
        <span className="text-2xl font-semibold tracking-tight">
          {percent === undefined ? '—' : percent.toFixed(1).replace(/\.0$/, '')}
        </span>
        {percent !== undefined && <span className="text-xs text-(--semi-color-text-2)">%</span>}
      </div>
      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-(--semi-color-fill-0)"
        role={percent === undefined ? undefined : 'meter'}
        aria-label={percent === undefined ? undefined : `${label}使用率`}
        aria-valuemin={percent === undefined ? undefined : 0}
        aria-valuemax={percent === undefined ? undefined : 100}
        aria-valuenow={percent}
      >
        <div
          className="h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none"
          style={{ width: `${percent ?? 0}%`, backgroundColor: `var(--semi-color-${tone})` }}
        />
      </div>
      <div
        className="mt-1 min-h-4 truncate text-[11px] leading-4 text-(--semi-color-text-2) tabular-nums"
        title={detail}
      >
        {detail}
      </div>
    </div>
  )
}

export function NodeHome({ nodes, statuses, now, onCreate, createDisabled, onEdit, onDelete, onOpen }: Props) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'online' | 'offline'>('all')
  const entries = nodes.map((node) => ({
    node,
    status: statuses[node.name],
    connection: connectionState(node, statuses[node.name], now),
  }))
  const onlineCount = entries.filter(({ connection }) => connection.kind === 'online').length
  const attentionCount = entries.filter(({ connection }) =>
    connection.kind === 'offline' || connection.kind === 'attention'
  ).length
  const keyword = query.trim().toLowerCase()
  const visible = entries.filter(({ node, connection }) =>
    (filter === 'all'
      || (filter === 'online' && connection.kind === 'online')
      || (filter === 'offline' && connection.kind === 'offline'))
    && `${node.name} ${node.host}:${node.port}`.toLowerCase().includes(keyword),
  )
  const summary = [
    { label: '全部节点', value: nodes.length, tone: 'text-0' },
    { label: '在线节点', value: onlineCount, tone: 'success' },
    { label: '需要关注', value: attentionCount, tone: 'warning' },
  ]
  const filters = [
    { value: 'all', label: '全部' },
    { value: 'online', label: '在线' },
    { value: 'offline', label: '离线' },
  ] as const
  const size = (value: number | undefined) =>
    value !== undefined && Number.isFinite(value) ? computeSize(value) : '—'
  const speed = (value: number | undefined) =>
    value !== undefined && Number.isFinite(value) ? `${computeSizeFromByte(value)}/s` : '—'

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 font-sans md:gap-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="m-0 text-2xl font-semibold tracking-tight sm:text-3xl">节点控制台</h1>
          <p className="mt-2 mb-0 text-sm text-(--semi-color-text-2)">服务器状态与资源概览</p>
        </div>
        <Button
          icon={<IconPlus />}
          theme="solid"
          style={{ height: 40, borderRadius: 'var(--semi-border-radius-medium)' }}
          onClick={onCreate}
          disabled={createDisabled}
        >
          创建节点
        </Button>
      </header>

      <dl
        className="m-0 grid grid-cols-3 rounded-(--semi-border-radius-medium) bg-(--semi-color-bg-0) py-4 sm:py-5"
        style={{ border: '1px solid var(--semi-color-border)' }}
      >
        {summary.map(({ label, value, tone }, index) => (
          <div key={label} className="min-w-0 px-3 sm:px-6" style={{ borderLeft: index ? '1px solid var(--semi-color-border)' : undefined }}>
            <dt className="text-xs text-(--semi-color-text-2) sm:text-sm">{label}</dt>
            <dd className="mx-0 mt-2 mb-0 text-2xl font-semibold tabular-nums sm:text-3xl" style={{ color: `var(--semi-color-${tone})` }}>
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <section aria-label="节点列表" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div role="group" aria-label="节点状态筛选" className="flex items-center gap-1 rounded-(--semi-border-radius-medium) bg-(--semi-color-fill-1) p-1">
            {filters.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
                className={`cursor-pointer rounded-(--semi-border-radius-medium) border-0 px-3 py-2 font-sans text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-(--semi-color-primary) ${filter === value ? 'bg-(--semi-color-bg-0) text-(--semi-color-text-0) shadow-sm' : 'bg-transparent text-(--semi-color-text-2) hover:text-(--semi-color-text-0)'}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="min-w-0 w-full sm:w-72">
            <Input
              prefix={<IconSearch />}
              placeholder="搜索名称或地址"
              aria-label="搜索节点名称或地址"
              value={query}
              onChange={setQuery}
              onClear={() => setQuery('')}
              showClear
              composition
              size="large"
              style={{ width: '100%', borderRadius: 'var(--semi-border-radius-medium)', backgroundColor: 'var(--semi-color-bg-0)' }}
            />
          </div>
        </div>
        <div className="text-xs text-(--semi-color-text-2)" role="status" aria-live="polite">
          {keyword || filter !== 'all' ? `找到 ${visible.length} 个节点` : `${nodes.length} 个节点`}
        </div>

        {!visible.length ? (
          <div className="rounded-(--semi-border-radius-medium) bg-(--semi-color-bg-0) px-6 py-12 text-center" style={{ border: '1px dashed var(--semi-color-border)' }}>
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-(--semi-border-radius-medium) bg-(--semi-color-fill-0) text-(--semi-color-text-2)">
              {nodes.length ? <IconSearch size="large" /> : <IconServer size="large" />}
            </div>
            <h2 className="m-0 text-lg font-semibold">{nodes.length ? '未找到匹配的节点' : '还没有节点'}</h2>
            <p className="mt-2 mb-5 text-sm text-(--semi-color-text-2)">
              {nodes.length ? '试试其他关键词，或查看全部节点。' : '添加第一台服务器，开始查看运行状态。'}
            </p>
            <Button
              theme={nodes.length ? 'light' : 'solid'}
              disabled={!nodes.length && createDisabled}
              onClick={() => {
                if (!nodes.length) onCreate()
                else {
                  setQuery('')
                  setFilter('all')
                }
              }}
            >
              {nodes.length ? '清除筛选' : '创建节点'}
            </Button>
          </div>
        ) : (
          <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {visible.map(({ node, status, connection }) => {
              const base = status?.data
              const current = base?.currentInfo
              const disks = current?.diskData
              const disk = disks?.find((item) => item.path === '/') ?? disks?.[0]
              const load = current
                ? [current.load1, current.load5, current.load15]
                    .map((value) => Number.isFinite(value) ? value.toFixed(2) : '—')
                    .join(' / ')
                : '—'

              return (
                <article
                  key={node.name}
                  aria-label={`节点 ${node.name}`}
                  className="flex min-w-0 flex-col gap-5 rounded-(--semi-border-radius-medium) bg-(--semi-color-bg-0) p-5"
                  style={{ border: '1px solid var(--semi-color-border)' }}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-(--semi-border-radius-medium) bg-(--semi-color-primary-light-default) text-(--semi-color-primary)">
                      <IconServer size="large" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="m-0 wrap-anywhere text-base font-semibold leading-6">{node.name}</h2>
                      <p className="mt-1 mb-0 truncate text-xs text-(--semi-color-text-2)" title={`${node.host} · ${node.port}`}>
                        {node.host} · {node.port}
                      </p>
                    </div>
                    <span className="mt-1 flex shrink-0 items-center gap-1.5 text-xs" style={{ color: `var(--semi-color-${connection.tone})` }}>
                      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
                      {connection.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-3">
                    <ResourceMeter
                      label="CPU"
                      value={current?.cpuUsedPercent}
                      detail={base ? `${base.cpuCores} 核 · ${base.cpuLogicalCores} 线程` : '—'}
                    />
                    <ResourceMeter
                      label="内存"
                      value={current?.memoryUsedPercent}
                      detail={computeSizePair(current?.memoryUsed, current?.memoryTotal)}
                    />
                    <ResourceMeter
                      label="磁盘"
                      value={disk?.usedPercent}
                      detail={computeSizePair(disk?.used, disk?.total)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 rounded-(--semi-border-radius-medium) bg-(--semi-color-fill-0) p-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 text-xs text-(--semi-color-text-2)"><IconArrowDown size="small" />下载速率</div>
                      <div className="mt-1 truncate text-sm font-medium tabular-nums" title={speed(status?.netBytesRecvSpeed)}>{speed(status?.netBytesRecvSpeed)}</div>
                      <div className="mt-1 truncate text-[11px] text-(--semi-color-text-2)" title={size(current?.netBytesRecv)}>累计 {size(current?.netBytesRecv)}</div>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 text-xs text-(--semi-color-text-2)"><IconArrowUp size="small" />上传速率</div>
                      <div className="mt-1 truncate text-sm font-medium tabular-nums" title={speed(status?.netBytesSentSpeed)}>{speed(status?.netBytesSentSpeed)}</div>
                      <div className="mt-1 truncate text-[11px] text-(--semi-color-text-2)" title={size(current?.netBytesSent)}>累计 {size(current?.netBytesSent)}</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-[11px] text-(--semi-color-text-2)">
                    <span>运行 {current ? formatUptime(current.uptime) : '—'}</span>
                    <span>负载 {load}</span>
                  </div>
                  {status?.error && (
                    <div className="rounded-(--semi-border-radius-medium) bg-(--semi-color-danger-light-default) px-3 py-2 text-xs text-(--semi-color-danger)">
                      <details>
                        <summary className="cursor-pointer">连接失败，查看原因</summary>
                        <p className="mt-2 mb-0 wrap-anywhere">{status.error}</p>
                      </details>
                      {current && <p className="mt-1 mb-0">显示最近一次采集数据</p>}
                    </div>
                  )}
                  {current && !status?.error && connection.kind !== 'online' && (
                    <p className="m-0 text-xs text-(--semi-color-warning)">等待更新，显示最近一次采集数据</p>
                  )}

                  <div className="mt-auto flex items-center justify-between gap-2 pt-3" style={{ borderTop: '1px solid var(--semi-color-border)' }}>
                    <Button
                      theme="borderless"
                      type="primary"
                      className="shrink-0"
                      icon={<IconArrowRight size="small" />}
                      iconPosition="right"
                      onClick={() => onOpen(node)}
                    >
                      进入面板
                    </Button>
                    <div className="flex items-center gap-1">
                      <Tooltip content="编辑节点">
                        <Button theme="borderless" type="tertiary" icon={<IconEdit />} aria-label={`编辑节点 ${node.name}`} onClick={() => onEdit(node)} />
                      </Tooltip>
                      <Popconfirm
                        title={`删除「${node.name}」？`}
                        content="仅移除本地节点配置。"
                        onConfirm={() => onDelete(node)}
                        okText="删除"
                        cancelText="取消"
                      >
                        <Button theme="borderless" type="danger" icon={<IconDelete />} aria-label={`删除节点 ${node.name}`} title="删除节点" />
                      </Popconfirm>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

export function NodeOverview({ node, status, now, actions }: {
  node: NodeConfig
  status?: NodeStatus
  now: number
  actions?: ReactNode
}) {
  const base = status?.data
  const current = base?.currentInfo
  const cardProps = {
    headerStyle: { padding: 'var(--overview-card-padding, 20px)' },
    bodyStyle: { padding: 'var(--overview-card-padding, 20px)' },
  }
  const size = (value: number | undefined) => value === undefined ? '—' : computeSize(value)
  const speed = (value: number | undefined) =>
    value === undefined ? '—' : `${computeSizeFromByte(value)}/s`
  const load = current
    ? [current.load1, current.load5, current.load15]
        .map((value) => (Number.isFinite(value) ? value.toFixed(2) : '—'))
        .join(' / ')
    : '—'
  const counts = [
    { title: '网站', value: base?.websiteNumber },
    { title: '数据库', value: base?.databaseNumber },
    { title: '已安装应用', value: base?.appInstalledNumber },
    { title: '计划任务', value: base?.cronjobNumber },
    { title: 'AI 智能体', value: base?.agentNumber },
  ]
  const diskColumns: ColumnProps<DiskInfo>[] = [
    { title: '挂载点', dataIndex: 'path', width: 160 },
    { title: '设备', dataIndex: 'device', width: 170 },
    { title: '文件系统', dataIndex: 'type', width: 110 },
    {
      title: '已用 / 总量',
      key: 'capacity',
      width: 180,
      render: (_, disk) => `${size(disk.used)} / ${size(disk.total)}`,
    },
    { title: '可用', key: 'free', width: 120, render: (_, disk) => size(disk.free) },
    { title: '使用率', key: 'usage', width: 180, render: (_, disk) => <Usage value={disk.usedPercent} /> },
    {
      title: 'Inode 使用率',
      key: 'inodes',
      width: 180,
      render: (_, disk) => <Usage value={disk.inodesUsedPercent} />,
    },
  ]

  return (
    <div className="panel-overview flex flex-col gap-3 md:gap-4">
      <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-3">
        <Space>
          <h2 className="m-0 text-xl md:text-2xl">概览</h2>
          <NodeState node={node} status={status} now={now} />
        </Space>
        <div className="flex min-w-0 flex-col gap-2 md:ml-auto md:flex-row md:flex-wrap md:items-center md:justify-end md:gap-3">
          <span className="text-xs md:text-sm" style={{ color: 'var(--semi-color-text-2)' }}>
            {status?.receivedAt
              ? `最近更新：${new Date(status.receivedAt).toLocaleString('zh-CN')}`
              : '等待获取监控数据'}
          </span>
          {actions && <div className="flex min-w-0 items-center gap-2 md:gap-3">{actions}</div>}
        </div>
      </div>
      {status?.error && (
        <Banner
          type="danger"
          closeIcon={null}
          description={`${status.error}${base ? '；以下显示最近一次成功采集的数据。' : ''}`}
        />
      )}
      {base && !status?.error && !isOnline(status, now) && (
        <Banner type="warning" closeIcon={null} description="正在等待节点更新，以下为最近一次采集的数据。" />
      )}
      {!base ? (
        <Card {...cardProps} loading={Boolean(node.apiKey && !status?.error)}>
          <Empty description={node.apiKey ? '暂无概览数据' : '请编辑节点并填写 1Panel v2 API Key'} />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-5">
            {counts.map(({ title, value }, index) => (
              <Card
                {...cardProps}
                key={title}
                className={index === counts.length - 1 ? 'col-span-2 sm:col-span-1' : undefined}
                title={
                  <span className="block whitespace-normal text-sm font-bold md:text-base">
                    {title}
                  </span>
                }
              >
                <div className="text-2xl font-semibold md:text-3xl">{value ?? '—'}</div>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-4">
            <Card {...cardProps} title="CPU">
              <Usage value={current?.cpuUsedPercent} />
              <div className="mt-3">{base.cpuCores} 核 / {base.cpuLogicalCores} 线程</div>
            </Card>
            <Card {...cardProps} title="系统负载">
              <Usage value={current?.loadUsagePercent} />
              <div className="mt-3">{load}（1 / 5 / 15 分钟）</div>
            </Card>
            <Card {...cardProps} title="内存">
              <Usage value={current?.memoryUsedPercent} />
              <div className="mt-3">{size(current?.memoryUsed)} / {size(current?.memoryTotal)}</div>
            </Card>
            <Card {...cardProps} title="交换分区">
              {current?.swapMemoryTotal ? (
                <>
                  <Usage value={current.swapMemoryUsedPercent} />
                  <div className="mt-3">{size(current.swapMemoryUsed)} / {size(current.swapMemoryTotal)}</div>
                </>
              ) : (
                <span>未启用</span>
              )}
            </Card>
          </div>
          <div className="grid grid-cols-1 items-start gap-3 md:gap-4 lg:grid-cols-2">
            <Card {...cardProps} title="系统信息">
              <Descriptions style={{ overflowWrap: 'anywhere' }} data={[
                { key: '主机名', value: base.hostname || '—' },
                { key: '操作系统', value: base.prettyDistro || `${base.platform} ${base.platformVersion}` },
                { key: '内核', value: `${base.os} ${base.kernelVersion}` },
                { key: '架构', value: base.kernelArch || '—' },
                { key: '虚拟化', value: formatVirtualization(base.virtualizationSystem) },
                { key: 'CPU 型号', value: base.cpuModelName || '—' },
                {
                  key: 'CPU 频率',
                  value: Number.isFinite(base.cpuMhz) ? `${base.cpuMhz.toFixed(0)} MHz` : '—',
                },
                { key: 'IPv4 地址', value: base.ipV4Addr || '—' },
                { key: '运行时间', value: current ? formatUptime(current.uptime) : '—' },
                { key: '启动时间', value: current?.timeSinceUptime || '—' },
                { key: '进程数', value: current?.procs ?? '—' },
              ]} />
            </Card>
            <div className="flex flex-col gap-3 md:gap-4">
              <Card {...cardProps} title="网络（全部网卡）">
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <div className="mb-3">实时速率</div>
                    <Network
                      received={status?.netBytesRecvSpeed}
                      sent={status?.netBytesSentSpeed}
                      speed
                    />
                  </div>
                  <div>
                    <div className="mb-3">累计流量</div>
                    <Network received={current?.netBytesRecv} sent={current?.netBytesSent} />
                  </div>
                </div>
              </Card>
              <Card {...cardProps} title="磁盘 I/O（全部设备）">
                <Descriptions data={[
                  { key: '读取速率', value: speed(status?.ioReadBytesSpeed) },
                  { key: '写入速率', value: speed(status?.ioWriteBytesSpeed) },
                  { key: '累计读取', value: size(current?.ioReadBytes) },
                  { key: '累计写入', value: size(current?.ioWriteBytes) },
                ]} />
              </Card>
              <Card {...cardProps} title="内存详情">
                <Descriptions data={[
                  { key: '可用', value: size(current?.memoryAvailable) },
                  { key: '空闲', value: size(current?.memoryFree) },
                  { key: '缓存', value: size(current?.memoryCache) },
                  { key: '共享', value: size(current?.memoryShard) },
                ]} />
              </Card>
            </div>
          </div>
          <Card {...cardProps} title="磁盘分区">
            <Table<DiskInfo>
              rowKey="path"
              columns={diskColumns}
              dataSource={current?.diskData ?? []}
              pagination={false}
              scroll={{ x: '100%' }}
            />
          </Card>
          {Boolean(current?.gpuData?.length || current?.npuData?.length || current?.xpuData?.length) && (
            <Card {...cardProps} title="加速设备">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
                {current?.gpuData?.map((gpu) => (
                  <Card
                    {...cardProps}
                    key={`gpu-${gpu.index}`}
                    title={`GPU ${gpu.index} · ${gpu.productName}`}
                  >
                    <Descriptions data={[
                      { key: '利用率', value: gpu.gpuUtil },
                      { key: '温度', value: gpu.temperature },
                      { key: '显存', value: gpu.memoryUsage || `${gpu.memUsed} / ${gpu.memTotal}` },
                      { key: '功耗', value: gpu.powerUsage || gpu.powerDraw },
                    ]} />
                  </Card>
                ))}
                {current?.npuData?.map((npu) => (
                  <Card
                    {...cardProps}
                    key={`npu-${npu.npuIndex}-${npu.chipIndex}`}
                    title={`NPU ${npu.npuIndex} · ${npu.productName}`}
                  >
                    <Descriptions data={[
                      { key: '健康状态', value: npu.health },
                      { key: '利用率', value: npu.aiCore },
                      { key: '温度', value: npu.temperature },
                      {
                        key: '显存',
                        value: `${npu.memoryUsed || npu.memUsed} / ${npu.memoryTotal || npu.memTotal}`,
                      },
                    ]} />
                  </Card>
                ))}
                {current?.xpuData?.map((xpu) => (
                  <Card
                    {...cardProps}
                    key={`xpu-${xpu.deviceID}`}
                    title={`XPU ${xpu.deviceID} · ${xpu.deviceName}`}
                  >
                    <Descriptions data={[
                      { key: '利用率', value: xpu.gpuUtil },
                      { key: '温度', value: xpu.temperature },
                      { key: '显存', value: `${xpu.memoryUsed} / ${xpu.memory}` },
                      { key: '功耗', value: xpu.power },
                    ]} />
                  </Card>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
