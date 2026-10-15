import { useCallback, useState } from 'react'
import type { ReactNode } from 'react'
import Button from '@douyinfe/semi-ui/lib/es/button'
import Card from '@douyinfe/semi-ui/lib/es/card'
import { Form } from '@douyinfe/semi-ui/lib/es/form'
import Tag from '@douyinfe/semi-ui/lib/es/tag'
import Select from '@douyinfe/semi-ui/lib/es/select'
import { IconPlus } from '@douyinfe/semi-icons'
import { ResourceToolbar, ResourceState, ResourcePagination } from '../management/ResourceLayout'
import type { ModulePageProps } from '../management/ResourceLayout'
import { ResourceForm } from '../management/ResourceForm'
import { OperationModal } from '../management/OperationModal'
import type { ResourceOperation } from '../management/OperationModal'
import { usePanelQuery } from '../../hooks/usePanelQuery'
import { useResourceSearch } from '../../hooks/useResourceSearch'
import {
  searchBackupAccounts,
  backupInitialValues,
  saveBackupAccount,
  deleteBackupAccount,
} from '../../lib/settingsResources'
import { backupProviders } from '../../types/settingsResources'
import type { BackupAccount, BackupAccountValues } from '../../types/settingsResources'
import type { NodeConfig } from '../../lib/nodes'

function BackupAccountEditor({
  node,
  item,
  onClose,
  onComplete,
}: {
  node: NodeConfig
  item?: BackupAccount
  onClose: () => void
  onComplete: () => void
}) {
  const [initialValues] = useState(() => backupInitialValues(item))
  const [type, setType] = useState(initialValues.type)
  const [authMode, setAuthMode] = useState(initialValues.authMode)
  const objectStorage = ['OSS', 'COS', 'S3', 'MINIO', 'KODO'].includes(type)
  const password = ['SFTP', 'WebDAV', 'UPYUN'].includes(type)
  const oauth = ['OneDrive', 'GoogleDrive'].includes(type)
  const required = [{ required: true, whitespace: true, message: '请填写此项' }]
  return (
    <ResourceForm<BackupAccountValues>
      title={item ? '编辑备份账号' : '添加备份账号'}
      initialValues={initialValues}
      onClose={onClose}
      onComplete={onComplete}
      onSubmit={(values, signal) =>
        saveBackupAccount(node, { ...initialValues, ...values }, item, signal)
      }
    >
      <Form.Input
        field="name"
        label="名称"
        disabled={Boolean(item)}
        maxLength={128}
        rules={required}
      />
      <Form.Select
        field="type"
        label="存储类型"
        disabled={Boolean(item)}
        style={{ width: '100%' }}
        optionList={backupProviders.filter(
          (provider) => provider.value !== 'LOCAL' || item?.type === 'LOCAL',
        )}
        onChange={(value) => setType(String(value))}
      />
      {type !== 'LOCAL' && (
        <Form.Checkbox field="isPublic" noLabel disabled={Boolean(item)}>
          公共账号（需要专业版支持）
        </Form.Checkbox>
      )}
      {(objectStorage || password) && (
        <>
          <Form.Input
            field="accessKey"
            label={password ? (type === 'UPYUN' ? '操作员' : '用户名') : 'Access Key ID'}
            rules={required}
          />
          {type === 'SFTP' && (
            <Form.Select
              field="authMode"
              label="认证方式"
              style={{ width: '100%' }}
              onChange={(value) => setAuthMode(String(value))}
              optionList={[
                { label: '密码', value: 'password' },
                { label: '私钥', value: 'key' },
              ]}
            />
          )}
          {type === 'SFTP' && authMode === 'key' ? (
            <>
              <Form.TextArea
                field="credential"
                label="私钥"
                autosize={{ minRows: 4, maxRows: 8 }}
                rules={required}
              />
              <Form.Input field="passPhrase" label="私钥密码" mode="password" />
            </>
          ) : (
            <Form.Input
              field="credential"
              label={objectStorage ? 'Secret Key' : '密码'}
              mode="password"
              rules={required}
            />
          )}
          <Form.Checkbox field="rememberAuth" noLabel>
            记住凭据，编辑时自动回填
          </Form.Checkbox>
        </>
      )}
      {objectStorage && (
        <>
          <Form.Input
            field="endpoint"
            label={type === 'KODO' ? '下载域名' : '服务端点'}
            placeholder="https://…"
            rules={[{ required: true, type: 'url', message: '请输入完整的服务地址' }]}
          />
          <Form.Input field="bucket" label="存储桶" rules={required} />
          {['S3', 'COS'].includes(type) && (
            <Form.Input field="region" label="区域" rules={required} />
          )}
          {type === 'S3' && (
            <Form.Select
              field="mode"
              label="访问方式"
              style={{ width: '100%' }}
              optionList={[
                { label: 'Virtual Hosted', value: 'virtual hosted' },
                { label: 'Path', value: 'path' },
              ]}
            />
          )}
          {['S3', 'COS', 'OSS'].includes(type) && (
            <Form.Input
              field="scType"
              label="存储类型"
              extraText={type === 'S3' ? '默认 STANDARD。' : '默认 Standard。'}
            />
          )}
          {type === 'KODO' && (
            <Form.InputNumber
              field="timeout"
              label="请求有效期"
              min={1}
              precision={0}
              suffix="小时"
              style={{ width: '100%' }}
            />
          )}
        </>
      )}
      {password && type !== 'UPYUN' && (
        <Form.Input
          field="address"
          label={type === 'WebDAV' ? 'WebDAV 地址' : '主机地址'}
          rules={required}
        />
      )}
      {type === 'SFTP' && (
        <Form.InputNumber
          field="port"
          label="端口"
          min={1}
          max={65535}
          precision={0}
          style={{ width: '100%' }}
          rules={[{ required: true, message: '请输入端口' }]}
        />
      )}
      {type === 'UPYUN' && <Form.Input field="bucket" label="服务名称" rules={required} />}
      {oauth && (
        <>
          <Form.Input field="client_id" label="Client ID" rules={required} />
          <Form.Input
            field="client_secret"
            label="Client Secret"
            mode="password"
            rules={required}
          />
          <Form.Input
            field="redirect_uri"
            label="重定向地址"
            rules={[{ required: true, type: 'url', message: '请输入完整的重定向地址' }]}
          />
          <Form.Input
            field="code"
            label="授权码"
            extraText="首次绑定时，填写在对应云平台完成授权后取得的授权码。"
          />
          <Form.Input
            field="refresh_token"
            label="Refresh Token"
            mode="password"
            extraText="已有授权时可直接填写刷新令牌。"
          />
        </>
      )}
      {type === 'ALIYUN' && (
        <>
          <Form.Input field="drive_id" label="Drive ID" rules={required} />
          <Form.Input
            field="refresh_token"
            label="Refresh Token"
            mode="password"
            rules={required}
          />
        </>
      )}
      <Form.Input
        field="backupPath"
        label="备份目录"
        extraText={
          ['LOCAL', 'SFTP'].includes(type)
            ? '节点或 SFTP 服务器上的绝对路径。'
            : '存储空间中的目录前缀，可留空。'
        }
        validator={(value: string) =>
          !['LOCAL', 'SFTP'].includes(type) || value?.startsWith('/') ? '' : '请输入绝对路径'
        }
      />
    </ResourceForm>
  )
}

