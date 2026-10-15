import { useCallback, useState } from 'react'
import type { ReactNode } from 'react'
import Banner from '@douyinfe/semi-ui/lib/es/banner'
import Button from '@douyinfe/semi-ui/lib/es/button'
import Card from '@douyinfe/semi-ui/lib/es/card'
import { Form } from '@douyinfe/semi-ui/lib/es/form'
import Toast from '@douyinfe/semi-ui/lib/es/toast'
import { IconPlus } from '@douyinfe/semi-icons'
import {
  ResourceToolbar,
  ResourceSearchInput,
  ResourceState,
  ResourcePagination,
} from '../management/ResourceLayout'
import type { ModulePageProps } from '../management/ResourceLayout'
import { ResourceForm } from '../management/ResourceForm'
import { OperationModal } from '../management/OperationModal'
import type { ResourceOperation } from '../management/OperationModal'
import { StatusTag } from '../management/StatusTag'
import { usePanelQuery } from '../../hooks/usePanelQuery'
import { useResourceSearch } from '../../hooks/useResourceSearch'
import {
  searchSnapshots,
  fetchSnapshotData,
  fetchSnapshotHostInfo,
  fetchBackupOptions,
  fetchSnapshotFiles,
  createSnapshot,
  operateSnapshot,
} from '../../lib/settingsResources'
import type {
  Snapshot,
  SnapshotCreateValues,
  SnapshotData,
  BackupOption,
} from '../../types/settingsResources'
import type { NodeConfig } from '../../lib/nodes'
import { formatBytes, formatTimestamp } from '../../utils/formatter'

function SnapshotCreateForm({
  node,
  data,
  accounts,
  onClose,
  onComplete,
}: {
  node: NodeConfig
  data: SnapshotData
  accounts: BackupOption[]
  onClose: () => void
  onComplete: () => void
}) {
  const [taskID] = useState(() => crypto.randomUUID())
  const options = accounts
    .filter((item) => item.id !== 0)
    .map((item) => ({
      label: item.type === 'LOCAL' ? '本地磁盘' : `${item.name} · ${item.type}`,
      value: item.id,
    }))
  const [selected, setSelected] = useState(options.length ? [options[0].value] : [])
  const initialValues: SnapshotCreateValues = {
    ...data,
    accounts: selected,
    downloadAccountID: selected[0] ?? 0,
    description: '',
    secret: '',
    timeout: 3600,
    withApps: true,
    withPanel: true,
    withBackups: false,
    ignoreFiles: data.ignoreFiles.join('\n'),
  }
  return (
    <ResourceForm<SnapshotCreateValues>
      title="创建快照"
      initialValues={initialValues}
      disabled={!options.length}
      onClose={onClose}
      onComplete={onComplete}
      onSubmit={async (values, signal) => {
        await createSnapshot(node, values, data, taskID, signal)
        Toast.info('快照任务已提交，可在列表查看执行状态')
      }}
    >
      {!options.length && <Banner type="info" closeIcon={null} description="请先添加备份账号。" />}
      <Form.Select
        field="accounts"
        label="备份账号"
        multiple
        style={{ width: '100%' }}
        optionList={options}
        onChange={(value) => setSelected(Array.isArray(value) ? (value as number[]) : [])}
        rules={[{ required: true, type: 'array', min: 1, message: '请选择至少一个备份账号' }]}
      />
      <Form.Select
        field="downloadAccountID"
        label="默认下载账号"
        style={{ width: '100%' }}
        optionList={options.filter((item) => selected.includes(item.value))}
        rules={[{ required: true, message: '请选择默认下载账号' }]}
      />
      <Form.Input
        field="secret"
        label="压缩密码"
        mode="password"
        extraText="恢复加密快照时需要此密码，请妥善保管。"
      />
      <Form.InputNumber
        field="timeout"
        label="执行超时"
        min={1}
        precision={0}
        suffix="秒"
        style={{ width: '100%' }}
        rules={[{ required: true, message: '请输入超时时间' }]}
      />
      <Form.TextArea field="description" label="描述" maxLength={256} />
      <Form.Checkbox field="withApps" noLabel>
        应用数据（包含应用文件及镜像）
      </Form.Checkbox>
      <Form.Checkbox field="withPanel" noLabel>
        面板数据
      </Form.Checkbox>
      <Form.Checkbox field="withBackups" noLabel>
        已有备份文件
      </Form.Checkbox>
      <Form.Checkbox field="withDockerConf" noLabel>
        Docker 配置
      </Form.Checkbox>
      <Form.Checkbox field="withMonitorData" noLabel>
        监控数据
      </Form.Checkbox>
      <Form.Checkbox field="withLoginLog" noLabel>
        登录日志
      </Form.Checkbox>
      <Form.Checkbox field="withOperationLog" noLabel>
        操作日志
      </Form.Checkbox>
      <Form.Checkbox field="withSystemLog" noLabel>
        系统日志
      </Form.Checkbox>
      <Form.Checkbox field="withTaskLog" noLabel>
        任务日志
      </Form.Checkbox>
      <Form.TextArea
        field="ignoreFiles"
        label="排除规则"
        autosize={{ minRows: 3, maxRows: 6 }}
        extraText="每行一个相对于 1Panel 数据目录的路径或匹配规则。"
      />
    </ResourceForm>
  )
}

