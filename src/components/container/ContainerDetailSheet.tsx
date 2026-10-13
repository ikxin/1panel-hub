import { useCallback, useState } from 'react'
import Banner from '@douyinfe/semi-ui/lib/es/banner'
import Button from '@douyinfe/semi-ui/lib/es/button'
import SideSheet from '@douyinfe/semi-ui/lib/es/sideSheet'
import Spin from '@douyinfe/semi-ui/lib/es/spin'
import Tabs from '@douyinfe/semi-ui/lib/es/tabs'
import { usePanelQuery } from '../../hooks/usePanelQuery'
import { fetchContainerLogs, inspectContainerResource } from '../../lib/container'
import type { NodeConfig } from '../../lib/nodes'
import type { ContainerResource } from '../../types/container'
import { formatInspect, resourceId, resourceName } from '../../utils/container'

export function ContainerDetailSheet({
  node,
  resource,
  onClose,
}: {
  node: NodeConfig
  resource: ContainerResource
  onClose: () => void
}) {
  const [tab, setTab] = useState('inspect')
  const load = useCallback(
    (signal: AbortSignal) =>
      tab === 'logs' && resource.kind === 'container'
        ? fetchContainerLogs(node, resource.data.name, signal)
        : inspectContainerResource(node, resource, signal),
    [node, resource, tab],
  )
  const state = usePanelQuery(`${resource.kind}:${resourceId(resource)}:${tab}`, load)
  return (
    <SideSheet visible title={resourceName(resource)} width="min(800px, 100vw)" onCancel={onClose}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          type="button"
          activeKey={tab}
          onChange={setTab}
          tabList={[
            { itemKey: 'inspect', tab: '配置详情' },
            ...(resource.kind === 'container' ? [{ itemKey: 'logs', tab: '容器日志' }] : []),
          ]}
        />
        <Button onClick={state.refresh} loading={state.loading}>
          刷新
        </Button>
      </div>
      {state.error && (
        <Banner className="mt-4" type="danger" closeIcon={null} description={state.error} />
      )}
      {tab === 'logs' && (
        <p className="text-xs text-(--semi-color-text-2)">最近 24 小时内的最后 200 行日志。</p>
      )}
      {state.loading && !state.data ? (
        <div className="py-10 text-center">
          <Spin />
        </div>
      ) : (
        <pre className="mt-4 max-h-[75vh] overflow-auto rounded-lg bg-(--semi-color-fill-0) p-4 text-xs whitespace-pre-wrap wrap-anywhere">
          {state.data
            ? tab === 'inspect'
              ? formatInspect(state.data)
              : state.data
            : state.error
              ? '无法读取内容'
              : '暂无内容'}
        </pre>
      )}
    </SideSheet>
  )
}
