import { useSearchParams } from 'react-router'
import Tabs from '@douyinfe/semi-ui/lib/es/tabs'
import type { ModulePageProps } from '../components/management/ResourceLayout'
import { GeneralSettingsPanel } from '../components/settings/GeneralSettingsPanel'
import { NotificationsPanel } from '../components/settings/NotificationsPanel'
import { BackupAccountsPanel } from '../components/settings/BackupAccountsPanel'
import { SnapshotsPanel } from '../components/settings/SnapshotsPanel'
import { LicensesPanel } from '../components/settings/LicensesPanel'
import { APIKeysPanel } from '../components/settings/APIKeysPanel'
import { AboutPanel } from '../components/settings/AboutPanel'

const tabs = [
  { itemKey: 'panel', tab: '面板' },
  { itemKey: 'security', tab: '安全' },
  { itemKey: 'notifications', tab: '告警通知' },
  { itemKey: 'backups', tab: '备份账号' },
  { itemKey: 'snapshots', tab: '快照' },
  { itemKey: 'licenses', tab: '许可证' },
  { itemKey: 'api-keys', tab: 'API Key' },
  { itemKey: 'about', tab: '关于' },
]

export function SettingsPage(props: ModulePageProps) {
  const [params, setParams] = useSearchParams()
  const requested = params.get('tab')
  const tab =
    requested === 'monitor'
      ? 'panel'
      : requested === 'host'
        ? 'about'
        : tabs.some((item) => item.itemKey === requested)
          ? requested!
          : 'panel'
  const section =
    tab === 'security'
      ? 'security'
      : requested === 'monitor' || params.get('section') === 'monitor'
        ? 'monitor'
        : 'panel'
  const navigation = (
    <div className="w-full min-w-0 overflow-x-auto">
      <Tabs
        type="button"
        activeKey={tab}
        tabList={tabs}
        onChange={(value) => setParams({ tab: value }, { replace: true })}
      />
    </div>
  )
  const panelProps = { ...props, navigation }
  return (
    <div className="mx-auto flex w-full max-w-400 flex-col gap-5 text-(--semi-color-text-0)">
      {tab === 'panel' || tab === 'security' ? (
        <GeneralSettingsPanel
          key={tab}
          {...panelProps}
          section={section}
          onSectionChange={(value) =>
            setParams(
              value === 'monitor' ? { tab: 'panel', section: 'monitor' } : { tab: 'panel' },
              { replace: true },
            )
          }
        />
      ) : tab === 'notifications' ? (
        <NotificationsPanel {...panelProps} />
      ) : tab === 'backups' ? (
        <BackupAccountsPanel {...panelProps} />
      ) : tab === 'snapshots' ? (
        <SnapshotsPanel {...panelProps} />
      ) : tab === 'licenses' ? (
        <LicensesPanel {...panelProps} />
      ) : tab === 'api-keys' ? (
        <APIKeysPanel {...panelProps} />
      ) : (
        <AboutPanel {...panelProps} />
      )}
    </div>
  )
}
