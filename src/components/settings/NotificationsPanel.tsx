import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import Button from '@douyinfe/semi-ui/lib/es/button'
import Card from '@douyinfe/semi-ui/lib/es/card'
import { Form } from '@douyinfe/semi-ui/lib/es/form'
import Tag from '@douyinfe/semi-ui/lib/es/tag'
import Banner from '@douyinfe/semi-ui/lib/es/banner'
import Toast from '@douyinfe/semi-ui/lib/es/toast'
import { IconPlus } from '@douyinfe/semi-icons'
import { ResourceToolbar, ResourceState, ResourcePagination } from '../management/ResourceLayout'
import type { ModulePageProps } from '../management/ResourceLayout'
import { ResourceForm } from '../management/ResourceForm'
import { OperationModal } from '../management/OperationModal'
import type { ResourceOperation } from '../management/OperationModal'
import { usePanelQuery } from '../../hooks/usePanelQuery'
import { useResourceSearch } from '../../hooks/useResourceSearch'
import { usePanelMutation } from '../../hooks/usePanelMutation'
import {
  searchNotificationConfigs,
  fetchNotificationCommon,
  notificationInitialValues,
  notificationCommonInitialValues,
  readSettingsObject,
  saveNotificationConfig,
  saveNotificationCommon,
  changeNotificationConfig,
} from '../../lib/settingsResources'
import { notificationTypes, resourceAlertTypes } from '../../types/settingsResources'
import type {
  NotificationConfig,
  NotificationValues,
  NotificationCommonValues,
} from '../../types/settingsResources'
import type { NodeConfig } from '../../lib/nodes'

function NotificationEditor({
  node,
  item,
  onClose,
  onComplete,
}: {
  node: NodeConfig
  item?: NotificationConfig
  onClose: () => void
  onComplete: () => void
}) {
  const [initialValues] = useState(() => notificationInitialValues(item))
  const [type, setType] = useState(initialValues.type)
  const [bodyType, setBodyType] = useState(initialValues.bodyType)
  const required = [{ required: true, whitespace: true, message: '请填写此项' }]
  return (
    <ResourceForm<NotificationValues>
      title={item ? '编辑通知方式' : '添加通知方式'}
      initialValues={initialValues}
      onClose={onClose}
      onComplete={onComplete}
      onSubmit={(values, signal) =>
        saveNotificationConfig(node, { ...initialValues, ...values }, item, signal)
      }
    >
      <Form.Select
        field="type"
        label="通知方式"
        disabled={Boolean(item)}
        style={{ width: '100%' }}
        optionList={notificationTypes}
        onChange={(value) => setType(String(value))}
      />
      <Form.Input field="displayName" label="名称" maxLength={128} rules={required} />
      <Form.Select
        field="status"
        label="状态"
        style={{ width: '100%' }}
        optionList={[
          { label: '启用', value: 'Enable' },
          { label: '停用', value: 'Disable' },
        ]}
      />
      {type === 'email' ? (
        <>
          <Form.Input field="host" label="SMTP 服务器" rules={required} />
          <Form.InputNumber
            field="port"
            label="SMTP 端口"
            min={1}
            max={65535}
            precision={0}
            style={{ width: '100%' }}
            rules={[{ required: true, message: '请输入端口' }]}
          />
          <Form.Input
            field="sender"
            label="发件邮箱"
            rules={[{ type: 'email', required: true, message: '请输入有效的发件邮箱' }]}
          />
          <Form.Input field="userName" label="SMTP 用户名" rules={required} />
          <Form.Input
            field="password"
            label="密码 / 授权码"
            mode="password"
            extraText={item ? '留空保留已保存的授权码。' : undefined}
            rules={item ? [] : required}
          />
          <Form.Select
            field="encryption"
            label="加密方式"
            style={{ width: '100%' }}
            optionList={[
              { label: 'SSL', value: 'SSL' },
              { label: 'STARTTLS', value: 'TLS' },
              { label: '无', value: 'NONE' },
            ]}
          />
          <Form.TextArea
            field="recipient"
            label="收件邮箱"
            extraText="多个邮箱以逗号分隔。"
            rules={required}
          />
        </>
      ) : type === 'sms' ? (
        <>
          <Form.Input field="phone" label="手机号码" rules={item ? [] : required} />
          <Form.InputNumber
            field="alertDailyNum"
            label="每日发送上限"
            min={1}
            max={10000}
            precision={0}
            style={{ width: '100%' }}
          />
        </>
      ) : (
        <>
          <Form.Input
            field="url"
            label="Webhook 地址"
            mode="password"
            extraText={item ? '留空保留已保存的地址。' : undefined}
            rules={[{ required: !item, type: 'url', message: '请输入完整的 Webhook 地址' }]}
          />
          {type === 'custom' && (
            <>
              <Form.Select
                field="bodyType"
                label="请求体格式"
                style={{ width: '100%' }}
                onChange={(value) => setBodyType(String(value))}
                optionList={[
                  { label: 'JSON', value: 'json' },
                  { label: '文本', value: 'text' },
                  { label: '表单', value: 'form' },
                ]}
              />
              {bodyType === 'form' ? (
                <Form.TextArea
                  field="formFields"
                  label="表单字段"
                  autosize={{ minRows: 4, maxRows: 8 }}
                  extraText="每行填写 名称=值，可使用 {{title}}、{{message}} 等变量。"
                />
              ) : (
                <Form.TextArea
                  field="bodyTemplate"
                  label="请求体模板"
                  autosize={{ minRows: 5, maxRows: 12 }}
                  rules={required}
                  extraText="支持 {{title}}、{{message}}、{{nodeName}} 等告警变量。"
                />
              )}
              <Form.TextArea
                field="headers"
                label="请求头"
                autosize={{ minRows: 3, maxRows: 6 }}
                extraText="每行填写 名称=值。已有敏感请求头会保留；同名字段可填写新值进行替换。"
              />
            </>
          )}
        </>
      )}
    </ResourceForm>
  )
}

