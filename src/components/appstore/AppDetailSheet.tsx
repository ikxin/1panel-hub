import { useRef, useState } from 'react'
import Banner from '@douyinfe/semi-ui/lib/es/banner'
import Button from '@douyinfe/semi-ui/lib/es/button'
import Empty from '@douyinfe/semi-ui/lib/es/empty'
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form'
import SideSheet from '@douyinfe/semi-ui/lib/es/sideSheet'
import Skeleton from '@douyinfe/semi-ui/lib/es/skeleton'
import Tabs from '@douyinfe/semi-ui/lib/es/tabs'
import Toast from '@douyinfe/semi-ui/lib/es/toast'
import { IconDownload } from '@douyinfe/semi-icons'
import { useAppDetail } from '../../hooks/useAppDetail'
import { useAppMutation } from '../../hooks/useAppMutation'
import { installApp } from '../../lib/appstore'
import type { NodeConfig } from '../../lib/nodes'
import type { AppInstallValues } from '../../types/appstore'
import { unsupportedAppFields } from '../../utils/appstore'
import { AppDetailOverview } from './AppDetailOverview'
import { AppInstallForm } from './AppInstallForm'
import { AppReadme } from './AppReadme'

export function AppDetailSheet({
  node,
  appKey,
  initialTab,
  onClose,
  onInstalled,
}: {
  node: NodeConfig
  appKey: string
  initialTab: 'detail' | 'install'
  onClose: () => void
  onInstalled: () => void
}) {
  const { info, detail, version, setVersion, loading, error, retry } = useAppDetail(node, appKey)
  const mutation = useAppMutation()
  const [tab, setTab] = useState<string>(initialTab)
  const formApi = useRef<FormApi<AppInstallValues> | null>(null)
  const canInstall = Boolean(
    detail?.enable &&
    !unsupportedAppFields(detail.params.formFields).length &&
    info?.status !== 'TakeDown',
  )
  const submit = async (values: AppInstallValues) => {
    if (!detail || !canInstall || loading || error) return
    if (await mutation.run((signal) => installApp(node, detail.id, values, signal))) {
      Toast.success('安装任务已提交，可在已安装应用中查看进度')
      onInstalled()
    }
  }
  const feedback = (
    <>
      {error && (
        <Banner
          type="danger"
          closeIcon={null}
          description={
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="min-w-0 wrap-anywhere">{error}</span>
              <Button theme="borderless" disabled={mutation.busy} onClick={retry}>
                重新加载
              </Button>
            </div>
          }
        />
      )}
      {mutation.error && <Banner type="danger" closeIcon={null} description={mutation.error} />}
      {info && !info.versions.length && (
        <div className="py-8">
          <Empty title="暂无可安装版本" description="请同步应用目录后重试。" />
        </div>
      )}
      {loading && (
        <div role="status" aria-label="正在加载应用详情">
          <Skeleton active loading placeholder={<Skeleton.Paragraph rows={6} />} />
        </div>
      )}
      {detail && !detail.enable && (
        <Banner
          type="warning"
          closeIcon={null}
          description="已达到此应用的安装数量限制，无法继续安装。"
        />
      )}
      {info?.status === 'TakeDown' && (
        <Banner type="warning" closeIcon={null} description="此应用已下架，暂不可安装。" />
      )}
    </>
  )

  return (
    <SideSheet
      visible
      title="应用详情"
      aria-label="应用详情"
      width="min(684px, 100vw)"
      onCancel={() => {
        if (!mutation.busy) onClose()
      }}
      closeOnEsc={!mutation.busy}
      maskClosable={!mutation.busy}
      closable={!mutation.busy}
      bodyStyle={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        padding: 0,
        overflow: 'hidden',
      }}
      footer={
        <div className="flex items-center justify-between gap-4">
          <div className="hidden min-w-0 flex-1 sm:block">
            <p className="mt-0 mb-1 text-xs text-(--semi-color-text-2)">安装到节点</p>
            <p className="m-0 truncate text-sm font-medium" title={node.name}>
              {node.name}
            </p>
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button disabled={mutation.busy} onClick={onClose}>
              关闭
            </Button>
            <Button
              className="flex-1 sm:flex-none"
              theme="solid"
              icon={<IconDownload />}
              loading={mutation.busy}
              disabled={!canInstall || loading || Boolean(error)}
              onClick={() => {
                if (tab === 'install') formApi.current?.submitForm()
                else setTab('install')
              }}
            >
              {tab === 'install' ? '确认安装' : '安装应用'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col text-(--semi-color-text-0)">
        <div className="max-h-[45%] shrink-0 overflow-y-auto overscroll-contain">
          <AppDetailOverview
            node={node}
            appKey={appKey}
            info={info}
            detail={detail}
            version={version}
            disabled={mutation.busy}
            onVersionChange={setVersion}
          />
        </div>
        <Tabs
          activeKey={tab}
          onChange={(value) => {
            if (!mutation.busy) setTab(value)
          }}
          type="line"
          keepDOM
          lazyRender
          tabPaneMotion={false}
          style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
          tabBarStyle={{ flexShrink: 0, padding: '0 24px' }}
          contentStyle={{ flex: 1, minHeight: 0, padding: 0, overflow: 'hidden' }}
        >
          <Tabs.TabPane
            itemKey="detail"
            tab="应用介绍"
            disabled={mutation.busy}
            style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden' }}
            className="overscroll-contain p-4 sm:p-6"
          >
            <div className="flex min-w-0 flex-col gap-4">
              {feedback}
              {detail && !loading && !error && (
                <AppReadme readMe={info?.readMe} dockerCompose={detail.dockerCompose} />
              )}
            </div>
          </Tabs.TabPane>
          <Tabs.TabPane
            itemKey="install"
            tab="安装配置"
            disabled={mutation.busy}
            style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden' }}
            className="overscroll-contain p-4 sm:p-6"
          >
            <div className="flex min-w-0 flex-col gap-4">
              {feedback}
              {detail && !loading && !error && (
                <AppInstallForm
                  key={detail.id}
                  node={node}
                  appKey={appKey}
                  detail={detail}
                  disabled={mutation.busy}
                  onFormReady={(api) => {
                    formApi.current = api
                  }}
                  onSubmit={(values) => void submit(values)}
                />
              )}
            </div>
          </Tabs.TabPane>
        </Tabs>
      </div>
    </SideSheet>
  )
}
