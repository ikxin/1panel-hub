import { Form } from '@douyinfe/semi-ui/lib/es/form'
import Banner from '@douyinfe/semi-ui/lib/es/banner'
import { ResourceForm } from '../management/ResourceForm'
import type { NodeConfig } from '../../lib/nodes'
import { createDatabase } from '../../lib/database'
import type { DatabaseCreateValues, DatabaseEngine, DatabaseInstance } from '../../types/database'

export function DatabaseCreateSheet({
  node,
  engine,
  instance,
  onClose,
  onComplete,
}: {
  node: NodeConfig
  engine: DatabaseEngine
  instance: DatabaseInstance
  onClose: () => void
  onComplete: () => void
}) {
  return (
    <ResourceForm<DatabaseCreateValues>
      title="创建数据库"
      initialValues={{
        name: '',
        username: '',
        password: '',
        format: engine === 'postgresql' ? 'UTF8' : 'utf8mb4',
        permission: engine === 'mongodb' ? 'readWrite' : 'localhost',
        description: '',
      }}
      onClose={onClose}
      onComplete={onComplete}
      onSubmit={(values, signal) => createDatabase(node, engine, instance, values, signal)}
    >
      <Banner
        type="info"
        closeIcon={null}
        description={`在实例「${instance.database}」中创建数据库和访问用户。`}
      />
      <Form.Input
        field="name"
        label="数据库名称"
        placeholder="my_database"
        maxLength={63}
        rules={[{ required: true, message: '请输入数据库名称' }]}
      />
      <Form.Input
        field="username"
        label="用户名"
        placeholder="my_user"
        maxLength={32}
        rules={[{ required: true, message: '请输入用户名' }]}
      />
      <Form.Input
        field="password"
        label="密码"
        mode="password"
        autoComplete="new-password"
        rules={[{ required: true, message: '请输入密码' }]}
      />
      {engine !== 'mongodb' && (
        <Form.Select
          field="format"
          label="字符集"
          style={{ width: '100%' }}
          optionList={(engine === 'postgresql'
            ? ['UTF8', 'SQL_ASCII', 'LATIN1']
            : ['utf8mb4', 'utf8', 'latin1', 'ascii']
          ).map((value) => ({ label: value, value }))}
        />
      )}
      {engine === 'mysql' && (
        <Form.Select
          field="permission"
          label="访问来源"
          style={{ width: '100%' }}
          optionList={[
            { label: '仅本机（localhost）', value: 'localhost' },
            { label: '任意来源（%）', value: '%' },
          ]}
          extraText="容器内应用访问通常需要任意来源，并由防火墙限制网络访问。"
        />
      )}
      {engine === 'mongodb' && (
        <Form.Select
          field="permission"
          label="访问权限"
          style={{ width: '100%' }}
          optionList={[
            { label: '读写', value: 'readWrite' },
            { label: '只读', value: 'read' },
          ]}
        />
      )}
      <Form.TextArea field="description" label="备注" maxLength={256} />
    </ResourceForm>
  )
}
