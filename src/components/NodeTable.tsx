import { useState } from 'react'
import Button from '@douyinfe/semi-ui/lib/es/button'
import Input from '@douyinfe/semi-ui/lib/es/input'
import Popconfirm from '@douyinfe/semi-ui/lib/es/popconfirm'
import Tooltip from '@douyinfe/semi-ui/lib/es/tooltip'
import {
  IconArrowDown,
  IconArrowRight,
  IconArrowUp,
  IconDelete,
  IconEdit,
  IconPlus,
  IconSearch,
  IconServer,
} from '@douyinfe/semi-icons'
import type { NodeConfig } from '../lib/nodes'
import { connectionState } from '../lib/status'
import type { NodeStatus } from '../lib/status'
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

function ResourceMeter({
  label,
  value,
  detail,
}: {
  label: string
  value?: number
  detail: string
}) {
  const percent =
    value !== undefined && Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : undefined
  const tone =
    percent !== undefined && percent >= 90
      ? 'danger'
      : percent !== undefined && percent >= 75
        ? 'warning'
        : 'primary'

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

export function NodeHome({
  nodes,
  statuses,
  now,
  onCreate,
  createDisabled,
  onEdit,
  onDelete,
  onOpen,
}: Props) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'online' | 'offline'>('all')
  const entries = nodes.map((node) => ({
    node,
    status: statuses[node.name],
    connection: connectionState(node, statuses[node.name], now),
  }))
  const onlineCount = entries.filter(({ connection }) => connection.kind === 'online').length
  const attentionCount = entries.filter(
    ({ connection }) => connection.kind === 'offline' || connection.kind === 'attention',
  ).length
  const keyword = query.trim().toLowerCase()
  const visible = entries.filter(
    ({ node, connection }) =>
      (filter === 'all' ||
        (filter === 'online' && connection.kind === 'online') ||
        (filter === 'offline' && connection.kind === 'offline')) &&
      `${node.name} ${node.host}:${node.port}`.toLowerCase().includes(keyword),
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
          <div
            key={label}
            className="min-w-0 px-3 sm:px-6"
            style={{ borderLeft: index ? '1px solid var(--semi-color-border)' : undefined }}
          >
            <dt className="text-xs text-(--semi-color-text-2) sm:text-sm">{label}</dt>
            <dd
              className="mx-0 mt-2 mb-0 text-2xl font-semibold tabular-nums sm:text-3xl"
              style={{ color: `var(--semi-color-${tone})` }}
            >
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <section aria-label="节点列表" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            role="group"
            aria-label="节点状态筛选"
            className="flex items-center gap-1 rounded-(--semi-border-radius-medium) bg-(--semi-color-fill-1) p-1"
          >
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
              style={{
                width: '100%',
                borderRadius: 'var(--semi-border-radius-medium)',
                backgroundColor: 'var(--semi-color-bg-0)',
              }}
            />
          </div>
        </div>
        <div className="text-xs text-(--semi-color-text-2)" role="status" aria-live="polite">
          {keyword || filter !== 'all' ? `找到 ${visible.length} 个节点` : `${nodes.length} 个节点`}
        </div>

        {!visible.length ? (
          <div
            className="rounded-(--semi-border-radius-medium) bg-(--semi-color-bg-0) px-6 py-12 text-center"
            style={{ border: '1px dashed var(--semi-color-border)' }}
          >
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-(--semi-border-radius-medium) bg-(--semi-color-fill-0) text-(--semi-color-text-2)">
              {nodes.length ? <IconSearch size="large" /> : <IconServer size="large" />}
            </div>
            <h2 className="m-0 text-lg font-semibold">
              {nodes.length ? '未找到匹配的节点' : '还没有节点'}
            </h2>
            <p className="mt-2 mb-5 text-sm text-(--semi-color-text-2)">
              {nodes.length
                ? '试试其他关键词，或查看全部节点。'
                : '添加第一台服务器，开始查看运行状态。'}
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
                    .map((value) => (Number.isFinite(value) ? value.toFixed(2) : '—'))
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
                      <h2 className="m-0 wrap-anywhere text-base font-semibold leading-6">
                        {node.name}
                      </h2>
                      <p
                        className="mt-1 mb-0 truncate text-xs text-(--semi-color-text-2)"
                        title={`${node.host} · ${node.port}`}
                      >
                        {node.host} · {node.port}
                      </p>
                    </div>
                    <span
                      className="mt-1 flex shrink-0 items-center gap-1.5 text-xs"
                      style={{ color: `var(--semi-color-${connection.tone})` }}
                    >
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
                      <div className="flex items-center gap-1 text-xs text-(--semi-color-text-2)">
                        <IconArrowDown size="small" />
                        下载速率
                      </div>
                      <div
                        className="mt-1 truncate text-sm font-medium tabular-nums"
                        title={speed(status?.netBytesRecvSpeed)}
                      >
                        {speed(status?.netBytesRecvSpeed)}
                      </div>
                      <div
                        className="mt-1 truncate text-[11px] text-(--semi-color-text-2)"
                        title={size(current?.netBytesRecv)}
                      >
                        累计 {size(current?.netBytesRecv)}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 text-xs text-(--semi-color-text-2)">
                        <IconArrowUp size="small" />
                        上传速率
                      </div>
                      <div
                        className="mt-1 truncate text-sm font-medium tabular-nums"
                        title={speed(status?.netBytesSentSpeed)}
                      >
                        {speed(status?.netBytesSentSpeed)}
                      </div>
                      <div
                        className="mt-1 truncate text-[11px] text-(--semi-color-text-2)"
                        title={size(current?.netBytesSent)}
                      >
                        累计 {size(current?.netBytesSent)}
                      </div>
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
                    <p className="m-0 text-xs text-(--semi-color-warning)">
                      等待更新，显示最近一次采集数据
                    </p>
                  )}

                  <div
                    className="mt-auto flex items-center justify-between gap-2 pt-3"
                    style={{ borderTop: '1px solid var(--semi-color-border)' }}
                  >
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
                        <Button
                          theme="borderless"
                          type="tertiary"
                          icon={<IconEdit />}
                          aria-label={`编辑节点 ${node.name}`}
                          onClick={() => onEdit(node)}
                        />
                      </Tooltip>
                      <Popconfirm
                        title={`删除「${node.name}」？`}
                        content="仅移除本地节点配置。"
                        onConfirm={() => onDelete(node)}
                        okText="删除"
                        cancelText="取消"
                      >
                        <Button
                          theme="borderless"
                          type="danger"
                          icon={<IconDelete />}
                          aria-label={`删除节点 ${node.name}`}
                          title="删除节点"
                        />
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
