import { useState } from 'react'
import Banner from '@douyinfe/semi-ui/lib/es/banner'
import Button from '@douyinfe/semi-ui/lib/es/button'
import Input from '@douyinfe/semi-ui/lib/es/input'
import Modal from '@douyinfe/semi-ui/lib/es/modal'
import Toast from '@douyinfe/semi-ui/lib/es/toast'
import { usePanelMutation } from '../../hooks/usePanelMutation'

export interface ResourceOperation {
  title: string
  description: string
  confirmName?: string
  danger?: boolean
  successMessage?: string
  action: (signal: AbortSignal) => Promise<void>
}

export function OperationModal({
  operation,
  onClose,
  onComplete,
}: {
  operation: ResourceOperation
  onClose: () => void
  onComplete: () => void
}) {
  const mutation = usePanelMutation()
  const [confirmation, setConfirmation] = useState('')
  return (
    <Modal
      visible
      title={operation.title}
      style={{ width: 'min(480px, calc(100vw - 32px))' }}
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
            type={operation.danger ? 'danger' : 'primary'}
            loading={mutation.busy}
            disabled={Boolean(operation.confirmName && confirmation !== operation.confirmName)}
            onClick={() =>
              void mutation.run(operation.action).then((success) => {
                if (success) {
                  Toast.success(operation.successMessage ?? `${operation.title}完成`)
                  onComplete()
                }
              })
            }
          >
            确认
          </Button>
        </div>
      }
    >
      <div className="space-y-4 py-2">
        <p className="m-0 whitespace-pre-wrap wrap-anywhere text-sm">{operation.description}</p>
        {operation.confirmName && (
          <div>
            <label className="mb-2 block text-sm" htmlFor="resource-confirmation">
              输入「{operation.confirmName}」确认
            </label>
            <Input
              id="resource-confirmation"
              value={confirmation}
              onChange={setConfirmation}
              disabled={mutation.busy}
              autoComplete="off"
            />
          </div>
        )}
        {mutation.busy && (
          <p role="status" className="text-sm text-(--semi-color-text-2)">
            正在执行，请稍候…
          </p>
        )}
        {mutation.error && (
          <Banner
            type="danger"
            closeIcon={null}
            description={
              <span className="whitespace-pre-wrap wrap-anywhere">{mutation.error}</span>
            }
          />
        )}
      </div>
    </Modal>
  )
}
