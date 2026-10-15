import { useState } from 'react'
import { z } from 'zod'
import { Form } from '@douyinfe/semi-ui/lib/es/form'
import Banner from '@douyinfe/semi-ui/lib/es/banner'
import { ResourceForm } from '../management/ResourceForm'
import { errorMessage, panelRequest } from '../../lib/panel'
import type { NodeConfig } from '../../lib/nodes'
import type { PanelSettings } from '../../types/settings'
import { parseResponse } from '../../types/management'

interface MenuItem extends Record<string, unknown> {
  label: string
  title: string
  isShow: boolean
  children?: MenuItem[]
}
const menuSchema: z.ZodType<MenuItem> = z.lazy(() =>
  z.looseObject({
    label: z.string(),
    title: z.string().default(''),
    isShow: z.boolean(),
    children: z.array(menuSchema).optional(),
  }),
)
const menuLabels: Record<string, string> = {
  home: '概览',
  app: '应用商店',
  apps: '应用商店',
  ai: 'AI',
  website: '网站',
  websites: '网站',
  database: '数据库',
  databases: '数据库',
  container: '容器',
  containers: '容器',
  system: '系统',
  terminal: '终端',
  cronjob: '计划任务',
  cron: '计划任务',
  toolbox: '工具箱',
  xpack: '高级功能',
  setting: '面板设置',
  settings: '面板设置',
  log: '日志审计',
  logs: '日志审计',
  monitor: '监控',
  file: '文件',
  files: '文件',
  firewall: '防火墙',
  ssh: 'SSH',
  host: '主机',
  process: '进程',
  runtime: '运行环境',
  certificate: '证书',
  ssl: '证书',
  node: '节点',
  gpu: 'GPU',
}
function flattenMenus(
  items: MenuItem[],
  parent = '',
): { value: string; label: string; disabled: boolean; checked: boolean }[] {
  return items.flatMap((item) => {
    const name = item.label.toLowerCase().replace(/-menu$/, '')
    const title =
      menuLabels[name] ||
      menuLabels[item.title.split('.').at(-1)?.toLowerCase() ?? ''] ||
      item.label.replace(/-Menu$/, '')
    const label = parent ? `${parent} / ${title}` : title
    return [
      {
        value: item.label,
        label,
        disabled: ['Home-Menu', 'App-Menu', 'Setting-Menu'].includes(item.label),
        checked: item.isShow,
      },
      ...flattenMenus(item.children ?? [], label),
    ]
  })
}
function updateMenus(items: MenuItem[], visible: string[]): MenuItem[] {
  return items.map((item) => ({
    ...item,
    isShow:
      ['Home-Menu', 'App-Menu', 'Setting-Menu'].includes(item.label) ||
      visible.includes(item.label),
    ...(item.children ? { children: updateMenus(item.children, visible) } : {}),
  }))
}
export function PanelMenuSheet({
  node,
  settings,
  onClose,
  onComplete,
}: {
  node: NodeConfig
  settings: PanelSettings
  onClose: () => void
  onComplete: () => void
}) {
  const [{ menus, error }] = useState(() => {
    try {
      return {
        menus: parseResponse(z.array(menuSchema), JSON.parse(settings.hideMenu || '[]')),
        error: '',
      }
    } catch (error) {
      return { menus: [] as MenuItem[], error: errorMessage(error) }
    }
  })
  const options = flattenMenus(menus)
  return (
    <ResourceForm<{ visible: string[] }>
      title="菜单设置"
      initialValues={{ visible: options.filter((item) => item.checked).map((item) => item.value) }}
      disabled={!menus.length}
      onClose={onClose}
      onComplete={onComplete}
      onSubmit={async (values, signal) => {
        if (!menus.length) throw new Error('未读取到节点菜单配置，请刷新后重试')
        await panelRequest(node, '/core/settings/menu/update', signal, {
          method: 'POST',
          body: { key: 'HideMenu', value: JSON.stringify(updateMenus(menus, values.visible)) },
        })
      }}
    >
      <Form.CheckboxGroup
        field="visible"
        label="显示的菜单"
        direction="vertical"
        options={options.map(({ value, label, disabled }) => ({ value, label, disabled }))}
      />
      {error && <Banner type="danger" closeIcon={null} description={error} />}
    </ResourceForm>
  )
}
