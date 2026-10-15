import Banner from '@douyinfe/semi-ui/lib/es/banner'
import { Form } from '@douyinfe/semi-ui/lib/es/form'
import { ResourceForm } from '../management/ResourceForm'
import type { NodeConfig } from '../../lib/nodes'
import { saveFirewallRule } from '../../lib/firewall'
import type { FirewallItem, FirewallProvider, FirewallRuleValues } from '../../types/firewall'

export function FirewallRuleSheet({
  node,
  provider,
  item,
  onClose,
  onComplete,
}: {
  node: NodeConfig
  provider: FirewallProvider
  item?: FirewallItem
  onClose: () => void
  onComplete: () => void
}) {
  return (
    <ResourceForm<FirewallRuleValues>
      title={item ? '编辑防火墙规则' : '添加防火墙规则'}
      initialValues={{
        family: item?.rule.scope.family ?? 'ipv4',
        protocol: item?.rule.protocol ?? 'tcp',
        action: item?.rule.action ?? 'accept',
        sourceAddress: item?.rule.sourceAddress ?? '',
        destinationPort: item?.rule.destinationPort ?? '',
        description: item?.rule.description ?? '',
      }}
      onSubmit={(values, signal) => saveFirewallRule(node, provider, values, item, signal)}
      onClose={onClose}
      onComplete={onComplete}
    >
      <Banner
        type="warning"
        closeIcon={null}
        description="规则会直接影响节点入站流量，请保留面板和 SSH 管理端口的访问权限。"
      />
      <div className="grid grid-cols-2 gap-x-4">
        <Form.Select
          field="family"
          label="地址族"
          disabled={Boolean(item)}
          style={{ width: '100%' }}
          optionList={[
            { label: 'IPv4', value: 'ipv4' },
            { label: 'IPv6', value: 'ipv6' },
            ...(item?.rule.scope.family === 'inet'
              ? [{ label: 'IPv4 / IPv6', value: 'inet' }]
              : []),
          ]}
        />
        <Form.Select
          field="protocol"
          label="协议"
          style={{ width: '100%' }}
          optionList={[
            { label: 'TCP', value: 'tcp' },
            { label: 'UDP', value: 'udp' },
            { label: '全部协议', value: 'all' },
          ]}
        />
      </div>
      <Form.Select
        field="action"
        label="处理策略"
        style={{ width: '100%' }}
        optionList={[
          { label: '允许', value: 'accept' },
          { label: '丢弃', value: 'drop' },
          { label: '拒绝', value: 'reject' },
        ]}
      />
      <Form.Input
        field="sourceAddress"
        label="来源 IP / 网段"
        placeholder="例如 192.168.1.0/24"
        extraText="留空表示任意来源；每条规则填写一个 IP 或网段。"
      />
      <Form.Input
        field="destinationPort"
        label="目标端口"
        placeholder="例如 80,443 或 8000:8080"
        extraText="留空表示所有端口。来源地址与端口至少填写一项。"
      />
      <Form.TextArea field="description" label="备注" maxLength={256} />
    </ResourceForm>
  )
}
