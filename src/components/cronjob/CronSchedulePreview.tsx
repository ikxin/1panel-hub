import { useCallback, useEffect, useState } from 'react'
import { usePanelQuery } from '../../hooks/usePanelQuery'
import { previewCronSchedule } from '../../lib/cronjob'
import type { NodeConfig } from '../../lib/nodes'

export function CronSchedulePreview({ node, spec }: { node: NodeConfig; spec: string }) {
  const [debounced, setDebounced] = useState('')
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(spec.trim()), 500)
    return () => window.clearTimeout(timer)
  }, [spec])
  const load = useCallback(
    (signal: AbortSignal) => previewCronSchedule(node, debounced, signal),
    [node, debounced],
  )
  const query = usePanelQuery(JSON.stringify([node, debounced]), load, {
    enabled: Boolean(node.apiKey && debounced),
  })
  return (
    <div className="mb-4 rounded-lg bg-(--semi-color-fill-0) p-3 text-xs leading-6" role="status">
      <span className="text-(--semi-color-text-2)">接下来的执行时间（节点时区）</span>
      {spec.trim() !== debounced || query.loading ? (
        <p className="m-0">正在解析执行周期…</p>
      ) : query.error ? (
        <p className="m-0 text-(--semi-color-danger)">{query.error}</p>
      ) : query.data?.length ? (
        <div className="mt-1 flex flex-wrap gap-x-4 font-mono">
          {query.data.slice(0, 3).map((time) => (
            <span key={time}>{time}</span>
          ))}
        </div>
      ) : (
        <p className="m-0">填写执行周期后显示</p>
      )}
    </div>
  )
}
