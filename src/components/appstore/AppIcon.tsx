import Image from '@douyinfe/semi-ui/lib/es/image'
import Spin from '@douyinfe/semi-ui/lib/es/spin'
import { useAppIcon } from '../../hooks/useAppIcon'
import type { NodeConfig } from '../../lib/nodes'

export function AppIcon({
  node,
  appKey,
  name,
}: {
  node: NodeConfig
  appKey: string
  name: string
}) {
  const { source, loading, failed, clearSource } = useAppIcon(node, appKey)

  return (
    <div
      aria-hidden="true"
      title={failed ? `${name}图标暂不可用` : undefined}
      className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-(--semi-border-radius-medium) border border-black/10 bg-white p-1"
    >
      {source && (
        <Image
          src={source}
          alt=""
          width={38}
          height={38}
          preview={false}
          decoding="async"
          className="[&_.semi-image-status]:bg-transparent!"
          imgStyle={{ objectFit: 'contain' }}
          placeholder={<Spin />}
          fallback={<></>}
          onError={clearSource}
        />
      )}
      {loading && <Spin />}
    </div>
  )
}