function SnapshotImporter({
  node,
  accounts,
  onClose,
  onComplete,
}: {
  node: NodeConfig
  accounts: BackupOption[]
  onClose: () => void
  onComplete: () => void
}) {
  const [accountID, setAccountID] = useState(accounts[0]?.id ?? 0)
  const load = useCallback(
    (signal: AbortSignal) => fetchSnapshotFiles(node, accountID, signal),
    [node, accountID],
  )
  const files = usePanelQuery(JSON.stringify([node, accountID]), load, {
    enabled: Boolean(accountID),
  })
  return (
    <ResourceForm<{ backupAccountID: number; names: string[]; description: string }>
      key={accountID}
      title="导入快照"
      initialValues={{ backupAccountID: accountID, names: [], description: '' }}
      disabled={!accountID || files.loading || Boolean(files.error)}
      onClose={onClose}
      onComplete={onComplete}
      onSubmit={(values, signal) => operateSnapshot(node, 'import', values, signal)}
    >
      <Form.Select
        field="backupAccountID"
        label="备份账号"
        style={{ width: '100%' }}
        optionList={accounts.map((item) => ({
          label: item.type === 'LOCAL' ? '本地磁盘' : item.name,
          value: item.id,
        }))}
        onChange={(value) => setAccountID(Number(value))}
        rules={[{ required: true, message: '请选择备份账号' }]}
      />
      <Form.Select
        field="names"
        label="快照文件"
        multiple
        filter
        loading={files.loading}
        style={{ width: '100%' }}
        optionList={(files.data ?? []).map((name) => ({ label: name, value: name }))}
        rules={[{ required: true, type: 'array', min: 1, message: '请选择快照文件' }]}
      />
      <Form.TextArea field="description" label="描述" maxLength={256} />
      {files.error && (
        <Banner
          type="danger"
          closeIcon={null}
          description={
            <>
              {files.error}
              <Button theme="borderless" onClick={files.refresh}>
                重试
              </Button>
            </>
          }
        />
      )}
    </ResourceForm>
  )
}

