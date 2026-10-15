import { useCallback, useState } from 'react'
import type { ReactNode } from 'react'
import Banner from '@douyinfe/semi-ui/lib/es/banner'
import Button from '@douyinfe/semi-ui/lib/es/button'
import Card from '@douyinfe/semi-ui/lib/es/card'
import { Form } from '@douyinfe/semi-ui/lib/es/form'
import Toast from '@douyinfe/semi-ui/lib/es/toast'
import { ResourceToolbar, ResourceState } from '../management/ResourceLayout'
import type { ModulePageProps } from '../management/ResourceLayout'
import { OperationModal } from '../management/OperationModal'
import type { ResourceOperation } from '../management/OperationModal'
import { SettingsForm } from './SettingsForm'
import { usePanelQuery } from '../../hooks/usePanelQuery'
import { fetchAgentSettings, fetchPanelSettings } from '../../lib/settings'
import { fetchUpgradeInfo, upgradePanel } from '../../lib/settingsResources'
import { errorMessage, openExternal } from '../../lib/panel'
import { upgradeSettingFields } from '../../types/settings'

export function AboutPanel({ navigation, ...props }: ModulePageProps & { navigation: ReactNode }) {
  const { node } = props
  const [checkUpgrade, setCheckUpgrade] = useState(false)
  const [saving, setSaving] = useState(false)
  const [operation, setOperation] = useState<ResourceOperation | null>(null)
  const load = useCallback(
    async (signal: AbortSignal) => {
      const [panel, agent] = await Promise.all([
        fetchPanelSettings(node, signal),
        fetchAgentSettings(node, signal),
      ])
      return { panel, agent }
    },
    [node],
  )
  const query = usePanelQuery(JSON.stringify(node), load, { enabled: Boolean(node.apiKey) })
  const loadUpgrade = useCallback((signal: AbortSignal) => fetchUpgradeInfo(node, signal), [node])
  const upgrade = usePanelQuery(JSON.stringify(node), loadUpgrade, {
    enabled: Boolean(node.apiKey && checkUpgrade),
  })
  const disabled = query.loading || Boolean(query.error)
  const versions = [
    ...new Set([
      upgrade.data?.newVersion,
      upgrade.data?.latestVersion,
      query.data?.panel.developerMode === 'Enable' ? upgrade.data?.testVersion : '',
    ]),
  ].filter((value): value is string => Boolean(value))
  return (
    <>
      <ResourceToolbar
        loading={query.loading}
        refreshDisabled={saving}
        onRefresh={query.refresh}
        actions={
          <Button disabled={props.editDisabled || saving} onClick={props.onEdit}>
            编辑节点连接
          </Button>
        }
      >
        {navigation}
      </ResourceToolbar>
      <ResourceState
        {...props}
        loading={query.loading}
        error={query.error}
        hasData={Boolean(query.data)}
        empty={false}
        onRetry={query.refresh}
        emptyTitle="暂无节点信息"
        emptyDescription="请检查节点连接及 API 权限。"
      >
        {query.data && (
          <>
            <SettingsForm
              key={query.receivedAt}
              node={node}
              values={query.data.panel}
              fields={upgradeSettingFields}
              disabled={disabled}
              readOnlyFields={[
                { label: '面板版本', value: query.data.panel.systemVersion },
                { label: '节点版本', value: query.data.agent.systemVersion },
                { label: '节点 IP', value: query.data.agent.systemIP },
                { label: '节点时间', value: query.data.agent.localTime },
                { label: '系统时区', value: query.data.agent.timeZone },
                { label: 'NTP 服务器', value: query.data.agent.ntpSite },
                { label: 'Docker 套接字', value: query.data.agent.dockerSockPath },
              ]}
              onSavingChange={setSaving}
              onComplete={query.refresh}
            />
            <Card>
              <Form className="max-w-200" labelPosition="top">
                <Form.Slot label="版本更新">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      loading={upgrade.loading}
                      disabled={disabled || saving}
                      onClick={() => {
                        if (checkUpgrade) upgrade.refresh()
                        else setCheckUpgrade(true)
                      }}
                    >
                      检查更新
                    </Button>
                    {versions
                      .filter(
                        (version) =>
                          version.replace(/^v/, '') !==
                          query.data!.panel.systemVersion.replace(/^v/, ''),
                      )
                      .map((version) => (
                        <Button
                          key={version}
                          disabled={disabled || upgrade.loading || Boolean(upgrade.error)}
                          onClick={() =>
                            setOperation({
                              title: `升级至 ${version}`,
                              danger: true,
                              confirmName: node.name,
                              successMessage: '升级任务已提交，请稍后刷新确认版本',
                              description:
                                '升级将重启面板服务，连接会暂时中断。请先创建并确认可用的节点快照。',
                              action: (signal) => upgradePanel(node, version, signal),
                            })
                          }
                        >
                          升级至 {version}
                        </Button>
                      ))}
                  </div>
                </Form.Slot>
                {upgrade.error && (
                  <Banner type="danger" closeIcon={null} description={upgrade.error} />
                )}
                {upgrade.data && !upgrade.loading && (
                  <p className="m-0 text-sm text-(--semi-color-text-2)">
                    最新版本：{upgrade.data.latestVersion || '暂无可用更新'}
                  </p>
                )}
                {upgrade.data?.releaseNote && (
                  <Form.Slot label="更新说明">
                    <div className="max-h-80 overflow-y-auto whitespace-pre-wrap wrap-anywhere text-sm text-(--semi-color-text-1)">
                      {upgrade.data.releaseNote}
                    </div>
                  </Form.Slot>
                )}
              </Form>
            </Card>
            <Card>
              <div className="flex flex-wrap gap-3">
                {[
                  { label: '官方文档', url: 'https://1panel.cn/docs/v2/' },
                  { label: 'GitHub', url: 'https://github.com/1Panel-dev/1Panel' },
                  { label: '官方网站', url: 'https://1panel.cn' },
                ].map((link) => (
                  <Button
                    key={link.label}
                    onClick={() =>
                      void openExternal(link.url).catch((error) => Toast.error(errorMessage(error)))
                    }
                  >
                    {link.label}
                  </Button>
                ))}
              </div>
            </Card>
          </>
        )}
      </ResourceState>
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
