import { useCallback, useState } from 'react'
import type { ReactNode } from 'react'
import Button from '@douyinfe/semi-ui/lib/es/button'
import Card from '@douyinfe/semi-ui/lib/es/card'
import { Form } from '@douyinfe/semi-ui/lib/es/form'
import Select from '@douyinfe/semi-ui/lib/es/select'
import Toast from '@douyinfe/semi-ui/lib/es/toast'
import { ResourceToolbar, ResourceState } from '../management/ResourceLayout'
import type { ModulePageProps } from '../management/ResourceLayout'
import { SettingsForm } from './SettingsForm'
import { PanelConnectionForm, PanelProxyForm } from './PanelNetworkForms'
import { PanelMenuSheet } from './PanelMenuSheet'
import { usePanelQuery } from '../../hooks/usePanelQuery'
import { fetchGeneralSettings } from '../../lib/settings'
import { errorMessage, openExternal } from '../../lib/panel'
import { getNodeOrigin } from '../../lib/nodes'
import {
  panelSettingFields,
  securitySettingFields,
  monitorSettingFields,
} from '../../types/settings'
import type { SettingField } from '../../types/settings'

export function GeneralSettingsPanel({
  navigation,
  section,
  onSectionChange,
  ...props
}: ModulePageProps & {
  navigation: ReactNode
  section: 'panel' | 'security' | 'monitor'
  onSectionChange: (section: string) => void
}) {
  const { node } = props
  const [saving, setSaving] = useState(false)
  const [proxySaving, setProxySaving] = useState(false)
  const [menu, setMenu] = useState(false)
  const load = useCallback(
    (signal: AbortSignal) => fetchGeneralSettings(node, section, signal),
    [node, section],
  )
  const query = usePanelQuery(JSON.stringify([node, section]), load, {
    enabled: Boolean(node.apiKey),
  })
  const data = query.data
  const deviceFields: SettingField[] = [
    {
      key: 'DefaultNetwork',
      field: 'defaultNetwork',
      label: '默认网卡',
      description: '',
      scope: 'monitor',
      kind: 'select',
      options: [
        ...new Set([
          'all',
          String(data?.values.defaultNetwork || 'all'),
          ...(data?.networks ?? []),
        ]),
      ].map((value) => ({ value, label: value === 'all' ? '全部网卡' : value })),
    },
    {
      key: 'DefaultIO',
      field: 'defaultIO',
      label: '默认磁盘',
      description: '',
      scope: 'monitor',
      kind: 'select',
      options: [
        ...new Set(['all', String(data?.values.defaultIO || 'all'), ...(data?.disks ?? [])]),
      ].map((value) => ({ value, label: value === 'all' ? '全部磁盘' : value })),
    },
  ]
  const disabled = query.loading || Boolean(query.error)
  return (
    <>
      <ResourceToolbar
        loading={query.loading}
        refreshDisabled={saving || proxySaving}
        onRefresh={query.refresh}
        actions={
          <Button disabled={props.editDisabled || saving || proxySaving} onClick={props.onEdit}>
            编辑节点连接
          </Button>
        }
      >
        {navigation}
        {section !== 'security' && (
          <Select
            aria-label="面板配置分组"
            value={section}
            disabled={saving || proxySaving}
            style={{ width: 160 }}
            onChange={(value) => onSectionChange(String(value))}
            optionList={[
              { label: '基本设置', value: 'panel' },
              { label: '监控采集', value: 'monitor' },
            ]}
          />
        )}
      </ResourceToolbar>
      <ResourceState
        {...props}
        loading={query.loading}
        error={query.error}
        hasData={Boolean(data)}
        empty={false}
        onRetry={query.refresh}
        emptyTitle="暂无设置"
        emptyDescription="请检查节点连接及 API 权限。"
      >
        {data && (
          <SettingsForm
            key={`${section}:${query.receivedAt}`}
            node={node}
            values={data.values}
            fields={
              section === 'monitor'
                ? [...monitorSettingFields, ...deviceFields]
                : section === 'security'
                  ? securitySettingFields
                  : panelSettingFields
            }
            disabled={disabled || proxySaving}
            onSavingChange={setSaving}
            onComplete={query.refresh}
          />
        )}
        {section === 'panel' && data?.panel && (
          <>
            <PanelProxyForm
              key={`proxy:${query.receivedAt}`}
              node={node}
              settings={data.panel}
              disabled={disabled || saving}
              onSavingChange={setProxySaving}
              onComplete={query.refresh}
            />
            <Card>
              <Form className="max-w-200">
                <Form.Slot label="菜单设置">
                  <Button
                    disabled={disabled || saving || proxySaving}
                    onClick={() => setMenu(true)}
                  >
                    设置显示的菜单
                  </Button>
                </Form.Slot>
                {['水印设置', '自定义外观'].map((label) => (
                  <Form.Slot key={label} label={label}>
                    <Button
                      disabled={disabled || saving || proxySaving}
                      onClick={() =>
                        void openExternal(
                          `${getNodeOrigin(node)}/${data.panel?.securityEntrance || ''}`,
                        ).catch((error) => Toast.error(errorMessage(error)))
                      }
                    >
                      在节点原生面板中设置
                    </Button>
                  </Form.Slot>
                ))}
              </Form>
            </Card>
          </>
        )}
        {section === 'security' && data?.panel && (
          <PanelConnectionForm
            key={`connection:${query.receivedAt}`}
            node={node}
            settings={data.panel}
            disabled={disabled || saving}
            onEdit={props.onEdit}
            editDisabled={props.editDisabled}
            onComplete={query.refresh}
          />
        )}
      </ResourceState>
      {menu && data?.panel && (
        <PanelMenuSheet
          node={node}
          settings={data.panel}
          onClose={() => setMenu(false)}
          onComplete={() => {
            setMenu(false)
            query.refresh()
          }}
        />
      )}
    </>
  )
}