function NotificationCommonForm({
  node,
  item,
  disabled,
  onSavingChange,
  onComplete,
}: {
  node: NodeConfig
  item: NotificationConfig | null
  disabled: boolean
  onSavingChange: (busy: boolean) => void
  onComplete: () => void
}) {
  const mutation = usePanelMutation()
  const [initialValues] = useState(() => notificationCommonInitialValues(item))
  useEffect(() => {
    onSavingChange(mutation.busy)
    return () => onSavingChange(false)
  }, [mutation.busy, onSavingChange])
  return (
    <Card title="发送设置">
      <Form<NotificationCommonValues>
        initValues={initialValues}
        className="max-w-200"
        disabled={disabled || mutation.busy}
        allowEmpty
        onSubmit={(values) =>
          void mutation
            .run((signal) => saveNotificationCommon(node, item, values, signal))
            .then((success) => {
              if (success) {
                Toast.success('发送设置已保存')
                onComplete()
              }
            })
        }
      >
        <div className="grid grid-cols-2 gap-x-4">
          <Form.Input
            field="noticeStart"
            label="通知类开始时间"
            type="time"
            step="1"
            rules={[{ required: true, message: '请选择时间' }]}
          />
          <Form.Input
            field="noticeEnd"
            label="通知类结束时间"
            type="time"
            step="1"
            rules={[{ required: true, message: '请选择时间' }]}
          />
          <Form.Input
            field="resourceStart"
            label="资源类开始时间"
            type="time"
            step="1"
            rules={[{ required: true, message: '请选择时间' }]}
          />
          <Form.Input
            field="resourceEnd"
            label="资源类结束时间"
            type="time"
            step="1"
            rules={[{ required: true, message: '请选择时间' }]}
          />
        </div>
        <Form.CheckboxGroup
          field="resourceTypes"
          label="按资源类时段发送的告警"
          options={resourceAlertTypes}
          extraText="其余告警按通知类时段发送。"
        />
        <Button
          className="mt-4"
          htmlType="submit"
          theme="solid"
          disabled={disabled}
          loading={mutation.busy}
        >
          保存发送设置
        </Button>
        {mutation.error && (
          <Banner className="mt-4" type="danger" closeIcon={null} description={mutation.error} />
        )}
      </Form>
    </Card>
  )
}

