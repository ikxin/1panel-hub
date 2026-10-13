import { useCallback } from 'react'
import Banner from '@douyinfe/semi-ui/lib/es/banner'
import Button from '@douyinfe/semi-ui/lib/es/button'
import { Form } from '@douyinfe/semi-ui/lib/es/form'
import { ResourceForm } from '../management/ResourceForm'
import { usePanelQuery } from '../../hooks/usePanelQuery'
import { createContainer, fetchContainerNetworks } from '../../lib/container'
import type { NodeConfig } from '../../lib/nodes'
import type { ContainerCreateValues } from '../../types/container'

export function ContainerCreateSheet({
  node,
  onClose,
  onComplete,
}: {
  node: NodeConfig
  onClose: () => void
  onComplete: () => void
}) {
  const load = useCallback((signal: AbortSignal) => fetchContainerNetworks(node, signal), [node])
  const networks = usePanelQuery(JSON.stringify(node), load)
  return (
    <ResourceForm<ContainerCreateValues>
      title="创建容器"
      initialValues={{
        name: '',
        image: '',
        network: 'bridge',
        restartPolicy: 'unless-stopped',
        ports: '',
        volumes: '',
        env: '',
        cpus: 0,
        memory: 0,
        forcePull: false,
      }}
      disabled={networks.loading || Boolean(networks.error)}
      onClose={onClose}
      onComplete={onComplete}
      onSubmit={(values, signal) => createContainer(node, values, signal)}
    >
      {networks.error && (
        <Banner
          type="danger"
          closeIcon={null}
          description={
            <>
              {networks.error}
              <Button theme="borderless" onClick={networks.refresh}>
                重试
              </Button>
            </>
          }
        />
      )}
      <Form.Input
        field="name"
        label="容器名称"
        placeholder="my-container"
        rules={[{ required: true, message: '请输入容器名称' }]}
      />
      <Form.Input
        field="image"
        label="镜像"
        placeholder="nginx:stable"
        rules={[{ required: true, message: '请输入镜像名称' }]}
        extraText="可填写仓库地址；节点没有此镜像时会自动拉取。"
      />
      <Form.Switch field="forcePull" label="始终拉取镜像" />
      <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <Form.Select
          field="network"
          label="网络"
          style={{ width: '100%' }}
          optionList={(networks.data ?? []).map((item) => ({
            label: item.option,
            value: item.option,
          }))}
          rules={[{ required: true }]}
        />
        <Form.Select
          field="restartPolicy"
          label="重启策略"
          style={{ width: '100%' }}
          optionList={[
            { value: 'unless-stopped', label: '除手动停止外自动重启' },
            { value: 'always', label: '始终重启' },
            { value: 'on-failure', label: '失败时重启' },
            { value: 'no', label: '不自动重启' },
          ]}
        />
      </div>
      <Form.TextArea
        field="ports"
        label="端口映射"
        placeholder={'8080:80\n127.0.0.1:5432:5432/tcp'}
        extraText="每行：主机端口:容器端口，可加主机 IPv4 地址和 /tcp 或 /udp。省略地址时监听所有接口。"
      />
      <Form.TextArea
        field="volumes"
        label="存储挂载"
        placeholder={'my-data:/var/lib/data\n/opt/config:/etc/config:ro'}
        extraText="每行：存储卷名称或主机绝对路径:容器绝对路径[:ro 或 rw]。"
      />
      <Form.TextArea
        field="env"
        label="环境变量"
        placeholder={'TZ=Asia/Shanghai\nAPP_ENV=production'}
        extraText="每行一个 KEY=value。"
      />
      <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <Form.InputNumber
          field="cpus"
          label="CPU 上限（核）"
          min={0}
          step={0.5}
          extraText="0 表示不限制"
          style={{ width: '100%' }}
        />
        <Form.InputNumber
          field="memory"
          label="内存上限（MiB）"
          min={0}
          precision={0}
          extraText="0 表示不限制"
          style={{ width: '100%' }}
        />
      </div>
    </ResourceForm>
  )
}
