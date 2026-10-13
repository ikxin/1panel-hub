import { useRef } from 'react'
import type { ReactNode } from 'react'
import Banner from '@douyinfe/semi-ui/lib/es/banner'
import Button from '@douyinfe/semi-ui/lib/es/button'
import { Form } from '@douyinfe/semi-ui/lib/es/form'
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form'
import SideSheet from '@douyinfe/semi-ui/lib/es/sideSheet'
import Toast from '@douyinfe/semi-ui/lib/es/toast'
import { usePanelMutation } from '../../hooks/usePanelMutation'

export function ResourceForm<T extends Record<string, unknown>>({
  title,
  initialValues,
  children,
  disabled,
  onSubmit,
  onClose,
  onComplete,
}: {
  title: string
  initialValues: T
  children: ReactNode
  disabled?: boolean
  onSubmit: (values: T, signal: AbortSignal) => Promise<void>
  onClose: () => void
  onComplete: () => void
}) {
  const api = useRef<FormApi<T> | null>(null)
  const mutation = usePanelMutation()
  return (
    <SideSheet
      visible
      title={title}
      width="min(600px, 100vw)"
      onCancel={() => {
        if (!mutation.busy) onClose()
      }}
      closable={!mutation.busy}
      maskClosable={!mutation.busy}
      closeOnEsc={!mutation.busy}
      footer={
        <div className="flex justify-end gap-2">
          <Button disabled={mutation.busy} onClick={onClose}>
            取消
          </Button>
          <Button
            theme="solid"
            loading={mutation.busy}
            disabled={disabled}
            onClick={() => api.current?.submit()}
          >
            确认提交
          </Button>
        </div>
      }
    >
      <Form<T>
        initValues={initialValues}
        getFormApi={(value) => {
          api.current = value
        }}
        disabled={mutation.busy || disabled}
        autoComplete="off"
        allowEmpty
        autoScrollToError
        onSubmit={(values) =>
          void mutation
            .run((signal) => onSubmit(values, signal))
            .then((success) => {
              if (success) {
                Toast.success(`${title}完成`)
                onComplete()
              }
            })
        }
      >
        {children}
      </Form>
      {mutation.busy && (
        <Banner
          className="mt-4"
          type="info"
          closeIcon={null}
          description="正在执行，请稍候。后台任务完成后会自动刷新列表。"
        />
      )}
      {mutation.error && (
        <Banner
          className="mt-4"
          type="danger"
          closeIcon={null}
          description={<span className="whitespace-pre-wrap wrap-anywhere">{mutation.error}</span>}
        />
      )}
    </SideSheet>
  )
}