export function NotificationsPanel({
  navigation,
  ...props
}: ModulePageProps & { navigation: ReactNode }) {
  const { node } = props
  const [editor, setEditor] = useState<{ item?: NotificationConfig } | null>(null)
  const [operation, setOperation] = useState<ResourceOperation | null>(null)
  const [commonSaving, setCommonSaving] = useState(false)
  const filter = useResourceSearch('notification-configs')
  const load = useCallback(
    async (signal: AbortSignal) => {
      const [page, common] = await Promise.all([
        searchNotificationConfigs(node, filter.search, signal),
        fetchNotificationCommon(node, signal),
      ])
      return { ...page, common }
    },
    [node, filter.search],
  )
  const query = usePanelQuery(JSON.stringify([node, filter.search]), load, {
    enabled: Boolean(node.apiKey),
  })
  const disabled = query.loading || Boolean(query.error) || commonSaving
  return (
    <>
      <ResourceToolbar
        loading={query.loading}
        refreshDisabled={commonSaving}
        onRefresh={query.refresh}
        actions={
          <Button
            theme="solid"
            icon={<IconPlus />}
            disabled={!node.apiKey || disabled}
            onClick={() => setEditor({})}
          >
            添加通知方式
          </Button>
        }
      >
        {navigation}
      </ResourceToolbar>
      {query.data && node.apiKey && (
        <NotificationCommonForm
          key={query.receivedAt}
          node={node}
          item={query.data.common}
          disabled={query.loading || Boolean(query.error)}
          onSavingChange={setCommonSaving}
          onComplete={query.refresh}
        />
      )}
      <ResourceState
        {...props}
        loading={query.loading}
        error={query.error}
        hasData={Boolean(query.data)}
        empty={!query.data?.items.length}
        onRetry={query.refresh}
        emptyTitle="暂无通知方式"
        emptyDescription="配置邮件或 Webhook，用于接收节点告警。"
      >
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="告警通知方式">
          {query.data?.items.map((item) => {
            let name =
              notificationTypes.find((type) => type.value === item.type)?.label || '通知方式'
            let summary = ''
            try {
              const config = readSettingsObject(item.config)
              name = String(config.displayName || name)
              summary =
                item.type === 'email'
                  ? `${config.sender || ''} · ${config.host || ''}:${config.port || ''}`
                  : ''
            } catch {
              summary = '配置格式不兼容，请在节点面板中检查'
            }
            const supported = notificationTypes.some((type) => type.value === item.type)
            return (
              <Card key={item.id} style={{ minWidth: 0 }}>
                <article className="flex h-full flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="m-0 wrap-anywhere text-base font-semibold">{name}</h2>
                      <p className="mt-2 mb-0 text-xs text-(--semi-color-text-2)">
                        {notificationTypes.find((type) => type.value === item.type)?.label ||
                          (item.type === 'custom' ? '自定义 Webhook' : item.type)}
                      </p>
                    </div>
                    <Tag color={item.status === 'Enable' ? 'green' : 'grey'}>
                      {item.status === 'Enable' ? '启用' : '停用'}
                    </Tag>
                  </div>
                  {summary && (
                    <p className="m-0 wrap-anywhere text-xs text-(--semi-color-text-2)">
                      {summary}
                    </p>
                  )}
                  <div className="mt-auto flex flex-wrap gap-2">
                    <Button disabled={disabled || !supported} onClick={() => setEditor({ item })}>
                      编辑
                    </Button>
                    <Button
                      disabled={disabled}
                      onClick={() =>
                        setOperation({
                          title: item.status === 'Enable' ? '停用通知方式' : '启用通知方式',
                          description: `更新「${name}」的告警通知状态。`,
                          action: (signal) =>
                            changeNotificationConfig(
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
                      disabled={disabled}
                      onClick={() =>
                        setOperation({
                          title: '删除通知方式',
                          description: `删除「${name}」的通知配置，关联的告警将无法使用此方式发送。`,
                          danger: true,
                          action: (signal) =>
                            changeNotificationConfig(node, item, 'delete', signal),
                        })
                      }
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
      {editor && (
        <NotificationEditor
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
