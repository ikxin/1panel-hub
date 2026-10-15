import { useRef } from 'react'
import Banner from '@douyinfe/semi-ui/lib/es/banner'
import Button from '@douyinfe/semi-ui/lib/es/button'
import Card from '@douyinfe/semi-ui/lib/es/card'
import { Form } from '@douyinfe/semi-ui/lib/es/form'
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form'
import Input from '@douyinfe/semi-ui/lib/es/input'
import Toast from '@douyinfe/semi-ui/lib/es/toast'
import { useSettingsForm } from '../../hooks/useSettingsForm'
import { errorMessage } from '../../lib/panel'
import { normalizeSettingValue } from '../../lib/settings'
import type { NodeConfig } from '../../lib/nodes'
import type { SettingField, SettingValues } from '../../types/settings'

export function SettingsForm({
  node,
  fields,
  values,
  readOnlyFields = [],
  disabled,
  onSavingChange,
  onComplete,
}: {
  node: NodeConfig
  fields: SettingField[]
  values: Record<string, unknown>
  readOnlyFields?: { label: string; value: string | number }[]
  disabled: boolean
  onSavingChange: (saving: boolean) => void
  onComplete: () => void
}) {
  const api = useRef<FormApi<SettingValues> | null>(null)
  const submitting = useRef(false)
  const form = useSettingsForm(node, fields, values)
  const submit = async (nextValues: SettingValues) => {
    if (submitting.current) return
    submitting.current = true
    onSavingChange(true)
    try {
      if (await form.save(nextValues)) {
        Toast.success('设置已保存')
        onComplete()
      }
    } finally {
      submitting.current = false
      onSavingChange(false)
    }
  }
  return (
    <Card bodyStyle={{ padding: 0 }} style={{ minWidth: 0 }}>
      <Form<SettingValues>
        className="p-4 sm:p-6"
        aria-label="节点设置"
        initValues={form.initialValues}
        getFormApi={(value) => {
          api.current = value
        }}
        onValueChange={form.setDraft}
        onSubmit={(nextValues) => void submit(nextValues)}
        disabled={disabled || form.busy}
        autoComplete="off"
        autoScrollToError
        allowEmpty
      >
        <div className="max-w-200">
          {readOnlyFields.map((field) => (
            <Form.Slot key={field.label} label={field.label}>
              <Input aria-label={field.label} value={String(field.value || '—')} readOnly />
            </Form.Slot>
          ))}
          {fields.map((field) => {
            const props = {
              field: field.field,
              label: field.label,
              extraText: field.description,
              style: { width: '100%' },
              trigger: 'blur' as const,
              validator: (value: string | number | undefined) => {
                try {
                  normalizeSettingValue(field, value)
                  return ''
                } catch (error) {
                  return errorMessage(error)
                }
              },
            }
            return (
              <div key={field.key}>
                {field.kind === 'select' ? (
                  <Form.Select {...props} optionList={field.options} />
                ) : field.kind === 'number' ? (
                  <Form.InputNumber
                    {...props}
                    min={field.min}
                    max={field.max}
                    precision={0}
                    suffix={field.unit}
                  />
                ) : field.kind === 'textarea' ? (
                  <Form.TextArea
                    {...props}
                    maxLength={4096}
                    autosize={{ minRows: 2, maxRows: 5 }}
                  />
                ) : (
                  <Form.Input
                    {...props}
                    mode={field.kind === 'password' ? 'password' : undefined}
                    maxLength={4096}
                  />
                )}
                {field.warning && form.changed.some((item) => item.key === field.key) && (
                  <Banner
                    type="warning"
                    className="mb-3"
                    closeIcon={null}
                    description={field.warning}
                  />
                )}
              </div>
            )
          })}
          {form.error && (
            <Banner type="danger" className="mt-4" closeIcon={null} description={form.error} />
          )}
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-(--semi-color-border) pt-5">
          <Button
            htmlType="submit"
            theme="solid"
            loading={form.busy}
            disabled={disabled || form.busy || !form.changed.length}
          >
            保存更改
          </Button>
          <Button
            disabled={disabled || form.busy || !form.changed.length}
            onClick={() => {
              api.current?.setValues(form.savedValues)
              form.setDraft(form.savedValues)
            }}
          >
            重置
          </Button>
          {form.changed.length > 0 && (
            <span className="text-xs text-(--semi-color-text-2)">
              已修改 {form.changed.length} 项
            </span>
          )}
        </div>
      </Form>
    </Card>
  )
}
