import Banner from '@douyinfe/semi-ui/lib/es/banner'
import { Form } from '@douyinfe/semi-ui/lib/es/form'
import { ResourceForm } from '../management/ResourceForm'
import { createNetwork, createVolume, pullImage } from '../../lib/container'
import type { NodeConfig } from '../../lib/nodes'

export function ContainerResourceCreateSheet({
  node,
  type,
  onClose,
  onComplete,
}: {
  node: NodeConfig
  type: 'image' | 'network' | 'volume'
  onClose: () => void
  onComplete: () => void
}) {
  if (type === 'image')
    return (
      <ResourceForm<{ names: string }>
        title="拉取镜像"
        initialValues={{ names: '' }}
        onClose={onClose}
        onComplete={onComplete}
        onSubmit={(values, signal) => pullImage(node, values.names, signal)}
      >
        <Form.TextArea
          field="names"
          label="镜像名称"
          placeholder={'nginx:stable\nredis:7-alpine'}
          rules={[{ required: true, message: '请输入镜像名称' }]}
          extraText="每行一个完整镜像名称，可包含仓库地址、标签或摘要。"
        />
      </ResourceForm>
    )
  if (type === 'network')
    return (
      <ResourceForm<{ name: string; subnet: string; gateway: string }>
        title="创建网络"
        initialValues={{ name: '', subnet: '', gateway: '' }}
        onClose={onClose}
        onComplete={onComplete}
        onSubmit={(values, signal) => createNetwork(node, values, signal)}
      >
        <Banner
          type="info"
          closeIcon={null}
          description="创建 bridge 网络，同一网络中的容器可以通过名称互相访问。"
        />
        <Form.Input
          field="name"
          label="网络名称"
          rules={[{ required: true, message: '请输入网络名称' }]}
        />
        <Form.Input
          field="subnet"
          label="IPv4 子网"
          placeholder="172.28.0.0/16"
          extraText="留空时由 Docker 自动分配。"
        />
        <Form.Input field="gateway" label="IPv4 网关" placeholder="172.28.0.1" />
      </ResourceForm>
    )
  return (
    <ResourceForm<{ name: string }>
      title="创建存储卷"
      initialValues={{ name: '' }}
      onClose={onClose}
      onComplete={onComplete}
      onSubmit={(values, signal) => createVolume(node, values.name, signal)}
    >
      <Banner
        type="info"
        closeIcon={null}
        description="使用 local 驱动创建持久化存储卷，可在创建容器时挂载。"
      />
      <Form.Input
        field="name"
        label="存储卷名称"
        placeholder="my-data"
        rules={[{ required: true, message: '请输入存储卷名称' }]}
      />
    </ResourceForm>
  )
}
