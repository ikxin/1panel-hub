import { useState } from 'react'
import Banner from '@douyinfe/semi-ui/lib/es/banner'
import Button from '@douyinfe/semi-ui/lib/es/button'
import Input from '@douyinfe/semi-ui/lib/es/input'
import Modal from '@douyinfe/semi-ui/lib/es/modal'
import Select from '@douyinfe/semi-ui/lib/es/select'
import Spin from '@douyinfe/semi-ui/lib/es/spin'
import Toast from '@douyinfe/semi-ui/lib/es/toast'
import { useAppOperation } from '../../hooks/useAppOperation'
import type { NodeConfig } from '../../lib/nodes'
import type { AppOperation, InstalledApp } from '../../types/appstore'

const operationLabels: Record<AppOperation, string> = {
  start: '启动',
  stop: '停止',
  restart: '重启',
  delete: '卸载',
  upgrade: '升级',
}

export function AppOperationModal({
  node,
  app,
  operation,
  onClose,
  onComplete,
}: {
  node: NodeConfig
  app: InstalledApp
  operation: AppOperation
  onClose: () => void
  onComplete: () => void
}) {
  const state = useAppOperation(node, app, operation)
  const [confirmation, setConfirmation] = useState('')
  const label = operationLabels[operation]
  const disabled =
    state.loading ||
    Boolean(state.loadError) ||
    (operation === 'delete' && (state.resources.length > 0 || confirmation !== app.name)) ||
    (operation === 'upgrade' && !state.version)
  return (
    <Modal
      visible
      title={`${label}应用`}
      style={{ width: 'min(480px, calc(100vw - 32px))' }}
      onCancel={() => {
        if (!state.mutation.busy) onClose()
      }}
      closable={!state.mutation.busy}
      maskClosable={!state.mutation.busy}
      closeOnEsc={!state.mutation.busy}
      footer={
        <div className="flex justify-end gap-2">
          <Button disabled={state.mutation.busy} onClick={onClose}>
            取消
          </Button>
          <Button
            theme="solid"
            type={operation === 'delete' ? 'danger' : 'primary'}
            loading={state.mutation.busy}
            disabled={disabled}
            onClick={() =>
              void state.run().then((success) => {
                if (success) {
                  Toast.success(`${label}请求已提交，应用状态将自动更新`)
                  onComplete()
                }
              })
            }
          >
            确认{label}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 py-2">
        <p className="m-0 wrap-anywhere text-sm">
          在节点「{node.name}」上{label}「{app.name}」。
        </p>
        {state.loading && (
          <div role="status" className="flex items-center gap-2 text-sm text-(--semi-color-text-2)">
            <Spin size="small" />
            正在检查应用…
          </div>
        )}
        {state.loadError && (
          <Banner
            type="danger"
            closeIcon={null}
            description={
              <>
                {state.loadError}
                <Button theme="borderless" onClick={state.retry}>
                  重试
                </Button>
              </>
            }
          />
        )}
        {state.mutation.error && (
          <Banner type="danger" closeIcon={null} description={state.mutation.error} />
        )}
        {(operation === 'stop' || operation === 'restart') && (
          <Banner
            type="warning"
            closeIcon={null}
            description={`${label}期间，此应用及依赖它的服务可能暂时不可用。`}
          />
        )}
        {operation === 'delete' && (
          <>
            <Banner
              type="warning"
              closeIcon={null}
              description="卸载会删除此应用的容器和安装目录，应用数据无法恢复。已有备份和镜像将保留。"
            />
            {state.resources.length > 0 ? (
              <Banner
                type="danger"
                closeIcon={null}
                description={`请先解除以下引用：${state.resources.map((item) => `${item.type === 'website' ? '网站' : '应用'} ${item.name}`).join('、')}`}
              />
            ) : (
              <div>
                <label htmlFor="app-delete-confirmation" className="mb-2 block text-sm">
                  输入应用名称「{app.name}」确认卸载
                </label>
                <Input
                  id="app-delete-confirmation"
                  value={confirmation}
                  onChange={setConfirmation}
                  disabled={state.mutation.busy}
                  autoComplete="off"
                />
              </div>
            )}
          </>
        )}
        {operation === 'upgrade' && !state.loading && !state.loadError && (
          <>
            <Banner
              type="info"
              closeIcon={null}
              description="升级前会自动创建备份，并拉取目标版本镜像。升级期间服务可能暂时不可用。"
            />
            <p className="text-xs text-(--semi-color-text-2)">当前版本：{app.version}</p>
            <Select
              aria-label="升级目标版本"
              placeholder="暂无可升级版本"
              value={state.version || undefined}
              onChange={(value) => state.setVersion(String(value))}
              disabled={state.mutation.busy}
              optionList={state.versions.map((item) => ({
                label: item.version,
                value: item.version,
              }))}
              style={{ width: '100%' }}
            />
          </>
        )}
      </div>
    </Modal>
  )
}
