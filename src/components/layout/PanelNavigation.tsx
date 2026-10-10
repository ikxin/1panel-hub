import Nav from '@douyinfe/semi-ui/lib/es/navigation'
import { useNavigate } from 'react-router'
import { getPanelPath, panelSections } from '../../routes/panel'
import type { PanelSectionKey } from '../../routes/panel'

interface Props {
  nodeName: string
  section?: PanelSectionKey
  collapsed?: boolean
  onCollapseChange?: (collapsed: boolean) => void
  onNavigate?: () => void
}

export function PanelNavigation({
  nodeName,
  section,
  collapsed,
  onCollapseChange,
  onNavigate,
}: Props) {
  const navigate = useNavigate()

  return (
    <Nav
      className="[&_.semi-navigation-footer]:shrink-0 [&_.semi-navigation-header-list-outer]:flex [&_.semi-navigation-header-list-outer]:min-h-0 [&_.semi-navigation-header-list-outer]:flex-col"
      style={{
        width: onCollapseChange ? undefined : '100%',
        height: '100%',
        minHeight: 0,
        backgroundColor: 'transparent',
      }}
      bodyStyle={{ flex: '1 1 0', minHeight: 0, overflowY: 'auto' }}
      isCollapsed={collapsed}
      onCollapseChange={onCollapseChange}
      selectedKeys={section ? [section] : []}
      footer={onCollapseChange ? { collapseButton: true } : undefined}
    >
      {panelSections.map(({ key, title, icon: Icon }) => (
        <Nav.Item
          key={key}
          itemKey={key}
          text={title}
          icon={<Icon />}
          onClick={() => {
            navigate(getPanelPath(nodeName, key))
            onNavigate?.()
          }}
        />
      ))}
    </Nav>
  )
}
