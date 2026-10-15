import { useCallback, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import Banner from '@douyinfe/semi-ui/lib/es/banner'
import Button from '@douyinfe/semi-ui/lib/es/button'
import Card from '@douyinfe/semi-ui/lib/es/card'
import { Form } from '@douyinfe/semi-ui/lib/es/form'
import Modal from '@douyinfe/semi-ui/lib/es/modal'
import Tag from '@douyinfe/semi-ui/lib/es/tag'
import Toast from '@douyinfe/semi-ui/lib/es/toast'
import { IconPlus } from '@douyinfe/semi-icons'
import { ResourceToolbar, ResourceState, ResourcePagination } from '../management/ResourceLayout'
import type { ModulePageProps } from '../management/ResourceLayout'
import { ResourceForm } from '../management/ResourceForm'
import { OperationModal } from '../management/OperationModal'
import type { ResourceOperation } from '../management/OperationModal'
import { usePanelQuery } from '../../hooks/usePanelQuery'
import { useResourceSearch } from '../../hooks/useResourceSearch'
import {
  searchPanelAPIKeys,
  savePanelAPIKey,
  changePanelAPIKey,
  validateIPEntries,
} from '../../lib/settingsResources'
import type { NodeConfig } from '../../lib/nodes'
import type { APIKeyValues, PanelAPIKey, CreatedAPIKey } from '../../types/settingsResources'
import { formatTimestamp } from '../../utils/formatter'

function localDateTime(value: string | null) {
  if (!value) return ''
  const date = new Date(value)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}
function APIKeyEditor({
  node,
  item,
  onClose,
  onComplete,
}: {
  node: NodeConfig
  item?: PanelAPIKey
  onClose: () => void
  onComplete: (created: CreatedAPIKey | null) => void
}) {
  const [requestID] = useState(() => crypto.randomUUID())
  const created = useRef<CreatedAPIKey | null>(null)
  const [initialValues] = useState<APIKeyValues>(() => ({
    name: item?.name ?? '',
    description: item?.description ?? '',
    ipWhiteList: item?.ipWhiteList ?? '',
    apiTrustedProxies: item?.apiTrustedProxies ?? '',
    apiKeyValidityTime: item?.apiKeyValidityTime ?? 120,
    expiresAt: localDateTime(
      item ? item.expiresAt : new Date(Date.now() + 90 * 86400000).toISOString(),
    ),
    allowAppBinding: item?.allowAppBinding ?? false,
  }))
  return (
    <ResourceForm<APIKeyValues>
      title={item ? '编辑 API Key' : '创建 API Key'}
      initialValues={initialValues}
      onClose={onClose}
      onComplete={() => onComplete(created.current)}
      onSubmit={async (values, signal) => {
        created.current = await savePanelAPIKey(node, values, requestID, item, signal)
      }}
    >
      <Form.Input
        field="name"
        label="名称"
        maxLength={128}
        rules={[{ required: true, whitespace: true, message: '请输入名称' }]}
      />
      <Form.TextArea field="description" label="备注" maxLength={512} />
      <Form.TextArea
        field="ipWhiteList"
        label="IP 白名单"
        autosize={{ minRows: 3, maxRows: 6 }}
        extraText="每行一个 IP 或 CIDR 网段。允许所有地址时填写 0.0.0.0/0 和 ::/0。"
        validator={(value: string) => validateIPEntries(value || '', true)}
      />
      <Form.TextArea
        field="apiTrustedProxies"
        label="可信代理"
        extraText="每行一个受信任代理的 IP 或 CIDR 网段，可留空。"
        validator={(value: string) => validateIPEntries(value || '')}
      />
      <Form.InputNumber
        field="apiKeyValidityTime"
        label="签名有效窗口"
        suffix="秒"
        min={0}
        precision={0}
        style={{ width: '100%' }}
        rules={[{ required: true, message: '请输入签名有效窗口' }]}
      />
      {item?.kind !== 'legacy' && (
        <Form.Input
          field="expiresAt"
          label="到期时间"
          type="datetime-local"
          extraText="留空表示永不过期。"
          validator={(value: string) =>
            !value || new Date(value).getTime() > Date.now() ? '' : '请选择未来的时间'
          }
        />
      )}
      <Form.Checkbox field="allowAppBinding" noLabel>
        允许应用绑定此 API Key
      </Form.Checkbox>
    </ResourceForm>
  )
}

export function APIKeysPanel({
  navigation,
  ...props
}: ModulePageProps & { navigation: ReactNode }) {
  const { node } = props
  const [editor, setEditor] = useState<{ item?: PanelAPIKey } | null>(null)
  const [created, setCreated] = useState<CreatedAPIKey | null>(null)
  const [operation, setOperation] = useState<ResourceOperation | null>(null)
  const filter = useResourceSearch('api-keys')
  const load = useCallback(
    (signal: AbortSignal) => searchPanelAPIKeys(node, filter.search, signal),
    [node, filter.search],
  )
  const query = usePanelQuery(JSON.stringify([node, filter.search]), load, {
    enabled: Boolean(node.apiKey),
  })
  const disabled = query.loading || Boolean(query.error)
  const statusLabels: Record<string, string> = {
    Enable: '启用',
    Disable: '停用',
    Revoked: '已撤销',
    Expired: '已过期',
  }
  return (
    <>
      <ResourceToolbar
        loading={query.loading}
        onRefresh={query.refresh}
        actions={
          <Button
            theme="solid"
            icon={<IconPlus />}
            disabled={!node.apiKey || disabled}
            onClick={() => setEditor({})}
          >
            创建 API Key
          </Button>
        }
      >
        {navigation}
      </ResourceToolbar>
      <ResourceState
        {...props}
        loading={query.loading}
        error={query.error}
        hasData={Boolean(query.data)}
        empty={!query.data?.items.length}
        onRetry={query.refresh}
        emptyTitle="暂无 API Key"
        emptyDescription="创建独立的 API Key，为不同客户端设置白名单和有效期。"
      >
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="API Key 列表">
          {query.data?.items.map((item) => {
            const expired = Boolean(item.expiresAt && Date.parse(item.expiresAt) <= Date.now())
            const status = item.status !== 'Revoked' && expired ? 'Expired' : item.status
            const current = item.id === node.apiKeyId || (!node.apiKeyId && item.kind === 'legacy')
            return (
              <Card key={item.id} style={{ minWidth: 0 }}>
                <article className="flex h-full flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="m-0 min-w-0 wrap-anywhere text-base font-semibold">
                      {item.name}
                    </h2>
                    <Tag color={status === 'Enable' ? 'green' : 'grey'}>
                      {statusLabels[status] ?? status}
                    </Tag>
                  </div>
                  <div className="space-y-2 text-xs text-(--semi-color-text-2)">
                    <p className="m-0 wrap-anywhere font-mono">{item.keyHint}</p>
                    <p className="m-0 wrap-anywhere">Key ID：{item.id}</p>
                    <p className="m-0">
                      到期：{item.expiresAt ? formatTimestamp(item.expiresAt, true) : '永不过期'}
                    </p>
                    <p className="m-0 wrap-anywhere whitespace-pre-wrap">
                      白名单：{item.ipWhiteList || '未配置'}
                    </p>
                    {item.description && <p className="m-0 wrap-anywhere">{item.description}</p>}
                    {current && <Tag color="blue">当前连接使用</Tag>}
                  </div>
                  <div className="mt-auto flex flex-wrap gap-2">
                    <Button
                      disabled={disabled || status === 'Revoked'}
                      onClick={() => setEditor({ item })}
                    >
                      编辑
                    </Button>
                    <Button
                      disabled={disabled || ['Revoked', 'Expired'].includes(status)}
                      onClick={() =>
                        setOperation({
                          title: item.status === 'Enable' ? '停用 API Key' : '启用 API Key',
                          description: current
                            ? '此密钥用于当前客户端连接，停用后将无法继续访问节点。'
                            : `更新「${item.name}」的可用状态。`,
                          danger: item.status === 'Enable',
                          confirmName: current ? node.name : undefined,
                          action: (signal) =>
                            changePanelAPIKey(
                              node,
                              item,
                              item.status === 'Enable' ? 'Disable' : 'Enable',
                              signal,
                            ),
                        })
                      }
                    >
                      {item.status === 'Enable' ? '停用' : '启用'}
                    </Button>
                    <Button
                      type="danger"
                      theme="borderless"
                      disabled={disabled || status === 'Revoked'}
                      onClick={() =>
                        setOperation({
                          title: '撤销 API Key',
                          description: `永久撤销「${item.name}」，使用此密钥的客户端将失去访问权限。`,
                          danger: true,
                          confirmName: node.name,
                          action: (signal) => changePanelAPIKey(node, item, 'revoke', signal),
                        })
                      }
                    >
                      撤销
                    </Button>
                  </div>
                </article>
              </Card>
            )
          })}
        </section>
      </ResourceState>
      {query.data && (
        <ResourcePagination
          total={query.data.total}
          search={filter.search}
          loading={disabled}
          receivedAt={query.receivedAt}
          onPageChange={filter.changePage}
          onPageSizeChange={filter.changePageSize}
        />
      )}
      {editor && (
        <APIKeyEditor
          node={node}
          item={editor.item}
          onClose={() => setEditor(null)}
          onComplete={(result) => {
            setEditor(null)
            setCreated(result)
            query.refresh()
          }}
        />
      )}
      {created && (
        <Modal
          visible
          title="API Key 已创建"
          width="min(620px, calc(100vw - 32px))"
          onCancel={() => setCreated(null)}
          footer={
            <Button theme="solid" onClick={() => setCreated(null)}>
              已保存密钥
            </Button>
          }
        >
          <Banner type="warning" closeIcon={null} description="完整密钥只展示一次，请妥善保存。" />
          <dl className="my-5 space-y-4 text-sm">
            <div>
              <dt className="mb-2">Key ID</dt>
              <dd className="m-0 select-all wrap-anywhere font-mono">{created.item.id}</dd>
            </div>
            <div>
              <dt className="mb-2">API Key</dt>
              <dd className="m-0 select-all rounded bg-(--semi-color-fill-0) p-3 wrap-anywhere font-mono">
                {created.apiKey}
              </dd>
            </div>
          </dl>
          <Button
            onClick={() =>
              void navigator.clipboard
                .writeText(created.apiKey)
                .then(() => Toast.success('密钥已复制'))
                .catch(() => Toast.error('复制失败，请手动复制密钥'))
            }
          >
            复制密钥
          </Button>
        </Modal>
      )}
      {operation && (
        <OperationModal
          operation={operation}
          onClose={() => setOperation(null)}
          onComplete={() => {
            setOperation(null)
            query.refresh()
          }}
        />
      )}
    </>
  )
}
