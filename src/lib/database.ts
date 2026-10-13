import { z } from 'zod'
import type { NodeConfig } from './nodes'
import { panelRequest } from './panel'
import { pageSchema, parseResponse } from '../types/management'
import type { ResourceSearch } from '../types/management'
import { databaseInstanceSchema, databaseSchema, redisStatusSchema } from '../types/database'
import type {
  Database,
  DatabaseCreateValues,
  DatabaseEngine,
  DatabaseInstance,
} from '../types/database'

function databasePath(engine: DatabaseEngine) {
  return engine === 'mysql'
    ? '/databases'
    : engine === 'postgresql'
      ? '/databases/pg'
      : `/databases/${engine}`
}
function encodePassword(password: string) {
  return btoa(
    Array.from(new TextEncoder().encode(password), (byte) => String.fromCharCode(byte)).join(''),
  )
}

export async function fetchDatabaseInstances(
  node: NodeConfig,
  engine: DatabaseEngine,
  signal: AbortSignal,
) {
  const types =
    engine === 'mysql'
      ? 'mysql,mariadb,mysql-cluster'
      : engine === 'postgresql'
        ? 'postgresql,postgresql-cluster'
        : engine === 'redis'
          ? 'redis,redis-cluster'
          : engine
  return (
    parseResponse(
      z.array(databaseInstanceSchema).nullable(),
      await panelRequest(node, `/databases/db/list/${types}`, signal),
    ) ?? []
  )
}
export async function searchDatabases(
  node: NodeConfig,
  engine: DatabaseEngine,
  instance: DatabaseInstance,
  search: ResourceSearch,
  signal: AbortSignal,
) {
  const result = parseResponse(
    pageSchema(databaseSchema),
    await panelRequest(node, `${databasePath(engine)}/search`, signal, {
      method: 'POST',
      body: {
        page: search.page,
        pageSize: search.pageSize,
        info: search.name,
        database: instance.database,
        orderBy: 'createdAt',
        order: 'descending',
      },
    }),
  )
  if (engine === 'mysql' && result.items.length) {
    const users = parseResponse(
      z.record(
        z.string(),
        z.array(z.object({ username: z.string(), host: z.string() })).nullable(),
      ),
      await panelRequest(node, '/databases/grants/summary', signal, {
        method: 'POST',
        body: { database: instance.database, dbs: result.items.map((item) => item.name) },
      }),
    )
    result.items = result.items.map((item) => ({
      ...item,
      authorizedUsers: users[item.name] ?? [],
    }))
  }
  return result
}
export async function createDatabase(
  node: NodeConfig,
  engine: DatabaseEngine,
  instance: DatabaseInstance,
  values: DatabaseCreateValues,
  signal: AbortSignal,
) {
  if (!/^[a-zA-Z][a-zA-Z0-9_]{0,62}$/.test(values.name))
    throw new Error('数据库名称需以字母开头，仅包含字母、数字和下划线，最多 63 位')
  if (!/^[a-zA-Z][a-zA-Z0-9_]{0,31}$/.test(values.username))
    throw new Error('用户名需以字母开头，仅包含字母、数字和下划线，最多 32 位')
  if (!values.password) throw new Error('请输入密码')
  await panelRequest(node, databasePath(engine), signal, {
    method: 'POST',
    timeoutMs: 40000,
    body: {
      ...values,
      database: instance.database,
      from: instance.from,
      password: encodePassword(values.password),
      superUser: false,
      collation: '',
    },
  })
}
export async function syncDatabases(
  node: NodeConfig,
  engine: DatabaseEngine,
  instance: DatabaseInstance,
  signal: AbortSignal,
) {
  const path =
    engine === 'postgresql'
      ? `/databases/pg/${encodeURIComponent(instance.database)}/load`
      : `${databasePath(engine)}/load`
  await panelRequest(node, path, signal, {
    method: 'POST',
    timeoutMs: 60000,
    body: { database: instance.database, from: instance.from, type: instance.type },
  })
}
export async function deleteDatabase(
  node: NodeConfig,
  engine: DatabaseEngine,
  instance: DatabaseInstance,
  database: Database,
  signal: AbortSignal,
) {
  const body = { id: database.id, type: instance.type, database: instance.database }
  const dependencies =
    parseResponse(
      z.array(z.union([z.string(), z.object({ name: z.string(), type: z.string() })])).nullable(),
      await panelRequest(node, `${databasePath(engine)}/del/check`, signal, {
        method: 'POST',
        body,
      }),
    ) ?? []
  if (dependencies.length)
    throw new Error(
      `请先解除资源引用：${dependencies.map((item) => (typeof item === 'string' ? item : item.name)).join('、')}`,
    )
  await panelRequest(node, `${databasePath(engine)}/del`, signal, {
    method: 'POST',
    timeoutMs: 40000,
    body: { ...body, forceDelete: false, deleteBackup: false },
  })
}
export async function updateDatabaseDescription(
  node: NodeConfig,
  engine: DatabaseEngine,
  database: Database,
  description: string,
  signal: AbortSignal,
) {
  const suffix = engine === 'mysql' ? '/description/update' : '/description'
  await panelRequest(node, `${databasePath(engine)}${suffix}`, signal, {
    method: 'POST',
    body: { id: database.id, description },
  })
}
export async function fetchRedisStatus(
  node: NodeConfig,
  instance: DatabaseInstance,
  signal: AbortSignal,
) {
  return parseResponse(
    redisStatusSchema,
    await panelRequest(node, '/databases/redis/status', signal, {
      method: 'POST',
      body: { type: instance.type, name: instance.database },
    }),
  )
}
export async function changeRedisPassword(
  node: NodeConfig,
  instance: DatabaseInstance,
  password: string,
  signal: AbortSignal,
) {
  if (!password) throw new Error('密码不能为空')
  await panelRequest(node, '/databases/redis/password', signal, {
    method: 'POST',
    body: { database: instance.database, value: encodePassword(password) },
  })
}

export async function changeDatabasePassword(
  node: NodeConfig,
  engine: DatabaseEngine,
  instance: DatabaseInstance,
  database: Database,
  password: string,
  signal: AbortSignal,
  user?: { username: string; host: string },
) {
  if (!password) throw new Error('密码不能为空')
  const encoded = encodePassword(password)
  if (engine === 'mysql') {
    if (!user) throw new Error('请选择授权用户')
    await panelRequest(node, '/databases/users/password', signal, {
      method: 'POST',
      timeoutMs: 40000,
      body: { database: instance.database, ...user, password: encoded },
    })
  } else if (engine === 'mongodb') {
    await panelRequest(node, '/databases/mongodb/password', signal, {
      method: 'POST',
      timeoutMs: 40000,
      body: { database: instance.database, name: database.name, password: encoded },
    })
  } else {
    await panelRequest(node, '/databases/pg/password', signal, {
      method: 'POST',
      timeoutMs: 40000,
      body: {
        id: database.id,
        database: instance.database,
        from: database.from,
        type: instance.type,
        value: encoded,
      },
    })
  }
}
