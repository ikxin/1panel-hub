import { useCallback, useState } from 'react'
import Banner from '@douyinfe/semi-ui/lib/es/banner'
import Button from '@douyinfe/semi-ui/lib/es/button'
import Card from '@douyinfe/semi-ui/lib/es/card'
import { Form } from '@douyinfe/semi-ui/lib/es/form'
import SideSheet from '@douyinfe/semi-ui/lib/es/sideSheet'
import Spin from '@douyinfe/semi-ui/lib/es/spin'
import Tabs from '@douyinfe/semi-ui/lib/es/tabs'
import Tag from '@douyinfe/semi-ui/lib/es/tag'
import Toast from '@douyinfe/semi-ui/lib/es/toast'
import { usePanelQuery } from '../../hooks/usePanelQuery'
import { usePanelMutation } from '../../hooks/usePanelMutation'
import type { NodeConfig } from '../../lib/nodes'
import {
  createDomains,
  deleteDomain,
  fetchDomains,
  fetchWebsiteDetail,
  fetchWebsiteLog,
  updateWebsite,
} from '../../lib/website'
import type { Website } from '../../types/website'
import { OperationModal } from '../management/OperationModal'
import type { ResourceOperation } from '../management/OperationModal'

function WebsiteLog({ node, website, type }: { node: NodeConfig; website: Website; type: string }) {
  const load = useCallback(
    (signal: AbortSignal) => fetchWebsiteLog(node, website.id, type, signal),
    [node, website.id, type],
  )
  const log = usePanelQuery(`${website.id}:${type}`, load)
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between gap-2">
        <span className="text-xs text-(--semi-color-text-2)">最近 100 行</span>
        <Button loading={log.loading} onClick={log.refresh}>
          刷新日志
        </Button>
      </div>
      {log.error && <Banner type="danger" closeIcon={null} description={log.error} />}
      {log.loading && !log.data ? (
        <Spin />
      ) : (
        <pre className="max-h-[65vh] overflow-auto rounded-lg bg-(--semi-color-fill-0) p-4 text-xs whitespace-pre-wrap wrap-anywhere">
          {log.data
            ? log.data.enable
              ? log.data.content || '暂无日志'
              : '此网站未启用该日志'
            : '无法读取日志'}
        </pre>
      )}
    </div>
  )
}

export function WebsiteDetailSheet({
  node,
  website,
  onClose,
  onChanged,
}: {
  node: NodeConfig
  website: Website
  onClose: () => void
  onChanged: () => void
}) {
  const [tab, setTab] = useState('settings')
  const [operation, setOperation] = useState<ResourceOperation | null>(null)
  const [formRevision, setFormRevision] = useState(0)
  const load = useCallback(
    async (signal: AbortSignal) => {
      const [detail, domains] = await Promise.all([
        fetchWebsiteDetail(node, website.id, signal),
        fetchDomains(node, website.id, signal),
      ])
      return { detail, domains }
    },
    [node, website.id],
  )
  const state = usePanelQuery(String(website.id), load)
  const mutation = usePanelMutation()
  const changed = () => {
    state.refresh()
    onChanged()
  }
  return (
    <SideSheet
      visible
      title={website.primaryDomain}
      width="min(720px, 100vw)"
      onCancel={() => {
        if (!mutation.busy && !operation) onClose()
      }}
      closable={!mutation.busy && !operation}
      maskClosable={!mutation.busy && !operation}
      closeOnEsc={!mutation.busy && !operation}
    >
      <Tabs
        activeKey={tab}
        onChange={setTab}
        type="button"
        tabList={[
          { itemKey: 'settings', tab: '站点与域名' },
          { itemKey: 'access', tab: '访问日志' },
          { itemKey: 'error', tab: '错误日志' },
        ]}
      />
      <div className="mt-5 space-y-4">
        {tab !== 'settings' ? (
          <WebsiteLog key={tab} node={node} website={website} type={tab} />
        ) : (
          <>
            {state.error && (
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
            )}
            {state.loading && !state.data && <Spin />}
            {state.data && (
              <>
                <Card title="基本信息">
                  <p className="mt-0 text-xs break-all text-(--semi-color-text-2)">
                    站点目录：{state.data.detail.sitePath || '—'}
                  </p>
                  <Form<{ remark: string }>
                    key={state.receivedAt}
                    initValues={{ remark: state.data.detail.remark }}
                    disabled={mutation.busy || Boolean(state.error)}
                    onSubmit={(values) =>
                      void mutation
                        .run((signal) =>
                          updateWebsite(
                            node,
                            { ...state.data!.detail, remark: values.remark },
                            signal,
                          ),
                        )
                        .then((success) => {
                          if (success) {
                            Toast.success('备注已保存')
                            changed()
                          }
                        })
                    }
                  >
                    <Form.TextArea field="remark" label="备注" maxLength={256} />
                    <Button
                      htmlType="submit"
                      theme="solid"
                      loading={mutation.busy}
                      disabled={Boolean(state.error)}
                    >
                      保存备注
                    </Button>
                  </Form>
                </Card>
                <Card title="绑定域名">
                  <div className="space-y-2">
                    {state.data.domains.map((domain) => (
                      <div
                        key={domain.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-(--semi-color-fill-0) p-3"
                      >
                        <span className="min-w-0 break-all text-sm">
                          {domain.domain}:{domain.port}
                        </span>
                        <div className="flex items-center gap-2">
                          <Tag color={domain.ssl ? 'green' : 'grey'}>
                            {domain.ssl ? 'HTTPS' : 'HTTP'}
                          </Tag>
                          <Button
                            size="small"
                            theme="borderless"
                            type="danger"
                            disabled={
                              mutation.busy ||
                              Boolean(state.error) ||
                              state.data!.domains.length <= 1 ||
                              domain.domain === website.primaryDomain.split(':')[0]
                            }
                            onClick={() =>
                              setOperation({
                                title: '删除域名',
                                description: `解除「${domain.domain}:${domain.port}」与网站的绑定。此域名将不再指向该站点配置。`,
                                danger: true,
                                action: (signal) => deleteDomain(node, domain.id, signal),
                              })
                            }
                          >
                            删除
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {website.type !== 'stream' && (
                    <Form<{ domains: string; port: number }>
                      key={formRevision}
                      initValues={{ domains: '', port: 80 }}
                      disabled={mutation.busy || Boolean(state.error)}
                      onSubmit={(values) =>
                        void mutation
                          .run((signal) =>
                            createDomains(node, website.id, values.domains, values.port, signal),
                          )
                          .then((success) => {
                            if (success) {
                              Toast.success('域名已添加')
                              setFormRevision((value) => value + 1)
                              changed()
                            }
                          })
                      }
                    >
                      <Form.TextArea
                        field="domains"
                        label="添加域名"
                        placeholder="每行一个域名"
                        rules={[{ required: true, message: '请输入域名' }]}
                      />
                      <Form.InputNumber
                        field="port"
                        label="HTTP 端口"
                        min={1}
                        max={65535}
                        precision={0}
                        rules={[{ required: true }]}
                      />
                      <Button
                        htmlType="submit"
                        loading={mutation.busy}
                        disabled={Boolean(state.error)}
                      >
                        添加域名
                      </Button>
                    </Form>
                  )}
                </Card>
              </>
            )}
            {mutation.error && (
              <Banner type="danger" closeIcon={null} description={mutation.error} />
            )}
          </>
        )}
      </div>
      {operation && (
        <OperationModal
          operation={operation}
          onClose={() => setOperation(null)}
          onComplete={() => {
            setOperation(null)
            changed()
          }}
        />
      )}
    </SideSheet>
  )
}
