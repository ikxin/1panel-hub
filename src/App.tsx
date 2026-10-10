import { lazy, Suspense, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import Banner from '@douyinfe/semi-ui/lib/es/banner'
import Button from '@douyinfe/semi-ui/lib/es/button'
import Dropdown from '@douyinfe/semi-ui/lib/es/dropdown'
import { Layout } from '@douyinfe/semi-ui/lib/es/layout'
import LocaleProvider from '@douyinfe/semi-ui/lib/es/locale/localeProvider'
import Nav from '@douyinfe/semi-ui/lib/es/navigation'
import SideSheet from '@douyinfe/semi-ui/lib/es/sideSheet'
import Toast from '@douyinfe/semi-ui/lib/es/toast'
import {
  IconClose,
  IconGithubLogo,
  IconHome,
  IconMenu,
  IconMore,
  IconMoon,
  IconServer,
  IconSun,
} from '@douyinfe/semi-icons'
import zhCN from '@douyinfe/semi-ui/lib/es/locale/source/zh_CN'
import { Logo } from './components/Logo'
import { NodeHome } from './components/NodeTable'
import { useNodes } from './hooks/useNodes'
import { useNodeStatus } from './hooks/useNodeStatus'
import { useTheme } from './hooks/useTheme'
import type { NodeConfig } from './lib/nodes'
import { errorMessage, openExternal } from './lib/panel'

const NodeConfigModal = lazy(() =>
  import('./components/NodeConfigModal').then((module) => ({ default: module.NodeConfigModal })),
)
const NodeOverview = lazy(() =>
  import('./components/overview/NodeOverview').then((module) => ({ default: module.NodeOverview })),
)

const mobileMenuButtonStyle = { width: 32, height: 32 }

function HeaderBrand({ control }: { control?: ReactNode }) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      {control}
      <Logo className="h-8 w-24 shrink-0" />
    </div>
  )
}

function readPanelNode(): string | null {
  const route = window.location.hash.match(/^#\/nodes\/([^/]+)\/overview$/)
  try {
    return route ? decodeURIComponent(route[1]) : null
  } catch {
    return null
  }
}

interface PanelLayoutProps {
  children?: ReactNode
}

function PanelLayout({ children }: PanelLayoutProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <Layout hasSider style={{ flex: '1 1 0', minHeight: 0, minWidth: 0, overflow: 'hidden' }}>
      <Layout.Sider
        className="hidden md:block"
        breakpoint={['md']}
        onBreakpoint={(_, matches) => setCollapsed(!matches)}
        style={{ flexShrink: 0, overflowY: 'auto' }}
        aria-label="面板导航"
      >
        <Nav
          style={{ height: '100%' }}
          isCollapsed={collapsed}
          onCollapseChange={setCollapsed}
          selectedKeys={['overview']}
          footer={{ collapseButton: true }}
        >
          <Nav.Item itemKey="overview" text="概览" icon={<IconHome />} />
        </Nav>
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
        {children}
      </Layout.Content>
    </Layout>
  )
}

