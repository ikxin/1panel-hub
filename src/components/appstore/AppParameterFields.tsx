import { useEffect } from 'react'
import Button from '@douyinfe/semi-ui/lib/es/button'
import Banner from '@douyinfe/semi-ui/lib/es/banner'
import { Form, useFormApi, useFormState } from '@douyinfe/semi-ui/lib/es/form'
import { useAppServices } from '../../hooks/useAppServices'
import type { NodeConfig } from '../../lib/nodes'
import type { AppFormField, AppInstallValues } from '../../types/appstore'
import { fieldLabel, unsupportedAppFields, validateAppField } from '../../utils/appstore'

function ServiceField({
  node,
  field,
  serviceKey,
  fields,
}: {
  node: NodeConfig
  field: AppFormField
  serviceKey: string
  fields: AppFormField[]
}) {
  const { services, loading, error, retry } = useAppServices(node, serviceKey)
  const formApi = useFormApi<AppInstallValues>()
  const path = `params.${field.envKey}`
  useEffect(() => {
    formApi.setValue(path, '')
  }, [serviceKey, path, formApi])
  return (
    <Form.Select
      field={path}
      label={fieldLabel(field)}
      style={{ width: '100%' }}
      placeholder={loading ? '正在读取服务…' : '选择已运行的服务'}
      loading={loading}
      disabled={loading || !serviceKey}
      filter
      showClear={!field.required}
      rules={[{ required: field.required, message: `请选择${fieldLabel(field)}` }]}
      validator={(value: unknown) => {
        if (
          value &&
          !services.some((service) => service.value === value && service.status === 'Running')
        )
          return '请选择可用的运行中服务'
        return validateAppField(field, value)
      }}
      optionList={services.map((service) => ({
        value: service.value,
        label: `${service.label}${service.from === 'remote' ? '（远程）' : ''}${service.status !== 'Running' ? '（未运行）' : ''}`,
        disabled: service.status !== 'Running',
      }))}
      onChange={(value) => {
        const service = services.find((item) => item.value === value)
        if (service?.config) {
          for (const [key, setting] of Object.entries(service.config)) {
            if (fields.some((item) => item.envKey === key))
              formApi.setValue(`params.${key}`, setting)
          }
        }
      }}
      extraText={
        error ? (
          <span className="text-(--semi-color-danger)">
            {error}{' '}
            <Button theme="borderless" onClick={retry}>
              重试
            </Button>
          </span>
        ) : !loading && serviceKey && !services.some((service) => service.status === 'Running') ? (
          '没有可用服务，请先安装并启动依赖应用，再重新打开安装表单。'
        ) : undefined
      }
    />
  )
}

function ParameterField({
  node,
  field,
  fields,
}: {
  node: NodeConfig
  field: AppFormField
  fields: AppFormField[]
}) {
  const { values } = useFormState<AppInstallValues>()
  const formApi = useFormApi<AppInstallValues>()
  const common = {
    field: `params.${field.envKey}`,
    label: fieldLabel(field),
    extraText: field.description?.zh || field.description?.en,
    disabled: field.disabled,
    validator: (value: unknown) => validateAppField(field, value),
    rules: [{ required: field.required, message: `请填写${fieldLabel(field)}` }],
  }

  if (field.type === 'service')
    return <ServiceField node={node} field={field} serviceKey={field.key || ''} fields={fields} />
  if (field.type === 'apps' && field.child) {
    const serviceKey = String(values.params?.[field.envKey] ?? '')
    return (
      <>
        <Form.Select
          {...common}
          style={{ width: '100%' }}
          optionList={field.values ?? []}
          onChange={(value) => {
            for (const key of new Set(field.params?.map((param) => param.envKey)))
              formApi.setValue(`params.${key}`, '')
            for (const param of field.params ?? []) {
              if (param.key === value) formApi.setValue(`params.${param.envKey}`, param.value)
            }
            formApi.setValue(
              'params.format',
              value === 'mysql' || value === 'mariadb' ? 'utf8mb4' : '',
            )
          }}
        />
        <ServiceField
          node={node}
          field={{ ...field.child, required: field.required || field.child.required }}
          serviceKey={serviceKey}
          fields={fields}
        />
      </>
    )
  }
  if (field.type === 'select')
    return (
      <Form.Select
        {...common}
        style={{ width: '100%' }}
        optionList={field.values ?? []}
        multiple={field.multiple}
        allowCreate={field.allowCreate}
        filter
      />
    )
  if (field.type === 'number') return <Form.InputNumber {...common} style={{ width: '100%' }} />
  if (field.type === 'text' || field.type === 'password')
    return (
      <Form.Input
        {...common}
        mode={field.type === 'password' ? 'password' : undefined}
        autoComplete="off"
      />
    )
  return null
}

export function AppParameterFields({ node, fields }: { node: NodeConfig; fields: AppFormField[] }) {
  const unsupported = unsupportedAppFields(fields)
  return (
    <>
      {unsupported.length > 0 && (
        <Banner
          type="warning"
          closeIcon={null}
          description={`暂不支持此应用的参数类型：${unsupported.map(fieldLabel).join('、')}，请在节点的 1Panel 面板中安装。`}
        />
      )}
      {fields.map((field) => (
        <ParameterField key={field.envKey} node={node} field={field} fields={fields} />
      ))}
    </>
  )
}
