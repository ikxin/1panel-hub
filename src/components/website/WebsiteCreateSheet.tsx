import { useState } from 'react'
import Banner from '@douyinfe/semi-ui/lib/es/banner'
import { Form } from '@douyinfe/semi-ui/lib/es/form'
import { ResourceForm } from '../management/ResourceForm'
import { createWebsite } from '../../lib/website'
import type { NodeConfig } from '../../lib/nodes'
import type { WebsiteCreateValues, WebsiteGroup } from '../../types/website'

export function WebsiteCreateSheet({
  node,
  groups,
  onClose,
  onComplete,
}: {
  node: NodeConfig
  groups: WebsiteGroup[]
  onClose: () => void
  onComplete: () => void
}) {
  const [type, setType] = useState('static')
  return (
    <ResourceForm<WebsiteCreateValues>
      title="创建网站"
      initialValues={{
        type: 'static',
        alias: '',
        domains: '',
        port: 80,
        webSiteGroupId: groups[0]?.id ?? 0,
        proxy: '',
        remark: '',
      }}
      onClose={onClose}
      onComplete={onComplete}
      disabled={!groups.length}
      onSubmit={(values, signal) => createWebsite(node, values, signal)}
    >
      <Banner
        type="info"
        closeIcon={null}
        description="网站由节点上的 OpenResty 提供服务，请先在应用商店中安装并启动 OpenResty。"
      />
      {!groups.length && (
        <Banner
          className="mt-3"
          type="warning"
          closeIcon={null}
          description="没有可用的网站分组，请先在节点中创建分组后刷新。"
        />
      )}
      <Form.Select
        field="type"
        label="网站类型"
        style={{ width: '100%' }}
        optionList={[
          { label: '静态网站', value: 'static' },
          { label: '反向代理', value: 'proxy' },
        ]}
        onChange={(value) => setType(String(value))}
      />
      <Form.TextArea
        field="domains"
        label="域名"
        placeholder={'example.com\nwww.example.com'}
        extraText="每行一个域名，第一个作为主域名；不包含协议、端口或路径。"
        rules={[{ required: true, message: '请输入域名' }]}
      />
      <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <Form.InputNumber
          field="port"
          label="HTTP 端口"
          min={1}
          max={65535}
          precision={0}
          style={{ width: '100%' }}
          rules={[{ required: true }]}
        />
        <Form.Select
          field="webSiteGroupId"
          label="网站分组"
          style={{ width: '100%' }}
          optionList={groups.map((group) => ({ label: group.name, value: group.id }))}
          rules={[{ required: true }]}
        />
      </div>
      <Form.Input
        field="alias"
        label="网站代号"
        placeholder="my-website"
        extraText="用于节点上的网站目录，创建后不可更改。"
        rules={[{ required: true, message: '请输入网站代号' }]}
      />
      {type === 'proxy' && (
        <Form.Input
          field="proxy"
          label="代理目标"
          placeholder="http://127.0.0.1:3000"
          rules={[{ required: true, message: '请输入代理目标' }]}
        />
      )}
      <Form.TextArea field="remark" label="备注" maxLength={256} />
    </ResourceForm>
  )
}
