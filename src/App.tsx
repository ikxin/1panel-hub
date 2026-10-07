import { lazy, Suspense, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import Banner from '@douyinfe/semi-ui/lib/es/banner'
import Button from '@douyinfe/semi-ui/lib/es/button'
import { Layout } from '@douyinfe/semi-ui/lib/es/layout'
import LocaleProvider from '@douyinfe/semi-ui/lib/es/locale/localeProvider'
import Nav from '@douyinfe/semi-ui/lib/es/navigation'
import Select from '@douyinfe/semi-ui/lib/es/select'
import SideSheet from '@douyinfe/semi-ui/lib/es/sideSheet'
import Toast from '@douyinfe/semi-ui/lib/es/toast'
import { IconArrowLeft, IconClose, IconGithubLogo, IconHome, IconMenu, IconMoon, IconSun } from '@douyinfe/semi-icons'
import zhCN from '@douyinfe/semi-ui/lib/es/locale/source/zh_CN'
import { Logo } from './components/Logo'
import { NodeHome, NodeOverview } from './components/NodeTable'
import { useNodes } from './hooks/useNodes'
import { useNodeStatus } from './hooks/useNodeStatus'
import { useTheme } from './hooks/useTheme'
import type { NodeConfig } from './lib/nodes'
import { errorMessage, openExternal } from './lib/panel'

const NodeConfigModal = lazy(() =>
  import('./components/NodeConfigModal').then((module) => ({ default: module.NodeConfigModal })),
)

const hubHeaderStyle = {
  height: 'var(--hub-header-height, 60px)',
  padding: '0 var(--hub-header-padding, 24px)',
}
const mobileMenuButtonStyle = { width: 32, height: 32 }

function HeaderBrand({ control }: { control?: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      {control}
      <Logo className="h-8 w-24 md:h-10 md:w-30" />
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
  onBack: () => void
  children: ReactNode
}

function PanelLayout({ onBack, children }: PanelLayoutProps) {
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
          <Nav.Item itemKey="nodes" text="返回节点列表" icon={<IconArrowLeft />} onClick={onBack} />
        </Nav>
      </Layout.Sider>
      <Layout.Content
        className="p-3 sm:p-6"
        style={{ minHeight: 0, minWidth: 0, overflowY: 'auto' }}
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
    else window.location.hash = hash
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
            className="hub-header"
            style={hubHeaderStyle}
            header={{
              logo: (
                <HeaderBrand
                  control={selectedNode && (
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
                  )}
                />
              ),
            }}
            footer={
              <div className="flex items-center gap-1 sm:gap-2">
                <Button
                  theme="borderless"
                  type="tertiary"
                  icon={dark ? <IconSun /> : <IconMoon />}
                  aria-label={dark ? '切换浅色模式' : '切换深色模式'}
                  onClick={toggleTheme}
                />
                <Button
                  theme="borderless"
                  type="tertiary"
                  icon={<IconGithubLogo />}
                  aria-label="GitHub 项目"
                  onClick={() => open('https://github.com/ikxin/1panel-hub')}
                />
              </div>
            }
          />
        </Layout.Header>
        {selectedNode ? (
          <PanelLayout onBack={() => navigate(null)}>
            <NodeOverview
              node={selectedNode}
              status={statuses[selectedNode.name]}
              now={now}
              actions={
                <>
                  <div className="min-w-0 flex-1 md:w-48 md:flex-none">
                    <Select<string>
                      insetLabel="节点"
                      value={selectedNode.name}
                      style={{ width: '100%' }}
                      optionList={nodes.map((node) => ({ label: node.name, value: node.name }))}
                      onChange={(name) => {
                        if (typeof name === 'string') navigate(name)
                      }}
                    />
                  </div>
                  <Button className="shrink-0" onClick={() => setEditor({ node: selectedNode })}>
                    编辑节点
                  </Button>
                </>
              }
            />
          </PanelLayout>
        ) : (
          <Layout.Content
            className="p-4 sm:p-8"
            style={{ minHeight: 0, minWidth: 0, overflow: 'auto', backgroundColor: 'var(--semi-color-fill-0)' }}
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
          className="hub-header"
          aria-label="面板导航"
          placement="left"
          width="min(260px, 82vw)"
          closable={false}
          visible={mobileMenuOpen}
          onCancel={() => setMobileMenuOpen(false)}
          style={{ backgroundColor: 'var(--semi-color-nav-bg)', overflow: 'hidden' }}
          headerStyle={{
            ...hubHeaderStyle,
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
            padding: 12,
            overflow: 'hidden',
          }}
        >
          <Nav
            style={{
              width: '100%',
              flex: '1 1 0',
              minHeight: 0,
              padding: 0,
              borderRight: 0,
              backgroundColor: 'transparent',
              overflowY: 'auto',
            }}
            bodyStyle={{ padding: 0 }}
            selectedKeys={['overview']}
          >
            <Nav.Item
              itemKey="overview"
              text="概览"
              icon={<IconHome />}
              style={{ height: 44, alignItems: 'center' }}
              onClick={() => setMobileMenuOpen(false)}
            />
          </Nav>
          <div
            style={{
              paddingTop: 12,
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
              borderTop: '1px solid var(--semi-color-border)',
            }}
          >
            <Nav
              style={{ width: '100%', padding: 0, borderRight: 0, backgroundColor: 'transparent' }}
              bodyStyle={{ padding: 0 }}
              selectedKeys={[]}
            >
              <Nav.Item
                itemKey="nodes"
                text="返回节点列表"
                icon={<IconArrowLeft />}
                style={{ height: 32, padding: '6px 12px', alignItems: 'center' }}
                onClick={() => navigate(null)}
              />
            </Nav>
          </div>
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