export function App() {
  const { nodes, storageError, save, remove } = useNodes()
  const { statuses, now } = useNodeStatus(nodes)
  const { dark, toggleTheme } = useTheme()
  const [editor, setEditor] = useState<{ node?: NodeConfig } | null>(null)
  const [panelName, setPanelName] = useState(readPanelNode)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const selectedNode = nodes.find((node) => node.name === panelName)

  useEffect(() => {
    const onHashChange = () => {
      setPanelName(readPanelNode())
      setMobileMenuOpen(false)
    }
    const desktop = matchMedia('(min-width: 768px)')
    const onResize = () => {
      if (desktop.matches) setMobileMenuOpen(false)
    }
    window.addEventListener('hashchange', onHashChange)
    desktop.addEventListener('change', onResize)
    return () => {
      window.removeEventListener('hashchange', onHashChange)
      desktop.removeEventListener('change', onResize)
    }
  }, [])

  const navigate = (name: string | null, replace = false) => {
    const hash = name === null ? '#/' : `#/nodes/${encodeURIComponent(name)}/overview`
    if (replace) window.history.replaceState(null, '', hash)
    else window.location.assign(hash)
    setPanelName(name)
    setMobileMenuOpen(false)
  }

  const saveNode = (node: NodeConfig, originalName?: string) => {
    save(node, originalName)
    if (originalName && panelName === originalName) navigate(node.name.trim(), true)
  }

  const open = (url: string) =>
    void openExternal(url).catch((error) => Toast.error(errorMessage(error)))
  const deleteNode = (node: NodeConfig) => {
    try {
      remove(node.name)
      if (panelName === node.name) navigate(null, true)
    } catch (error) {
      Toast.error(errorMessage(error))
    }
  }

  return (
    <LocaleProvider locale={zhCN}>
      <Layout style={{ height: '100dvh', minHeight: 0, overflow: 'hidden' }}>
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
                          style={mobileMenuButtonStyle}
                          aria-label="打开面板导航"
                          aria-expanded={mobileMenuOpen}
                          onClick={() => setMobileMenuOpen(true)}
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
                                onClick={() => navigate(node.name)}
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
                        onClick={() => navigate(null)}
                      />
                    )}
                    <Button
                      theme="borderless"
                      type="tertiary"
                      icon={dark ? <IconSun /> : <IconMoon />}
                      aria-label={dark ? '浅色' : '深色'}
                      onClick={toggleTheme}
                    />
                    <Button
                      theme="borderless"
                      type="tertiary"
                      icon={<IconGithubLogo />}
                      aria-label="GitHub"
                      onClick={() => open('https://github.com/ikxin/1panel-hub')}
                    />
                  </div>
                  <div className="shrink-0 md:hidden">
                    <Dropdown
                      trigger="click"
                      position="bottomRight"
                      render={
                        <Dropdown.Menu>
                          {selectedNode && (
                            <Dropdown.Item icon={<IconHome />} onClick={() => navigate(null)}>
                              首页
                            </Dropdown.Item>
                          )}
                          <Dropdown.Item
                            icon={dark ? <IconSun /> : <IconMoon />}
                            onClick={toggleTheme}
                          >
                            {dark ? '浅色' : '深色'}
                          </Dropdown.Item>
                          <Dropdown.Item
                            icon={<IconGithubLogo />}
                            onClick={() => open('https://github.com/ikxin/1panel-hub')}
                          >
                            GitHub
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      }
                    >
                      <Button
                        theme="borderless"
                        type="tertiary"
                        icon={<IconMore />}
                        style={mobileMenuButtonStyle}
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
        {selectedNode ? (
          <PanelLayout>
            <Suspense
              fallback={
                <div role="status" className="py-12 text-center text-(--semi-color-text-2)">
                  正在加载概览…
                </div>
              }
            >
              <NodeOverview
                key={selectedNode.name}
                node={selectedNode}
                status={statuses[selectedNode.name]}
                now={now}
                onEdit={() => setEditor({ node: selectedNode })}
                editDisabled={Boolean(storageError)}
              />
            </Suspense>
          </PanelLayout>
        ) : (
          <Layout.Content
            className="p-4 sm:p-8"
            style={{
              minHeight: 0,
              minWidth: 0,
              overflow: 'auto',
              backgroundColor: 'var(--semi-color-fill-0)',
            }}
          >
            {storageError && <Banner type="danger" description={storageError} className="mb-4" />}
            {panelName !== null && (
              <Banner
                type="warning"
                description="该节点已不存在，请选择其他节点。"
                className="mb-4"
              />
            )}
            <NodeHome
              nodes={nodes}
              statuses={statuses}
              now={now}
              onCreate={() => setEditor({})}
              createDisabled={Boolean(storageError)}
              onEdit={(node) => setEditor({ node })}
              onDelete={deleteNode}
              onOpen={(node) => navigate(node.name)}
            />
          </Layout.Content>
        )}
      </Layout>
      {selectedNode && (
        <SideSheet
          title={
            <HeaderBrand
              control={
                <Button
                  theme="borderless"
                  type="tertiary"
                  icon={<IconClose />}
                  style={mobileMenuButtonStyle}
                  aria-label="关闭面板导航"
                  onClick={() => setMobileMenuOpen(false)}
                />
              }
            />
          }
          aria-label="面板导航"
          placement="left"
          width="min(240px, 82vw)"
          closable={false}
          visible={mobileMenuOpen}
          onCancel={() => setMobileMenuOpen(false)}
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
          <Nav
            style={{
              width: '100%',
              flex: '1 1 0',
              minHeight: 0,
              backgroundColor: 'transparent',
              overflowY: 'auto',
            }}
            selectedKeys={['overview']}
          >
            <Nav.Item
              itemKey="overview"
              text="概览"
              icon={<IconHome />}
              onClick={() => setMobileMenuOpen(false)}
            />
          </Nav>
        </SideSheet>
      )}
      {editor && (
        <Suspense fallback={null}>
          <NodeConfigModal node={editor.node} onClose={() => setEditor(null)} onSave={saveNode} />
        </Suspense>
      )}
    </LocaleProvider>
  )
}
