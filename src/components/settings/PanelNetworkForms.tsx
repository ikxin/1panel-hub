import { useEffect, useState } from 'react'
import { z } from 'zod'
import Banner from '@douyinfe/semi-ui/lib/es/banner'
import Button from '@douyinfe/semi-ui/lib/es/button'
import Card from '@douyinfe/semi-ui/lib/es/card'
import { Form } from '@douyinfe/semi-ui/lib/es/form'
import Toast from '@douyinfe/semi-ui/lib/es/toast'
import { ResourceForm } from '../management/ResourceForm'
import { usePanelMutation } from '../../hooks/usePanelMutation'
import {
  updatePanelProxy,
  updatePanelPort,
  updatePanelBind,
  updatePanelSSL,
} from '../../lib/settings'
import { isValidHost } from '../../lib/nodes'
import type { NodeConfig } from '../../lib/nodes'
import type { PanelSettings, PanelProxyValues, PanelSSLValues } from '../../types/settings'

export function PanelProxyForm({
  node,
  settings,
  disabled,
  onSavingChange,
  onComplete,
}: {
  node: NodeConfig
  settings: PanelSettings
  disabled: boolean
  onSavingChange: (saving: boolean) => void
  onComplete: () => void
}) {
  const mutation = usePanelMutation()
  const [type, setType] = useState(settings.proxyType || 'close')
  const [initialValues] = useState<PanelProxyValues>(() => ({
    proxyType: type,
    proxyUrl: settings.proxyUrl.replace(/^https?:\/\//, ''),
    proxyPort: Number(settings.proxyPort) || 7890,
    proxyUser: settings.proxyUser,
    proxyPasswd: settings.proxyPasswd,
    proxyPasswdKeep: settings.proxyPasswdKeep === 'Enable',
    proxyDocker: settings.proxyDocker === 'Enable',
    withDockerRestart: false,
  }))
  useEffect(() => {
    onSavingChange(mutation.busy)
    return () => onSavingChange(false)
  }, [mutation.busy, onSavingChange])
  return (
    <Card title="代理服务器">
      <Form<PanelProxyValues>
        className="max-w-200"
        disabled={disabled || mutation.busy}
        autoComplete="off"
        allowEmpty
        initValues={initialValues}
        onSubmit={(values) =>
          void mutation
            .run((signal) => updatePanelProxy(node, { ...initialValues, ...values }, signal))
            .then((success) => {
              if (success) {
                Toast.success('代理设置已保存')
                onComplete()
              }
            })
        }
      >
        <Form.Select
          field="proxyType"
          label="代理协议"
          style={{ width: '100%' }}
          onChange={(value) => setType(String(value))}
          optionList={[
            { label: '不使用代理', value: 'close' },
            { label: 'HTTP', value: 'http' },
            { label: 'HTTPS', value: 'https' },
            { label: 'SOCKS5', value: 'socks5' },
          ]}
        />
        {type !== 'close' && (
          <>
            <Form.Input
              field="proxyUrl"
              label="代理地址"
              validator={(value: string) =>
                isValidHost(value) ? '' : '请输入 IP 或域名，不包含协议、端口或路径'
              }
            />
            <Form.InputNumber
              field="proxyPort"
              label="代理端口"
              min={1}
              max={65535}
              precision={0}
              style={{ width: '100%' }}
              rules={[{ required: true, message: '请输入端口' }]}
            />
            <Form.Input field="proxyUser" label="用户名" />
            <Form.Input field="proxyPasswd" label="密码" mode="password" />
            <Form.Checkbox field="proxyPasswdKeep" noLabel>
              记住代理密码
            </Form.Checkbox>
            <Form.Checkbox field="proxyDocker" noLabel>
              为 Docker 使用代理（需要专业版支持）
            </Form.Checkbox>
            <Form.Checkbox field="withDockerRestart" noLabel>
              重启 Docker 以应用代理（运行中的容器可能中断）
            </Form.Checkbox>
          </>
        )}
        <Button
          className="mt-4"
          htmlType="submit"
          theme="solid"
          loading={mutation.busy}
          disabled={disabled}
        >
          保存代理设置
        </Button>
        {mutation.error && (
          <Banner className="mt-4" type="danger" closeIcon={null} description={mutation.error} />
        )}
      </Form>
    </Card>
  )
}

export function PanelConnectionForm({
  node,
  settings,
  disabled,
  onEdit,
  editDisabled,
  onComplete,
}: {
  node: NodeConfig
  settings: PanelSettings
  disabled: boolean
  onEdit: () => void
  editDisabled: boolean
  onComplete: () => void
}) {
  const [editor, setEditor] = useState<'port' | 'bind' | 'ssl' | null>(null)
  const complete = () => {
    setEditor(null)
    onComplete()
  }
  return (
    <>
      <Card title="连接设置">
        <Form className="max-w-200" labelPosition="top">
          {[
            { key: 'port' as const, label: '面板端口', value: String(settings.serverPort) },
            {
              key: 'bind' as const,
              label: '监听地址',
              value: `${settings.bindAddress || '全部地址'}${settings.ipv6 === 'Enable' ? ' · IPv6 已启用' : ''}`,
            },
            {
              key: 'ssl' as const,
              label: '面板 HTTPS',
              value:
                settings.ssl === 'Disable'
                  ? '未启用'
                  : settings.ssl === 'Mux'
                    ? 'HTTP / HTTPS 双协议'
                    : '已启用',
            },
          ].map((item) => (
            <Form.Slot key={item.key} label={item.label}>
              <div className="flex flex-wrap items-center justify-between gap-2 rounded bg-(--semi-color-fill-0) px-3 py-2 text-sm">
                <span className="min-w-0 wrap-anywhere">{item.value}</span>
                <Button size="small" disabled={disabled} onClick={() => setEditor(item.key)}>
                  设置
                </Button>
              </div>
            </Form.Slot>
          ))}
          <Button disabled={editDisabled} onClick={onEdit}>
            同步客户端节点连接
          </Button>
        </Form>
      </Card>
      {editor === 'port' && (
        <ResourceForm<{ serverPort: number }>
          title="面板端口"
          initialValues={{ serverPort: settings.serverPort }}
          onClose={() => setEditor(null)}
          onComplete={complete}
          onSubmit={async (values, signal) => {
            await updatePanelPort(node, values.serverPort, signal)
            Toast.info('端口已变更，请同步客户端节点连接')
          }}
        >
          <Form.InputNumber
            field="serverPort"
            label="面板端口"
            min={1}
            max={65535}
            precision={0}
            style={{ width: '100%' }}
            rules={[{ required: true, message: '请输入端口' }]}
          />
          <Banner
            type="warning"
            closeIcon={null}
            description="保存后需使用新端口访问，请确保防火墙已放行该端口。"
          />
        </ResourceForm>
      )}
      {editor === 'bind' && (
        <ResourceForm<{ bindAddress: string; ipv6: string }>
          title="监听地址"
          initialValues={{ bindAddress: settings.bindAddress || '0.0.0.0', ipv6: settings.ipv6 }}
          onClose={() => setEditor(null)}
          onComplete={complete}
          onSubmit={(values, signal) => updatePanelBind(node, values, signal)}
        >
          <Form.Input
            field="bindAddress"
            label="监听 IP"
            validator={(value: string) =>
              z.union([z.ipv4(), z.ipv6()]).safeParse(value).success
                ? ''
                : '请输入有效的 IPv4 或 IPv6 地址'
            }
          />
          <Form.Select
            field="ipv6"
            label="IPv6"
            style={{ width: '100%' }}
            optionList={[
              { label: '启用', value: 'Enable' },
              { label: '停用', value: 'Disable' },
            ]}
          />
          <Banner
            type="warning"
            closeIcon={null}
            description="监听地址必须是节点上的可用 IP，变更后可能需要同步客户端节点连接。"
          />
        </ResourceForm>
      )}
      {editor === 'ssl' && (
        <ResourceForm<PanelSSLValues>
          title="面板 HTTPS"
          initialValues={{
            ssl: settings.ssl,
            sslType: 'import-paste',
            domain: node.host,
            cert: '',
            key: '',
          }}
          onClose={() => setEditor(null)}
          onComplete={complete}
          onSubmit={async (values, signal) => {
            await updatePanelSSL(node, values, signal)
            Toast.info('HTTPS 设置已提交，请确认客户端节点连接协议')
          }}
        >
          <Form.Select
            field="ssl"
            label="访问协议"
            style={{ width: '100%' }}
            optionList={[
              { label: 'HTTP', value: 'Disable' },
              { label: 'HTTPS', value: 'Enable' },
              { label: 'HTTP / HTTPS 双协议', value: 'Mux' },
            ]}
          />
          <Form.Select
            field="sslType"
            label="证书来源"
            style={{ width: '100%' }}
            optionList={[
              { label: '导入 PEM 证书', value: 'import-paste' },
              { label: '自动生成自签名证书', value: 'self' },
            ]}
          />
          <Form.Input field="domain" label="证书域名或 IP" />
          <Form.TextArea
            field="cert"
            label="证书内容（导入时填写）"
            autosize={{ minRows: 4, maxRows: 8 }}
          />
          <Form.TextArea
            field="key"
            label="私钥内容（导入时填写）"
            autosize={{ minRows: 4, maxRows: 8 }}
          />
          <Banner
            type="warning"
            closeIcon={null}
            description="保存后需同步客户端访问协议；自签名证书需要在系统中建立信任。"
          />
        </ResourceForm>
      )}
    </>
  )
}
