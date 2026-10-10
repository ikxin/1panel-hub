import { lazy, Suspense, useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router'
import Banner from '@douyinfe/semi-ui/lib/es/banner'
import { Layout } from '@douyinfe/semi-ui/lib/es/layout'
import LocaleProvider from '@douyinfe/semi-ui/lib/es/locale/localeProvider'
import Toast from '@douyinfe/semi-ui/lib/es/toast'
import zhCN from '@douyinfe/semi-ui/lib/es/locale/source/zh_CN'
import { AppHeader } from './components/layout/AppHeader'
import { PanelLayout } from './components/layout/PanelLayout'
import { NodeHome } from './components/NodeTable'
import { useNodes } from './hooks/useNodes'
import { useNodeStatus } from './hooks/useNodeStatus'
import { useTheme } from './hooks/useTheme'
import type { NodeConfig } from './lib/nodes'
import { errorMessage, openExternal } from './lib/panel'
import { NotFoundPage } from './pages/NotFoundPage'
import { PanelModulePage } from './pages/PanelModulePage'
import { getPanelPath, getPanelRoute, panelSections } from './routes/panel'

const NodeConfigModal = lazy(() =>
  import('./components/NodeConfigModal').then((module) => ({ default: module.NodeConfigModal })),
)
const NodeOverview = lazy(() =>
  import('./components/overview/NodeOverview').then((module) => ({ default: module.NodeOverview })),
)

export function App() {
  const { nodes, storageError, save, remove } = useNodes()
  const { statuses, now } = useNodeStatus(nodes)
  const { dark, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const panelRoute = getPanelRoute(location.pathname)
  const panelName = panelRoute?.nodeName
  const selectedNode = nodes.find((node) => node.name === panelName)
  const section = panelRoute?.section
  const dashboardPath = selectedNode ? getPanelPath(selectedNode.name) : '/'
  const [editor, setEditor] = useState<{ node?: NodeConfig } | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const desktop = matchMedia('(min-width: 768px)')
    const onResize = () => {
      if (desktop.matches) setMobileMenuOpen(false)
    }
    desktop.addEventListener('change', onResize)
    return () => desktop.removeEventListener('change', onResize)
  }, [])

  const saveNode = (node: NodeConfig, originalName?: string) => {
    save(node, originalName)
    if (originalName && panelName === originalName) {
      navigate(getPanelPath(node.name.trim(), section), { replace: true })
    }
  }

  const deleteNode = (node: NodeConfig) => {
    try {
      remove(node.name)
      if (panelName === node.name) navigate('/', { replace: true })
    } catch (error) {
      Toast.error(errorMessage(error))
    }
  }

  const nodeHome = (
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
      {panelRoute && !selectedNode && (
        <Banner
          type="warning"
          description="该节点不存在或地址无效，请选择其他节点。"
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
        onOpen={(node) => navigate(getPanelPath(node.name))}
      />
    </Layout.Content>
  )

  return (
    <LocaleProvider locale={zhCN}>
      <Layout style={{ height: '100dvh', minHeight: 0, overflow: 'hidden' }}>
        <AppHeader
          nodes={nodes}
          selectedNode={selectedNode}
          dark={dark}
          mobileMenuOpen={mobileMenuOpen}
          onOpenMenu={() => setMobileMenuOpen(true)}
          onSelectNode={(node) => navigate(getPanelPath(node.name, section))}
          onHome={() => navigate('/')}
          onToggleTheme={toggleTheme}
          onOpenGithub={() =>
            void openExternal('https://github.com/ikxin/1panel-hub').catch((error) =>
              Toast.error(errorMessage(error)),
            )
          }
        />
        <Routes>
          <Route path="/" element={nodeHome} />
          <Route
            path="/nodes/:nodeName"
            element={
              selectedNode ? (
                <PanelLayout
                  nodeName={selectedNode.name}
                  section={section}
                  mobileMenuOpen={mobileMenuOpen}
                  onCloseMenu={() => setMobileMenuOpen(false)}
                />
              ) : (
                nodeHome
              )
            }
          >
            <Route index element={<Navigate to={dashboardPath} replace />} />
            <Route path="overview" element={<Navigate to={dashboardPath} replace />} />
            <Route
              path="dashboard"
              element={
                selectedNode && (
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
                )
              }
            />
            {panelSections
              .filter((item) => item.key !== 'dashboard')
              .map((item) => (
                <Route
                  key={item.key}
                  path={item.key}
                  element={<PanelModulePage section={item} />}
                />
              ))}
            <Route path="*" element={<NotFoundPage homePath={dashboardPath} />} />
          </Route>
          <Route
            path="*"
            element={
              <Layout.Content
                className="p-4 sm:p-8"
                style={{
                  minHeight: 0,
                  minWidth: 0,
                  overflow: 'auto',
                  backgroundColor: 'var(--semi-color-fill-0)',
                }}
              >
                <NotFoundPage />
              </Layout.Content>
            }
          />
        </Routes>
      </Layout>
      {editor && (
        <Suspense fallback={null}>
          <NodeConfigModal node={editor.node} onClose={() => setEditor(null)} onSave={saveNode} />
        </Suspense>
      )}
    </LocaleProvider>
  )
}
