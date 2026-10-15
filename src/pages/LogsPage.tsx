import { useState } from 'react'
import Tabs from '@douyinfe/semi-ui/lib/es/tabs'
import type { ModulePageProps } from '../components/management/ResourceLayout'
import { AuditLogsPanel } from '../components/logs/AuditLogsPanel'
import { SystemLogsPanel } from '../components/logs/SystemLogsPanel'

export function LogsPage(props: ModulePageProps) {
  const [tab, setTab] = useState('operation')
  const categories = (
    <div className="w-full overflow-x-auto">
      <Tabs
        type="button"
        activeKey={tab}
        onChange={setTab}
        tabList={[
          { itemKey: 'operation', tab: '操作日志' },
          { itemKey: 'login', tab: '登录日志' },
          { itemKey: 'system', tab: '系统日志' },
        ]}
      />
    </div>
  )
  return (
    <div className="mx-auto flex w-full max-w-400 flex-col gap-5 text-(--semi-color-text-0)">
      {tab === 'system' ? (
        <SystemLogsPanel {...props}>{categories}</SystemLogsPanel>
      ) : (
        <AuditLogsPanel key={tab} {...props} kind={tab === 'login' ? 'login' : 'operation'}>
          {categories}
        </AuditLogsPanel>
      )}
    </div>
  )
}
