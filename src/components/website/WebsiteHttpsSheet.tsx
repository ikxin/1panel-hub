import { useCallback, useState } from 'react'
import Banner from '@douyinfe/semi-ui/lib/es/banner'
import Button from '@douyinfe/semi-ui/lib/es/button'
import { Form } from '@douyinfe/semi-ui/lib/es/form'
import SideSheet from '@douyinfe/semi-ui/lib/es/sideSheet'
import Spin from '@douyinfe/semi-ui/lib/es/spin'
import { ResourceForm } from '../management/ResourceForm'
import { usePanelQuery } from '../../hooks/usePanelQuery'
import type { NodeConfig } from '../../lib/nodes'
import { fetchWebsiteHttps, updateWebsiteHttps } from '../../lib/websiteHttps'
import type { Website, WebsiteHttps, WebsiteHttpsValues } from '../../types/website'
import { certificateExpiry } from '../../utils/website'

function HttpsForm({
  node,
  website,
  config,
  certificates,
  onClose,
  onComplete,
}: {
  node: NodeConfig
  website: Website
  config: WebsiteHttps
  certificates: Awaited<ReturnType<typeof fetchWebsiteHttps>>['certificates']
  onClose: () => void
  onComplete: () => void
}) {
  const [enabled, setEnabled] = useState(config.enable)
  return (
    <ResourceForm<WebsiteHttpsValues>
      title={`HTTPS · ${website.primaryDomain}`}
      initialValues={{
        enable: config.enable,
        websiteSSLId: config.SSL.id || 0,
        httpConfig: config.httpConfig || 'HTTPToHTTPS',
      }}
      onClose={onClose}
      onComplete={onComplete}
      onSubmit={(values, signal) => updateWebsiteHttps(node, website.id, config, values, signal)}
    >
      <Form.Switch field="enable" label="启用 HTTPS" onChange={setEnabled} />
      {enabled ? (
        <>
          {!certificates.length && (
            <Banner
              type="warning"
              closeIcon={null}
              description="没有可用证书，请先在节点中申请或导入证书，再重新打开此页面。"
            />
          )}
          <Form.Select
            field="websiteSSLId"
            keepState
            label="证书"
            style={{ width: '100%' }}
            placeholder="选择已签发的有效证书"
            optionList={certificates.map((item) => ({
              label: `${item.primaryDomain} · ${certificateExpiry(item.expireDate)}`,
              value: item.id,
            }))}
            validator={(value, values) =>
              !values.enable || certificates.some((item) => item.id === value)
                ? ''
                : '请选择有效证书'
            }
            extraText="证书域名需要覆盖此网站绑定的域名。"
          />
          <Form.Select
            field="httpConfig"
            keepState
            label="HTTP 访问方式"
            style={{ width: '100%' }}
            optionList={[
              { label: '自动跳转 HTTPS', value: 'HTTPToHTTPS' },
              { label: '同时允许 HTTP 和 HTTPS', value: 'HTTPAlso' },
              { label: '仅允许 HTTPS', value: 'HTTPSOnly' },
            ]}
          />
        </>
      ) : (
        config.enable && (
          <Banner
            type="warning"
            closeIcon={null}
            description="保存后将关闭网站的 HTTPS，使用 HTTPS 的客户端可能无法访问。"
          />
        )
      )}
    </ResourceForm>
  )
}

export function WebsiteHttpsSheet({
  node,
  website,
  onClose,
  onComplete,
}: {
  node: NodeConfig
  website: Website
  onClose: () => void
  onComplete: () => void
}) {
  const load = useCallback(
    (signal: AbortSignal) => fetchWebsiteHttps(node, website.id, signal),
    [node, website.id],
  )
  const state = usePanelQuery(String(website.id), load)
  if (state.data && !state.error)
    return (
      <HttpsForm
        node={node}
        website={website}
        {...state.data}
        onClose={onClose}
        onComplete={onComplete}
      />
    )
  return (
    <SideSheet
      visible
      title={`HTTPS · ${website.primaryDomain}`}
      width="min(600px, 100vw)"
      onCancel={onClose}
    >
      {state.error ? (
        <Banner
          type="danger"
          closeIcon={null}
          description={
            <>
              {state.error}
              <Button theme="borderless" onClick={state.refresh}>
                重试
              </Button>
            </>
          }
        />
      ) : (
        <Spin />
      )}
    </SideSheet>
  )
}