function SnapshotActionForm({
  node,
  item,
  action,
  onClose,
  onComplete,
}: {
  node: NodeConfig
  item: Snapshot
  action: 'recover' | 'rollback' | 'del'
  onClose: () => void
  onComplete: () => void
}) {
  const [taskID] = useState(() => crypto.randomUUID())
  const loadHost = useCallback((signal: AbortSignal) => fetchSnapshotHostInfo(node, signal), [node])
  const host = usePanelQuery(JSON.stringify(node), loadHost, { enabled: action === 'recover' })
  const insufficientSpace = Boolean(
    host.data && item.size > 0 && host.data.diskSize > 0 && item.size * 2 >= host.data.diskSize,
  )
  const incompatibleArch = Boolean(
    host.data?.kernelArch && !item.name.includes(host.data.kernelArch),
  )
  const title = action === 'del' ? '删除快照' : action === 'rollback' ? '回滚恢复操作' : '恢复快照'
  return (
    <ResourceForm<{
      secret: string
      reDownload: boolean
      isNew: boolean
      deleteWithFile: boolean
      confirmation: string
    }>
      title={title}
      disabled={
        action === 'recover' &&
        (host.loading || Boolean(host.error) || insufficientSpace || incompatibleArch)
      }
      initialValues={{
        secret: '',
        reDownload: false,
        isNew: item.recoverStatus !== 'Failed',
        deleteWithFile: false,
        confirmation: '',
      }}
      onClose={onClose}
      onComplete={onComplete}
      onSubmit={async (values, signal) => {
        if (values.confirmation !== node.name) throw new Error('节点名称不匹配')
        await operateSnapshot(
          node,
          action,
          action === 'del'
            ? { ids: [item.id], deleteWithFile: values.deleteWithFile }
            : {
                id: item.id,
                taskID,
                secret: action === 'rollback' ? '' : values.secret,
                isNew:
                  action === 'rollback'
                    ? false
                    : item.recoverStatus === 'Failed'
                      ? values.isNew
                      : true,
                reDownload: action === 'rollback' ? false : values.reDownload,
              },
          signal,
        )
        if (action !== 'del') Toast.info('任务已提交，可在列表查看执行状态')
      }}
    >
      <Banner
        type="warning"
        closeIcon={null}
        description={
          action === 'del'
            ? `将删除快照「${item.name}」的记录。勾选删除文件后，存储账号中的对应文件也会被删除。`
            : action === 'rollback'
              ? '将使用本次恢复前的备份回滚节点，当前服务可能中断。'
              : `将快照「${item.name}」恢复到当前节点，现有配置与数据会被覆盖，服务可能中断。请确认快照版本、架构兼容并保留独立备份。`
        }
      />
      {action === 'recover' && (
        <>
          {host.data && (
            <p className="text-sm text-(--semi-color-text-2)">
              当前架构：{host.data.kernelArch} · 可用空间：{formatBytes(host.data.diskSize)}
            </p>
          )}
          {insufficientSpace && (
            <Banner
              type="danger"
              closeIcon={null}
              description="可用空间不足，恢复快照至少需要快照大小两倍的可用空间。"
            />
          )}
          {incompatibleArch && (
            <Banner
              type="danger"
              closeIcon={null}
              description="快照名称中的架构与当前节点不匹配，请确认快照来源。"
            />
          )}
          {host.error && (
            <Banner
              type="danger"
              closeIcon={null}
              description={
                <>
                  {host.error}
                  <Button theme="borderless" onClick={host.refresh}>
                    重新检查
                  </Button>
                </>
              }
            />
          )}
        </>
      )}
      {action === 'del' ? (
        <Form.Checkbox field="deleteWithFile" noLabel>
          同时删除快照文件
        </Form.Checkbox>
      ) : (
        action === 'recover' && (
          <>
            <Form.Input field="secret" label="压缩密码" mode="password" />
            <Form.Checkbox field="reDownload" noLabel>
              重新下载快照文件
            </Form.Checkbox>
            {item.recoverStatus === 'Failed' && (
              <Form.Checkbox field="isNew" noLabel>
                重新开始恢复（取消勾选则从中断步骤继续）
              </Form.Checkbox>
            )}
          </>
        )
      )}
      <Form.Input
        field="confirmation"
        label={`输入节点名称「${node.name}」以确认`}
        validator={(value: string) => (value === node.name ? '' : '节点名称不匹配')}
      />
    </ResourceForm>
  )
}

