import { useState } from 'react'
import { Outlet } from 'react-router'
import Button from '@douyinfe/semi-ui/lib/es/button'
import { Layout } from '@douyinfe/semi-ui/lib/es/layout'
import SideSheet from '@douyinfe/semi-ui/lib/es/sideSheet'
import { IconClose } from '@douyinfe/semi-icons'
import type { PanelSectionKey } from '../../routes/panel'
import { HeaderBrand } from './HeaderBrand'
import { PanelNavigation } from './PanelNavigation'

interface Props {
  nodeName: string
  section?: PanelSectionKey
  mobileMenuOpen: boolean
  onCloseMenu: () => void
}

export function PanelLayout({ nodeName, section, mobileMenuOpen, onCloseMenu }: Props) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <>
      <Layout hasSider style={{ flex: '1 1 0', minHeight: 0, minWidth: 0, overflow: 'hidden' }}>
        <Layout.Sider
          className="hidden md:block"
          breakpoint={['md']}
          onBreakpoint={(_, matches) => setCollapsed(!matches)}
          style={{ flexShrink: 0, overflowY: 'auto' }}
          aria-label="面板导航"
        >
          <PanelNavigation
            nodeName={nodeName}
            section={section}
            collapsed={collapsed}
            onCollapseChange={setCollapsed}
          />
        </Layout.Sider>
        <Layout.Content
          className="p-3 sm:p-6"
          style={{
            minHeight: 0,
            minWidth: 0,
            overflowY: 'auto',
            backgroundColor: 'var(--semi-color-fill-0)',
          }}
        >
          <Outlet />
        </Layout.Content>
      </Layout>
      <SideSheet
        title={
          <HeaderBrand
            control={
              <Button
                theme="borderless"
                type="tertiary"
                icon={<IconClose />}
                style={{ width: 32, height: 32 }}
                aria-label="关闭面板导航"
                onClick={onCloseMenu}
              />
            }
          />
        }
        aria-label="面板导航"
        placement="left"
        width="min(240px, 82vw)"
        closable={false}
        visible={mobileMenuOpen}
        onCancel={onCloseMenu}
        style={{ backgroundColor: 'var(--semi-color-nav-bg)', overflow: 'hidden' }}
        headerStyle={{
          height: 56,
          padding: '0 12px',
          display: 'flex',
          alignItems: 'center',
          boxSizing: 'border-box',
          flexShrink: 0,
          borderBottom: '1px solid var(--semi-color-border)',
        }}
        bodyStyle={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          padding: 0,
          overflow: 'hidden',
        }}
      >
        <PanelNavigation nodeName={nodeName} section={section} onNavigate={onCloseMenu} />
      </SideSheet>
    </>
  )
}