export function BackupAccountsPanel({
  navigation,
  ...props
}: ModulePageProps & { navigation: ReactNode }) {
  const { node } = props
  const [editor, setEditor] = useState<{ item?: BackupAccount } | null>(null)
  const [operation, setOperation] = useState<ResourceOperation | null>(null)
  const filter = useResourceSearch('backup-accounts')
  const load = useCallback(
    (signal: AbortSignal) => searchBackupAccounts(node, filter.search, signal),
    [node, filter.search],
  )
  const query = usePanelQuery(JSON.stringify([node, filter.search]), load, {
    enabled: Boolean(node.apiKey),
  })
  const disabled = query.loading || filter.pending || Boolean(query.error)
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
            添加备份账号
          </Button>
        }
      >
        {navigation}
        <Select
          aria-label="筛选存储类型"
          value={filter.query}
          onChange={(value) => filter.setQuery(String(value))}
          className="w-full sm:w-52"
          optionList={[{ label: '全部存储类型', value: '' }, ...backupProviders]}
        />
      </ResourceToolbar>
      <ResourceState
        {...props}
        loading={query.loading}
        error={query.error}
        hasData={Boolean(query.data)}
        empty={!query.data?.items.length}
        filtered={Boolean(filter.query)}
        onRetry={query.refresh}
        emptyTitle="暂无备份账号"
        emptyDescription="添加存储账号，用于网站、数据库、计划任务和快照备份。"
      >
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="备份账号列表">
          {query.data?.items.map((item) => (
            <Card key={item.id} style={{ minWidth: 0 }}>
              <article className="flex h-full flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="m-0 min-w-0 wrap-anywhere text-base font-semibold">
                    {item.name === 'localhost' ? '本地磁盘' : item.name}
                  </h2>
                  <Tag color="blue">
                    {backupProviders.find((provider) => provider.value === item.type)?.label ??
                      item.type}
                  </Tag>
                </div>
                <div className="space-y-2 text-xs text-(--semi-color-text-2)">
                  <p className="m-0">{item.isPublic ? '公共账号' : '当前节点'}</p>
                  {item.bucket && <p className="m-0 wrap-anywhere">存储桶：{item.bucket}</p>}
                  <p className="m-0 wrap-anywhere">目录：{item.backupPath || '根目录'}</p>
                </div>
                <div className="mt-auto flex flex-wrap gap-2">
                  <Button disabled={disabled} onClick={() => setEditor({ item })}>
                    编辑
                  </Button>
                  <Button
                    disabled={disabled || item.type === 'LOCAL'}
                    type="danger"
                    theme="borderless"
                    onClick={() =>
                      setOperation({
                        title: '删除备份账号',
                        description: `删除「${item.name}」的连接配置，已保存的备份文件会保留。关联的计划任务需要改用其他账号。`,
                        danger: true,
                        action: (signal) => deleteBackupAccount(node, item, signal),
                      })
                    }
                  >
                    删除
                  </Button>
                </div>
              </article>
            </Card>
          ))}
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
        <BackupAccountEditor
          node={node}
          item={editor.item}
          onClose={() => setEditor(null)}
          onComplete={() => {
            setEditor(null)
            query.refresh()
          }}
        />
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
