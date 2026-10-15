import { useCallback, useState } from 'react'
import Banner from '@douyinfe/semi-ui/lib/es/banner'
import Button from '@douyinfe/semi-ui/lib/es/button'
import { Form } from '@douyinfe/semi-ui/lib/es/form'
import SideSheet from '@douyinfe/semi-ui/lib/es/sideSheet'
import Spin from '@douyinfe/semi-ui/lib/es/spin'
import { ResourceForm } from '../management/ResourceForm'
import { CronSchedulePreview } from './CronSchedulePreview'
import { usePanelQuery } from '../../hooks/usePanelQuery'
import { fetchCronjob, saveCronjob } from '../../lib/cronjob'
import type { NodeConfig } from '../../lib/nodes'
import { creatableCronjobTypes, cronjobTypeLabels } from '../../types/cronjob'
import type { CronjobDetail, CronjobValues } from '../../types/cronjob'

interface Props {
  node: NodeConfig
  id?: number
  onClose: () => void
  onComplete: () => void
}
export function CronjobFormSheet(props: Props) {
  const { node, id } = props
  const load = useCallback((signal: AbortSignal) => fetchCronjob(node, id!, signal), [node, id])
  const detail = usePanelQuery(JSON.stringify([node, id]), load, { enabled: id !== undefined })
  if (id !== undefined && !detail.data)
    return (
      <SideSheet visible title="编辑计划任务" width="min(600px, 100vw)" onCancel={props.onClose}>
        {detail.loading ? (
          <div className="py-12 text-center">
            <Spin />
          </div>
        ) : (
          <Banner
            type="danger"
            description={
              <>
                {detail.error}
                <Button theme="borderless" onClick={detail.refresh}>
                  重试
                </Button>
              </>
            }
          />
        )}
      </SideSheet>
    )
  return <CronjobForm {...props} original={detail.data} />
}
function CronjobForm({
  node,
  original,
  onClose,
  onComplete,
}: Props & { original?: CronjobDetail }) {
  const [type, setType] = useState(original?.type ?? 'shell')
  const [spec, setSpec] = useState(original?.spec ?? '0 2 * * *')
  const inlineScript = !original || original.scriptMode === 'input'
  return (
    <ResourceForm<CronjobValues>
      title={original ? '编辑计划任务' : '创建计划任务'}
      initialValues={{
        name: original?.name ?? '',
        type,
        spec,
        script: original?.script ?? '',
        executor: original?.executor || 'bash',
        url: original?.url.replaceAll(',', '\n') ?? '',
        retainCopies: original?.retainCopies ?? 7,
        retryTimes: original?.retryTimes ?? 0,
        timeout: original?.timeout ?? 3600,
        scopes: original?.scopes ?? [],
      }}
      onSubmit={(values, signal) => saveCronjob(node, values, original, signal)}
      onClose={onClose}
      onComplete={onComplete}
    >
      <Form.Input
        field="name"
        label="任务名称"
        maxLength={128}
        placeholder="例如 每日健康检查"
        rules={[{ required: true, message: '请输入任务名称' }]}
      />
      <Form.Select
        field="type"
        label="任务类型"
        disabled={Boolean(original)}
        onChange={(value) => setType(String(value))}
        style={{ width: '100%' }}
        optionList={[
          ...new Set([...creatableCronjobTypes, ...(original ? [original.type] : [])]),
        ].map((value) => ({ label: cronjobTypeLabels[value] ?? value, value }))}
      />
      <Form.Input
        field="spec"
        label="执行周期"
        onChange={setSpec}
        placeholder="0 2 * * *"
        extraText="依次为分、时、日、月、周；例如 0 2 * * * 表示每天 02:00。多个周期使用 && 分隔。"
        rules={[{ required: true, message: '请输入 Cron 表达式' }]}
      />
      <CronSchedulePreview node={node} spec={spec} />
      {type === 'shell' &&
        (inlineScript ? (
          <>
            <Form.Select
              field="executor"
              label="解释器"
              style={{ width: '100%' }}
              optionList={[
                ...new Set([
                  'bash',
                  'sh',
                  'python3',
                  ...(original?.executor ? [original.executor] : []),
                ]),
              ].map((value) => ({ label: value, value }))}
            />
            <Form.TextArea
              field="script"
              label="脚本内容"
              rows={8}
              autosize={{ minRows: 8, maxRows: 18 }}
              placeholder="填写在节点执行的脚本"
              rules={[{ required: true, message: '请输入脚本内容' }]}
            />
            <Banner
              type="info"
              closeIcon={null}
              description={
                original?.containerName
                  ? `脚本将在容器「${String(original.containerName)}」中执行。`
                  : `脚本在节点上执行，用户为 ${original?.user || '面板服务默认用户'}。保存后按周期自动运行。`
              }
            />
          </>
        ) : (
          <Banner
            type="info"
            closeIcon={null}
            description={`此任务使用${original.scriptMode === 'library' ? '脚本库' : '脚本文件'}。这里可调整名称、周期和执行策略，原有脚本来源与参数会保留。`}
          />
        ))}
      {type === 'curl' && (
        <Form.TextArea
          field="url"
          label="访问地址"
          rows={4}
          placeholder="每行填写一个 HTTP / HTTPS 地址"
          rules={[{ required: true, message: '请输入访问地址' }]}
        />
      )}
      {type === 'ntp' && (
        <Banner type="info" closeIcon={null} description="按节点配置的 NTP 服务器同步系统时间。" />
      )}
      {type === 'cleanLog' && (
        <>
          <Banner
            type="warning"
            closeIcon={null}
            description="此任务会按周期清空所选日志，请确认已保存需要保留的记录。"
          />
          <Form.CheckboxGroup
            field="scopes"
            label="清理范围"
            options={[{ label: '网站日志', value: 'website' }]}
            rules={[{ required: true, message: '请选择清理范围' }]}
          />
        </>
      )}
      {!creatableCronjobTypes.some((item) => item === type) && (
        <Banner
          type="info"
          closeIcon={null}
          description="这里可调整此任务的名称、周期和执行策略，已有备份目标和任务内容会保留。"
        />
      )}
      <div className="grid gap-x-4 sm:grid-cols-3">
        <Form.InputNumber
          field="retainCopies"
          label="保留份数"
          min={1}
          max={10000}
          precision={0}
          style={{ width: '100%' }}
          rules={[{ required: true, message: '请填写保留份数' }]}
        />
        <Form.InputNumber
          field="retryTimes"
          label="失败重试次数"
          min={0}
          max={20}
          precision={0}
          style={{ width: '100%' }}
          rules={[{ required: true, message: '请填写重试次数' }]}
        />
        <Form.InputNumber
          field="timeout"
          label="超时（秒）"
          min={1}
          max={604800}
          precision={0}
          style={{ width: '100%' }}
          rules={[{ required: true, message: '请填写超时时间' }]}
        />
      </div>
    </ResourceForm>
  )
}
