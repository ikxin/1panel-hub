import { useCallback, useState } from 'react'
import type { ReactNode } from 'react'
import Banner from '@douyinfe/semi-ui/lib/es/banner'
import Button from '@douyinfe/semi-ui/lib/es/button'
import Card from '@douyinfe/semi-ui/lib/es/card'
import { Form } from '@douyinfe/semi-ui/lib/es/form'
import Tag from '@douyinfe/semi-ui/lib/es/tag'
import { ResourceToolbar, ResourceState, ResourcePagination } from '../management/ResourceLayout'
import type { ModulePageProps } from '../management/ResourceLayout'
import { ResourceForm } from '../management/ResourceForm'
import { OperationModal } from '../management/OperationModal'
import type { ResourceOperation } from '../management/OperationModal'
import { usePanelQuery } from '../../hooks/usePanelQuery'
import { useResourceSearch } from '../../hooks/useResourceSearch'
import {
  searchLicenses,
  fetchLicenseStatus,
  fetchLicenseNodes,
  operateLicense,
  uploadPanelLicense,
} from '../../lib/settingsResources'
import type { PanelLicense } from '../../types/settingsResources'
import type { NodeConfig } from '../../lib/nodes'

function LicenseUploadForm({
  node,
  item,
  onClose,
  onComplete,
}: {
  node: NodeConfig
  item?: PanelLicense
  onClose: () => void
  onComplete: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  return (
    <ResourceForm<{ confirmation: string }>
      title={item ? '更新许可证' : '导入许可证'}
      initialValues={{ confirmation: '' }}
      disabled={!file}
      onClose={onClose}
      onComplete={onComplete}
      onSubmit={async (_, signal) => {
        if (!file) throw new Error('请选择许可证文件')
        await uploadPanelLicense(node, file, item?.licenseName ?? '', signal)
      }}
    >
      <Form.Slot label="许可证文件">
        <input
          type="file"
          aria-label="许可证文件"
          className="block w-full rounded border border-(--semi-color-border) p-3 text-sm file:mr-3 file:cursor-pointer file:rounded file:border-0 file:bg-(--semi-color-fill-1) file:px-3 file:py-2 file:text-(--semi-color-text-0)"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
      </Form.Slot>
      {item && (
        <Banner
          type="info"
          closeIcon={null}
          description={`更新许可证「${item.licenseName}」，请确认新文件属于同一授权。`}
        />
      )}
    </ResourceForm>
  )
}

function LicenseBindForm({
  node,
  item,
  onClose,
  onComplete,
}: {
  node: NodeConfig
  item: PanelLicense
  onClose: () => void
  onComplete: () => void
}) {
  const load = useCallback(
    async (signal: AbortSignal) => {
      const status = await fetchLicenseStatus(node, signal)
      if (!status || !status.productPro || status.productPro === '0')
        return [{ id: 0, name: '主节点', addr: '', isXpack: false }]
      return fetchLicenseNodes(node, signal)
    },
    [node],
  )
  const query = usePanelQuery(JSON.stringify(node), load)
  return (
    <ResourceForm<{ nodeID?: number; syncItems: string[]; withDockerRestart: boolean }>
      title="绑定许可证"
      initialValues={{ nodeID: undefined, syncItems: [], withDockerRestart: false }}
      disabled={query.loading || Boolean(query.error) || !query.data?.length}
      onClose={onClose}
      onComplete={onComplete}
      onSubmit={async (values, signal) => {
        if (values.nodeID === undefined) throw new Error('请选择节点')
        await operateLicense(
          node,
          'bind',
          {
            licenseID: item.id,
            nodeID: values.nodeID,
            syncList: values.nodeID === 0 ? '' : values.syncItems.join(','),
            withDockerRestart: values.withDockerRestart,
          },
          signal,
        )
      }}
    >
      <Form.Select
        field="nodeID"
        label="绑定节点"
        loading={query.loading}
        style={{ width: '100%' }}
        optionList={(query.data ?? []).map((item) => ({
          value: item.id,
          label: item.addr ? `${item.name} · ${item.addr}` : item.name,
        }))}
        rules={[{ required: true, message: '请选择节点' }]}
      />
      <Form.CheckboxGroup
        field="syncItems"
        label="同步主节点配置到目标节点"
        direction="vertical"
        options={[
          { label: '系统代理', value: 'SyncSystemProxy' },
          { label: '告警设置', value: 'SyncAlertSetting' },
          { label: '自定义应用', value: 'SyncCustomApp' },
          { label: '备份账号', value: 'SyncBackupAccounts' },
        ]}
      />
      <Form.Checkbox field="withDockerRestart" noLabel>
        重启 Docker 以应用代理（运行中的容器可能中断）
      </Form.Checkbox>
      {query.error && (
        <Banner
          type="danger"
          closeIcon={null}
          description={
            <>
              {query.error}
              <Button theme="borderless" onClick={query.refresh}>
                重试
              </Button>
            </>
          }
        />
      )}
    </ResourceForm>
  )
}

function LicenseUnbindForm({
  node,
  item,
  onClose,
  onComplete,
}: {
  node: NodeConfig
  item: PanelLicense
  onClose: () => void
  onComplete: () => void
}) {
  return (
    <ResourceForm<{ force: boolean; withDockerRestart: boolean; confirmation: string }>
      title="解绑许可证"
      initialValues={{ force: false, withDockerRestart: false, confirmation: '' }}
      onClose={onClose}
      onComplete={onComplete}
      onSubmit={async (values, signal) => {
        if (values.confirmation !== item.licenseName) throw new Error('许可证名称不匹配')
        await operateLicense(
          node,
          'unbind',
          { id: item.id, force: values.force, withDockerRestart: values.withDockerRestart },
          signal,
        )
      }}
    >
      <Banner
        type="warning"
        closeIcon={null}
        description="解绑后，关联节点将失去专业版授权，相关功能可能不可用。"
      />
      <Form.Checkbox field="force" noLabel>
        强制解绑（仅在关联节点无法连接时使用）
      </Form.Checkbox>
      <Form.Checkbox field="withDockerRestart" noLabel>
        重启 Docker 以移除代理（运行中的容器可能中断）
      </Form.Checkbox>
      <Form.Input
        field="confirmation"
        label={`输入许可证名称「${item.licenseName}」以确认`}
        validator={(value: string) => (value === item.licenseName ? '' : '许可证名称不匹配')}
      />
    </ResourceForm>
  )
}

const licenseLabels: Record<string, string> = {
  Free: '未绑定',
  Enable: '已激活',
  Disable: '已停用',
  Success: '已激活',
  Expired: '已过期',
  Invalid: '无效',
}

export function LicensesPanel({
  navigation,
  ...props
}: ModulePageProps & { navigation: ReactNode }) {
  const { node } = props
  const [editor, setEditor] = useState<{
    type: 'upload' | 'bind' | 'unbind'
    item?: PanelLicense
  } | null>(null)
  const [operation, setOperation] = useState<ResourceOperation | null>(null)
  const filter = useResourceSearch('licenses')
  const load = useCallback(
    (signal: AbortSignal) => searchLicenses(node, filter.search, signal),
    [node, filter.search],
  )
  const query = usePanelQuery(JSON.stringify([node, filter.search]), load, {
    enabled: Boolean(node.apiKey),
  })
  const disabled = query.loading || Boolean(query.error)
  const complete = () => {
    setEditor(null)
    setOperation(null)
    query.refresh()
  }
  return (
    <>
      <ResourceToolbar
        loading={query.loading}
        onRefresh={query.refresh}
        actions={
          <Button
            theme="solid"
            disabled={!node.apiKey || disabled}
            onClick={() => setEditor({ type: 'upload' })}
          >
            导入许可证
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
        emptyTitle="暂无许可证"
        emptyDescription="导入许可证后，可为节点绑定专业版授权。"
      >
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="许可证列表">
          {query.data?.items.map((item) => (
            <Card key={item.id} style={{ minWidth: 0 }}>
              <article className="flex h-full flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="m-0 min-w-0 wrap-anywhere text-base font-semibold">
                    {item.licenseName}
                  </h2>
                  <Tag
                    color={
                      item.status === 'Free'
                        ? 'grey'
                        : item.status === 'Enable' || item.status === 'Success'
                          ? 'green'
                          : 'orange'
                    }
                  >
                    {licenseLabels[item.status] ?? item.status}
                  </Tag>
                </div>
                <div className="space-y-2 text-xs text-(--semi-color-text-2)">
                  <p className="m-0 wrap-anywhere">授权给：{item.assigneeName || '—'}</p>
                  <p className="m-0">
                    {item.trial ? '试用授权' : item.productPro !== '0' ? '订阅授权' : '永久授权'}
                    {item.expiresAt ? ` · ${item.expiresAt}` : ''}
                  </p>
                  {item.versionConstraint && (
                    <p className="m-0">
                      版本范围：
                      {item.versionConstraint === 'all' ? '全部版本' : item.versionConstraint}
                    </p>
                  )}
                  <p className="m-0 wrap-anywhere">绑定节点：{item.bindNode || '未绑定'}</p>
                  {item.message && <p className="m-0 wrap-anywhere">{item.message}</p>}
                </div>
                <div className="mt-auto flex flex-wrap gap-2">
                  <Button
                    disabled={disabled || item.status !== 'Free'}
                    onClick={() => setEditor({ type: 'bind', item })}
                  >
                    绑定
                  </Button>
                  <Button
                    disabled={disabled || item.status === 'Free'}
                    onClick={() => setEditor({ type: 'unbind', item })}
                  >
                    解绑
                  </Button>
                  <Button
                    disabled={disabled || item.status === 'Free'}
                    onClick={() => setEditor({ type: 'upload', item })}
                  >
                    更新
                  </Button>
                  <Button
                    disabled={disabled || item.status === 'Free'}
                    onClick={() =>
                      setOperation({
                        title: '同步许可证',
                        description: `从授权服务同步「${item.licenseName}」的最新状态。`,
                        action: (signal) => operateLicense(node, 'sync', { id: item.id }, signal),
                      })
                    }
                  >
                    同步
                  </Button>
                  <Button
                    type="danger"
                    theme="borderless"
                    disabled={disabled || Boolean(item.bindNode)}
                    onClick={() =>
                      setOperation({
                        title: '删除许可证',
                        danger: true,
                        description: `删除「${item.licenseName}」的许可证记录。`,
                        confirmName: item.licenseName,
                        action: (signal) => operateLicense(node, 'del', { id: item.id }, signal),
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
      {editor?.type === 'upload' && (
        <LicenseUploadForm
          node={node}
          item={editor.item}
          onClose={() => setEditor(null)}
          onComplete={complete}
        />
      )}
      {editor?.type === 'bind' && editor.item && (
        <LicenseBindForm
          node={node}
          item={editor.item}
          onClose={() => setEditor(null)}
          onComplete={complete}
        />
      )}
      {editor?.type === 'unbind' && editor.item && (
        <LicenseUnbindForm
          node={node}
          item={editor.item}
          onClose={() => setEditor(null)}
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
