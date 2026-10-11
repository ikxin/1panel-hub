import { useEffect, useState } from 'react'
import { clearAppIcon, loadAppIcon } from '../lib/appIcons'
import type { NodeConfig } from '../lib/nodes'

export function useAppIcon(node: NodeConfig, appKey: string) {
  const [image, setImage] = useState<{
    node: NodeConfig
    appKey: string
    url: string
    failed: boolean
  } | null>(null)

  useEffect(() => {
    let active = true
    let url = ''
    setImage(null)
    loadAppIcon(node, appKey)
      .then((blob) => {
        if (!active) return
        url = URL.createObjectURL(blob)
        setImage({ node, appKey, url, failed: false })
      })
      .catch(() => {
        if (active) setImage({ node, appKey, url: '', failed: true })
      })
    return () => {
      active = false
      if (url) URL.revokeObjectURL(url)
    }
  }, [node, appKey])

  const current = image?.node === node && image.appKey === appKey ? image : null

  return {
    source: current?.url || '',
    loading: !current,
    failed: current?.failed || false,
    clearSource: () => {
      clearAppIcon(node, appKey)
      if (current?.url) URL.revokeObjectURL(current.url)
      setImage({ node, appKey, url: '', failed: true })
    },
  }
}