export function SnapshotsPanel({
  navigation,
  ...props
}: ModulePageProps & { navigation: ReactNode }) {
  const { node } = props
  const [editor, setEditor] = useState<'create' | 'import' | null>(null)
  const [action, setAction] = useState<{
    item: Snapshot
    action: 'recover' | 'rollback' | 'del'
  } | null>(null)
  const [operation, setOperation] = useState<ResourceOperation | null>(null)
  const filter = useResourceSearch('snapshots')
  const load = useCallback(
    (signal: AbortSignal) => searchSnapshots(node, filter.search, signal),
    [node, filter.search],
  )
  const query = usePanelQuery(JSON.stringify([node, filter.search]), load, {
    enabled: Boolean(node.apiKey),
    interval: 10000,
  })
  const loadOptions = useCallback(
    async (signal: AbortSignal) => {
      const [accounts, data] = await Promise.all([
        fetchBackupOptions(node, signal),
        editor === 'create' ? fetchSnapshotData(node, signal) : Promise.resolve(null),
      ])
      return { accounts, data }
    },
    [node, editor],
  )
  const options = usePanelQuery(JSON.stringify([node, editor]), loadOptions, {
    enabled: Boolean(node.apiKey && editor),
  })
  const disabled = query.loading || filter.pending || Boolean(query.error)
  const complete = () => {
    setEditor(null)
    setAction(null)
    setOperation(null)
    query.refresh()
  }
  return (
    <>
      <ResourceToolbar
        loading={query.loading}
        onRefresh={query.refresh}
        actions={
          <>
            <Button disabled={!node.apiKey || disabled} onClick={() => setEditor('import')}>
              导入快照
            </Button>
            <Button
              theme="solid"
              icon={<IconPlus />}
              disabled={!node.apiKey || disabled}
              onClick={() => setEditor('create')}
            >
              创建快照
            </Button>
          </>
        }
      >
        {navigation}
        <ResourceSearchInput
          value={filter.query}
          onChange={filter.setQuery}
          placeholder="搜索快照名称"
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
        emptyTitle="暂无快照"
        emptyDescription="创建节点快照，或从备份账号中导入已有快照。"
      >
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="快照列表">
          {query.data?.items.map((item) => {
            const running = [item.status, item.recoverStatus, item.rollbackStatus].some((status) =>
              ['Waiting', 'Running'].includes(status),
            )
            return (
              <Card key={item.id} style={{ minWidth: 0 }}>
                <article className="flex h-full flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="m-0 min-w-0 wrap-anywhere text-base font-semibold">
                      {item.description || item.name}
                    </h2>
                    <StatusTag status={item.status} />
                  </div>
                  <div className="space-y-2 text-xs text-(--semi-color-text-2)">
                    <p className="m-0 wrap-anywhere">{item.name}</p>
                    <p className="m-0">
                      {formatTimestamp(item.createdAt, true)} · {formatBytes(item.size)} ·{' '}
                      {item.version}
                    </p>
                    <p className="m-0 wrap-anywhere">
                      备份账号：{item.sourceAccounts.join('、') || '—'}
                    </p>
                    <p className="m-0 wrap-anywhere">默认下载：{item.downloadAccount || '—'}</p>
                    {item.message && <p className="m-0 wrap-anywhere">{item.message}</p>}
                    {item.recoverStatus && (
                      <div className="flex flex-wrap items-center gap-2">
                        恢复 <StatusTag status={item.recoverStatus} />
                        <span className="wrap-anywhere">{item.recoverMessage}</span>
                      </div>
                    )}
                    {item.rollbackStatus && (
                      <div className="flex flex-wrap items-center gap-2">
                        回滚 <StatusTag status={item.rollbackStatus} />
                        <span className="wrap-anywhere">{item.rollbackMessage}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-auto flex flex-wrap gap-2">
                    <Button
                      disabled={disabled || running || item.status !== 'Success'}
                      onClick={() => setAction({ item, action: 'recover' })}
                    >
                      恢复
                    </Button>
                    {item.status === 'Failed' && (
                      <Button
                        disabled={disabled || running}
                        onClick={() =>
                          setOperation({
                            title: '重建快照',
                            description: `使用原配置重新创建「${item.name}」。`,
                            successMessage: '重建任务已提交',
                            action: (signal) =>
                              operateSnapshot(node, 'recreate', { id: item.id }, signal),
                          })
                        }
                      >
                        重新创建
                      </Button>
                    )}
                    {item.recoverStatus === 'Failed' && (
                      <Button
                        disabled={disabled || running}
                        onClick={() => setAction({ item, action: 'rollback' })}
                      >
                        回滚
                      </Button>
                    )}
                    <Button
                      theme="borderless"
                      type="danger"
                      disabled={disabled || running}
                      onClick={() => setAction({ item, action: 'del' })}
                    >
                      删除
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
      {editor && !options.data && (
        <Banner
          type={options.error ? 'danger' : 'info'}
          closeIcon={null}
          description={
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>{options.error || '正在读取快照配置…'}</span>
              <div>
                <Button disabled={options.loading} onClick={options.refresh}>
                  重试
                </Button>
                <Button theme="borderless" onClick={() => setEditor(null)}>
                  取消
                </Button>
              </div>
            </div>
          }
        />
      )}
      {editor === 'create' && options.data?.data && (
        <SnapshotCreateForm
          node={node}
          data={options.data.data}
          accounts={options.data.accounts}
          onClose={() => setEditor(null)}
          onComplete={complete}
        />
      )}
      {editor === 'import' && options.data && (
        <SnapshotImporter
          node={node}
          accounts={options.data.accounts.filter((item) => item.id !== 0)}
          onClose={() => setEditor(null)}
          onComplete={complete}
        />
      )}
      {action && (
        <SnapshotActionForm
          node={node}
          {...action}
          onClose={() => setAction(null)}
          onComplete={complete}
        />
      )}
      {operation && (
        <OperationModal
          operation={operation}
          onClose={() => setOperation(null)}
          onComplete={complete}
        />
      )}
    </>
  )
}
