import { useState } from 'react'
import Banner from '@douyinfe/semi-ui/lib/es/banner'
import Button from '@douyinfe/semi-ui/lib/es/button'
import Card from '@douyinfe/semi-ui/lib/es/card'
import { Form } from '@douyinfe/semi-ui/lib/es/form'
import SideSheet from '@douyinfe/semi-ui/lib/es/sideSheet'
import Toast from '@douyinfe/semi-ui/lib/es/toast'
import { usePanelMutation } from '../../hooks/usePanelMutation'
import type { NodeConfig } from '../../lib/nodes'
import { changeDatabasePassword, updateDatabaseDescription } from '../../lib/database'
import type { Database, DatabaseEngine, DatabaseInstance } from '../../types/database'
import { formatTimestamp } from '../../utils/formatter'

export function DatabaseDetailSheet({
  node,
  engine,
  instance,
  database,
  onClose,
  onChanged,
}: {
  node: NodeConfig
  engine: DatabaseEngine
  instance: DatabaseInstance
  database: Database
  onClose: () => void
  onChanged: () => void
}) {
  const mutation = usePanelMutation()
  const [revision, setRevision] = useState(0)
  const users = database.authorizedUsers?.length
    ? database.authorizedUsers
    : database.username
      ? [{ username: database.username, host: database.permission || 'localhost' }]
      : []
  return (
    <SideSheet
      visible
      title={database.name}
      width="min(600px, 100vw)"
      onCancel={() => {
        if (!mutation.busy) onClose()
      }}
      closable={!mutation.busy}
      maskClosable={!mutation.busy}
      closeOnEsc={!mutation.busy}
    >
      <div className="space-y-4">
        <Card title="数据库信息">
          <dl className="m-0 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            {[
              ['实例', instance.database],
              ['字符集', database.format || '—'],
              [
                '用户名',
                database.username || users.map((user) => user.username).join('、') || '未绑定',
              ],
              ['创建时间', formatTimestamp(database.createdAt, true)],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-(--semi-color-text-2)">{label}</dt>
                <dd className="mx-0 mt-1 break-all">{value}</dd>
              </div>
            ))}
          </dl>
          <Form<{ description: string }>
            initValues={{ description: database.description }}
            disabled={mutation.busy}
            onSubmit={(values) =>
              void mutation
                .run((signal) =>
                  updateDatabaseDescription(node, engine, database, values.description, signal),
                )
                .then((success) => {
                  if (success) {
                    Toast.success('备注已保存')
                    onChanged()
                  }
                })
            }
          >
            <Form.TextArea field="description" label="备注" maxLength={256} />
            <Button htmlType="submit" loading={mutation.busy}>
              保存备注
            </Button>
          </Form>
        </Card>
        <Card title="修改用户密码">
          <Banner
            type="warning"
            closeIcon={null}
            description="修改后，请同步更新使用此用户的应用连接配置。同一用户关联的其他数据库也会受影响。"
          />
          {(engine === 'mysql' ? users.length > 0 : Boolean(database.username)) ? (
            <Form<{ user: number; password: string; confirmation: string }>
              key={revision}
              initValues={{ user: 0, password: '', confirmation: '' }}
              disabled={mutation.busy}
              autoComplete="off"
              onSubmit={(values) =>
                void mutation
                  .run((signal) =>
                    changeDatabasePassword(
                      node,
                      engine,
                      instance,
                      database,
                      values.password,
                      signal,
                      users[values.user],
                    ),
                  )
                  .then((success) => {
                    if (success) {
                      Toast.success('密码已修改')
                      setRevision((value) => value + 1)
                      onChanged()
                    }
                  })
              }
            >
              {engine === 'mysql' && (
                <Form.Select
                  field="user"
                  label="授权用户"
                  style={{ width: '100%' }}
                  optionList={users.map((user, index) => ({
                    label: `${user.username}@${user.host}`,
                    value: index,
                  }))}
                />
              )}
              <Form.Input
                field="password"
                label="新密码"
                mode="password"
                autoComplete="new-password"
                rules={[{ required: true, message: '请输入新密码' }]}
              />
              <Form.Input
                field="confirmation"
                label="确认新密码"
                mode="password"
                autoComplete="new-password"
                validator={(value, values) =>
                  value && value === values.password ? '' : '两次密码不一致'
                }
              />
              <Button htmlType="submit" theme="solid" loading={mutation.busy}>
                修改密码
              </Button>
            </Form>
          ) : (
            <p className="text-sm text-(--semi-color-text-2)">此数据库尚未绑定用户。</p>
          )}
        </Card>
        {mutation.error && <Banner type="danger" closeIcon={null} description={mutation.error} />}
      </div>
    </SideSheet>
  )
}
