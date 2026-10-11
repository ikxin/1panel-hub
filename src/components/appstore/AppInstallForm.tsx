import { useState } from 'react'
import Banner from '@douyinfe/semi-ui/lib/es/banner'
import Card from '@douyinfe/semi-ui/lib/es/card'
import { Form } from '@douyinfe/semi-ui/lib/es/form'
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form'
import type { NodeConfig } from '../../lib/nodes'
import type { AppDetail, AppInstallValues } from '../../types/appstore'
import { initialInstallValues } from '../../utils/appstore'
import { AppParameterFields } from './AppParameterFields'

export function AppInstallForm({
  node,
  appKey,
  detail,
  disabled,
  onFormReady,
  onSubmit,
}: {
  node: NodeConfig
  appKey: string
  detail: AppDetail
  disabled: boolean
  onFormReady: (api: FormApi<AppInstallValues>) => void
  onSubmit: (values: AppInstallValues) => void
}) {
  const [initialValues] = useState(() => initialInstallValues(appKey, detail.params.formFields))

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {detail.hostMode && (
        <Banner
          type="info"
          closeIcon={null}
          description="此应用使用主机网络，将直接使用服务器端口。"
        />
      )}
      <Form<AppInstallValues>
        initValues={initialValues}
        getFormApi={onFormReady}
        onSubmit={onSubmit}
        disabled={disabled}
        allowEmpty
        autoScrollToError
        style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}
      >
        <Card title="基本信息">
          <Form.Input
            field="name"
            label="应用名称"
            maxLength={30}
            extraText="2–30 位字母、数字、下划线或连字符，以字母或数字开头和结尾。"
            validator={(value: string) =>
              /^(?![_-])[a-zA-Z0-9_-]{1,29}[a-zA-Z0-9]$/.test(value?.trim())
                ? ''
                : '请输入有效的应用名称'
            }
          />
        </Card>
        {detail.params.formFields.length > 0 && (
          <Card title="应用参数">
            <AppParameterFields node={node} fields={detail.params.formFields} />
          </Card>
        )}
        <Card title="部署选项">
          <Form.Switch
            field="pullImage"
            label="拉取最新镜像"
            extraText="关闭后优先使用节点已有的镜像。"
          />
          {!detail.hostMode && (
            <Form.Switch
              field="allowPort"
              label="放行应用端口"
              extraText="在节点防火墙中放行应用端口；云服务器安全组需另行配置。"
            />
          )}
        </Card>
      </Form>
    </div>
  )
}
