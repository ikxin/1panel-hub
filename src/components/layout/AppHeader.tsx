import Button from '@douyinfe/semi-ui/lib/es/button'
import Dropdown from '@douyinfe/semi-ui/lib/es/dropdown'
import { Layout } from '@douyinfe/semi-ui/lib/es/layout'
import Nav from '@douyinfe/semi-ui/lib/es/navigation'
import {
  IconGithubLogo,
  IconHome,
  IconMenu,
  IconMore,
  IconMoon,
  IconServer,
  IconSun,
} from '@douyinfe/semi-icons'
import type { NodeConfig } from '../../lib/nodes'
import { HeaderBrand } from './HeaderBrand'

interface Props {
  nodes: NodeConfig[]
  selectedNode?: NodeConfig
  dark: boolean
  mobileMenuOpen: boolean
  onOpenMenu: () => void
  onSelectNode: (node: NodeConfig) => void
  onHome: () => void
  onToggleTheme: () => void
  onOpenGithub: () => void
}

export function AppHeader({
  nodes,
  selectedNode,
  dark,
  mobileMenuOpen,
  onOpenMenu,
  onSelectNode,
  onHome,
  onToggleTheme,
  onOpenGithub,
}: Props) {
  return (
    <Layout.Header>
      <Nav
        mode="horizontal"
        style={{ height: 56, padding: '0 12px' }}
        header={{
          style: { marginRight: 0 },
          logo: (
            <HeaderBrand
              control={
                selectedNode && (
                  <div className="md:hidden">
                    <Button
                      theme="borderless"
                      type="tertiary"
                      icon={<IconMenu />}
                      style={{ width: 32, height: 32 }}
                      aria-label="打开面板导航"
                      aria-expanded={mobileMenuOpen}
                      onClick={onOpenMenu}
                    />
                  </div>
                )
              }
            />
          ),
        }}
        footer={{
          style: { padding: 0, minWidth: 0 },
          children: (
            <div className="flex min-w-0 items-center gap-1 sm:gap-2">
              {selectedNode && (
                <div className="hidden min-w-0 md:block">
                  <Dropdown
                    trigger="click"
                    position="bottomRight"
                    showTick
                    render={
                      <Dropdown.Menu className="max-h-80 min-w-40 max-w-[calc(100vw-24px)] overflow-y-auto">
                        {nodes.map((node) => (
                          <Dropdown.Item
                            key={node.name}
                            active={node.name === selectedNode.name}
                            onClick={() => onSelectNode(node)}
                          >
                            <span className="truncate" title={node.name}>
                              {node.name}
                            </span>
                          </Dropdown.Item>
                        ))}
                      </Dropdown.Menu>
                    }
                  >
                    <Button
                      theme="borderless"
                      type="tertiary"
                      icon={<IconServer />}
                      style={{ padding: '0 8px' }}
                      aria-label="切换节点"
                      aria-haspopup="menu"
                      title={selectedNode.name}
                    >
                      <span className="max-w-36 truncate">{selectedNode.name}</span>
                    </Button>
                  </Dropdown>
                </div>
              )}
              <div className="hidden shrink-0 items-center gap-2 md:flex">
                {selectedNode && (
                  <Button
                    theme="borderless"
                    type="tertiary"
                    icon={<IconHome />}
                    aria-label="首页"
                    title="首页"
                    onClick={onHome}
                  />
                )}
                <Button
                  theme="borderless"
                  type="tertiary"
                  icon={dark ? <IconSun /> : <IconMoon />}
                  aria-label={dark ? '浅色' : '深色'}
                  onClick={onToggleTheme}
                />
                <Button
                  theme="borderless"
                  type="tertiary"
                  icon={<IconGithubLogo />}
                  aria-label="GitHub"
                  onClick={onOpenGithub}
                />
              </div>
              <div className="shrink-0 md:hidden">
                <Dropdown
                  trigger="click"
                  position="bottomRight"
                  render={
                    <Dropdown.Menu>
                      {selectedNode && (
                        <Dropdown.Item icon={<IconHome />} onClick={onHome}>
                          首页
                        </Dropdown.Item>
                      )}
                      <Dropdown.Item
                        icon={dark ? <IconSun /> : <IconMoon />}
                        onClick={onToggleTheme}
                      >
                        {dark ? '浅色' : '深色'}
                      </Dropdown.Item>
                      <Dropdown.Item icon={<IconGithubLogo />} onClick={onOpenGithub}>
                        GitHub
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  }
                >
                  <Button
                    theme="borderless"
                    type="tertiary"
                    icon={<IconMore />}
                    style={{ width: 32, height: 32 }}
                    aria-label="更多操作"
                    aria-haspopup="menu"
                  />
                </Dropdown>
              </div>
            </div>
          ),
        }}
      />
    </Layout.Header>
  )
}
