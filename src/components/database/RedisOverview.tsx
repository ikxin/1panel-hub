import { useCallback, useState } from 'react'
import Banner from '@douyinfe/semi-ui/lib/es/banner'
import Button from '@douyinfe/semi-ui/lib/es/button'
import Card from '@douyinfe/semi-ui/lib/es/card'
import { Form } from '@douyinfe/semi-ui/lib/es/form'
import { usePanelQuery } from '../../hooks/usePanelQuery'
import { changeRedisPassword, fetchRedisStatus } from '../../lib/database'
import type { NodeConfig } from '../../lib/nodes'
import type { DatabaseInstance } from '../../types/database'
import { formatBytes, formatMetric } from '../../utils/formatter'
import { ResourceMetrics } from '../management/ResourceLayout'
import { ResourceForm } from '../management/ResourceForm'

export function RedisOverview({
  node,
  instance,
}: {
  node: NodeConfig
  instance: DatabaseInstance
}) {
  const load = useCallback(
    (signal: AbortSignal) => fetchRedisStatus(node, instance, signal),
    [node, instance],
  )
  const state = usePanelQuery(instance.database, load, { interval: 10000 })
  const [passwordOpen, setPasswordOpen] = useState(false)
  const data = state.data
  return (
    <div className="space-y-4">
      {state.error && (
        <Banner
          type="danger"
          closeIcon={null}
          description={
            <>
              {state.error}
              <Button theme="borderless" onClick={state.refresh}>
                重试
              </Button>
            </>
          }
        />
      )}
      <ResourceMetrics
        items={[
          { label: '连接客户端', value: data?.connected_clients, hint: '当前连接数' },
          {
            label: '内存使用',
            value: data ? formatBytes(Number(data.used_memory)) : undefined,
            hint: 'Redis 数据内存',
          },
          { label: '每秒操作', value: data?.instantaneous_ops_per_sec, hint: '即时吞吐量' },
          { label: '运行天数', value: data?.uptime_in_days, hint: '自上次启动' },
        ]}
      />
      <Card
        title="Redis 状态"
        headerExtraContent={
          <Button loading={state.loading} onClick={state.refresh}>
            刷新
          </Button>
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2 text-sm text-(--semi-color-text-2)">
            <p className="m-0">
              累计命令：{data ? formatMetric(Number(data.total_commands_processed), 0) : '—'}
            </p>
            <p className="m-0">
              缓存命中 / 未命中：{data ? `${data.keyspace_hits} / ${data.keyspace_misses}` : '—'}
            </p>
            <p className="m-0 text-xs">页面可见时每 10 秒更新状态。</p>
          </div>
          <Button disabled={!data || Boolean(state.error)} onClick={() => setPasswordOpen(true)}>
            修改访问密码
          </Button>
        </div>
      </Card>
      {passwordOpen && (
        <ResourceForm<{ password: string; confirmation: string }>
          title="修改 Redis 密码"
          initialValues={{ password: '', confirmation: '' }}
          onClose={() => setPasswordOpen(false)}
          onComplete={() => {
            setPasswordOpen(false)
            state.refresh()
          }}
          onSubmit={(values, signal) =>
            changeRedisPassword(node, instance, values.password, signal)
          }
        >
          <Banner
            type="warning"
            closeIcon={null}
            description="修改后，请同步更新连接此实例的所有应用配置。"
          />
          <Form.Input
            field="password"
            label="新密码"
            mode="password"
            autoComplete="new-password"
            rules={[{ required: true }]}
          />
          <Form.Input
            field="confirmation"
            label="确认新密码"
            mode="password"
            validator={(value, values) =>
              value && value === values.password ? '' : '两次密码不一致'
            }
          />
        </ResourceForm>
      )}
    </div>
  )
}
