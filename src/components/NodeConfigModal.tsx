import { useEffect, useRef, useState } from 'react'
import Banner from '@douyinfe/semi-ui/lib/es/banner'
import Button from '@douyinfe/semi-ui/lib/es/button'
import { Form } from '@douyinfe/semi-ui/lib/es/form'
import Modal from '@douyinfe/semi-ui/lib/es/modal'
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form'
import { createDefaultNode, isValidHost } from '../lib/nodes'
import type { NodeConfig } from '../lib/nodes'
import { errorMessage, fetchDashboard } from '../lib/panel'

interface Props {
  node?: NodeConfig
  onClose: () => void
  onSave: (node: NodeConfig, originalName?: string) => void
}

export function NodeConfigModal({ node, onClose, onSave }: Props) {
  const api = useRef<FormApi<NodeConfig> | null>(null)
  const request = useRef<AbortController | null>(null)
  const [error, setError] = useState('')
  const [testing, setTesting] = useState(false)
  const [connection, setConnection] = useState<{
    type: 'success' | 'danger'
    message: string
  } | null>(null)

  useEffect(() => () => request.current?.abort(), [])

  const testConnection = async () => {
    if (!api.current || request.current) return
    const controller = new AbortController()
    request.current = controller
    setTesting(true)
    setError('')
    setConnection(null)
    try {
      try {
        await api.current.validate(['host', 'port', 'https', 'apiKey', 'apiKeyId'])
      } catch {
        return
      }
      controller.signal.throwIfAborted()
      const values = api.current.getValues()
      const startedAt = performance.now()
      const data = await fetchDashboard(
        {
          ...values,
          host: values.host.trim(),
          apiKey: values.apiKey.trim(),
          apiKeyId: values.apiKeyId?.trim() || '',
        },
        controller.signal,
      )
      if (!controller.signal.aborted) {
        setConnection({
          type: 'success',
          message: `连接成功，已获取「${data.hostname || values.host}」概览（${Math.round(performance.now() - startedAt)} 毫秒）`,
        })
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        setConnection({ type: 'danger', message: errorMessage(error) })
      }
    } finally {
      if (request.current === controller) request.current = null
      if (!controller.signal.aborted) setTesting(false)
    }
  }

  const submit = (values: NodeConfig) => {
    if (request.current) return
    try {
      onSave(values, node?.name)
      onClose()
    } catch (error) {
      setError(errorMessage(error))
    }
  }

  return (
    <Modal
      title={node ? '编辑节点' : '创建节点'}
      visible
      maskClosable={false}
      onCancel={onClose}
      onOk={() => api.current?.submitForm()}
      width="min(560px, calc(100vw - 32px))"
      bodyStyle={{ maxHeight: 'calc(100dvh - 220px)', overflowY: 'auto' }}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button style={{ marginLeft: 0 }} loading={testing} onClick={() => void testConnection()}>
            测试连接
          </Button>
          <div className="ml-auto flex items-center gap-3">
            <Button style={{ marginLeft: 0 }} type="tertiary" autoFocus onClick={onClose}>
              取消
            </Button>
            <Button
              style={{ marginLeft: 0 }}
              theme="solid"
              disabled={testing}
              onClick={() => api.current?.submitForm()}
            >
              保存
            </Button>
          </div>
        </div>
      }
    >
      {error && <Banner type="danger" description={error} className="mb-4" />}
      <Banner
        type="info"
        description="请在 1Panel 中启用 API 接口、创建 API Key，并将当前客户端 IP 加入白名单。"
        closeIcon={null}
        className="mb-4"
      />
      {connection && (
        <Banner
          type={connection.type}
          description={connection.message}
          closeIcon={null}
          className="mb-4"
        />
      )}
      <Form<NodeConfig>
        allowEmpty
        initValues={node || createDefaultNode()}
        getFormApi={(formApi) => {
          api.current = formApi
        }}
        onSubmit={submit}
        disabled={testing}
        onValueChange={() => {
          setError('')
          setConnection(null)
        }}
      >
        <Form.Input
          field="name"
          label="节点名称"
          rules={[{ required: true, whitespace: true, message: '请输入节点名称' }]}
        />
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-3">
          <Form.Input
            field="host"
            label="IP 地址 / 域名"
            fieldClassName="sm:col-span-2"
            validator={(value: string) => (isValidHost(value?.trim() || '') ? '' : 'IP 地址无效')}
          />
          <Form.InputNumber
            field="port"
            label="端口"
            min={1}
            max={65535}
            className="w-full"
            rules={[
              {
                required: true,
                type: 'integer',
                min: 1,
                max: 65535,
                message: '端口无效',
              },
            ]}
          />
        </div>
        <Form.Input
          field="apiKey"
          label="API Key"
          mode="password"
          autoComplete="off"
          rules={[{ required: true, whitespace: true, message: '请输入 API Key' }]}
        />
        <Form.Input
          field="apiKeyId"
          label="Key ID（可选）"
          placeholder="多个 API Key 时可填写对应的 ID"
        />
        <Form.Switch field="https" label="HTTPS" />
      </Form>
    </Modal>
  )
}
