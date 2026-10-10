import Card from '@douyinfe/semi-ui/lib/es/card'
import Empty from '@douyinfe/semi-ui/lib/es/empty'
import type { PanelSection } from '../routes/panel'

export function PanelModulePage({ section }: { section: PanelSection }) {
  const Icon = section.icon

  return (
    <div className="mx-auto w-full max-w-400 text-(--semi-color-text-0)">
      <Card title={section.title} style={{ minWidth: 0 }}>
        <div className="px-2 py-12 sm:py-20">
          <Empty
            image={<Icon size="extra-large" />}
            title={`${section.title}功能待接入`}
            description="后续将在这里提供该节点的管理功能。"
          />
        </div>
      </Card>
    </div>
  )
}
