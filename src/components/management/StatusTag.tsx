import Tag from '@douyinfe/semi-ui/lib/es/tag'

const labels: Record<string, string> = {
  Success: '成功',
  Done: '已完成',
  Failed: '失败',
  Running: '执行中',
  Waiting: '等待中',
  Pending: '待处理',
  Enable: '已启用',
  Disable: '已停用',
  Canceled: '已取消',
  Timeout: '已超时',
  Unexecuted: '未执行',
}
export function StatusTag({ status }: { status: string }) {
  const color = ['Success', 'Done', 'Enable'].includes(status)
    ? 'green'
    : ['Failed', 'Timeout'].includes(status)
      ? 'red'
      : ['Running', 'Waiting', 'Pending'].includes(status)
        ? 'blue'
        : 'grey'
  return (
    <Tag size="small" color={color}>
      {labels[status] ?? (status || '暂无记录')}
    </Tag>
  )
}
