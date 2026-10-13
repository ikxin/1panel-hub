import type { ContainerCreateValues, ContainerResource } from '../types/container'

export const containerStates = [
  { value: 'running', label: '运行中' },
  { value: 'exited', label: '已停止' },
  { value: 'paused', label: '已暂停' },
  { value: 'restarting', label: '重启中' },
  { value: 'created', label: '已创建' },
  { value: 'removing', label: '删除中' },
  { value: 'dead', label: '异常' },
]
export function containerStatus(state: string) {
  return {
    label: containerStates.find((item) => item.value === state)?.label ?? state,
    color:
      state === 'running'
        ? ('green' as const)
        : ['exited', 'created'].includes(state)
          ? ('grey' as const)
          : ('orange' as const),
  }
}
export function resourceName(resource: ContainerResource) {
  return resource.kind === 'image'
    ? resource.data.tags[0] || resource.data.id.slice(0, 19)
    : resource.data.name
}
export function resourceId(resource: ContainerResource) {
  return resource.kind === 'container'
    ? resource.data.containerID
    : resource.kind === 'volume'
      ? resource.data.name
      : resource.data.id
}
export function textLines(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}
export function containerCreateBody(values: ContainerCreateValues) {
  if (!/^[a-z\d][a-z\d_.-]*$/i.test(values.name))
    throw new Error('容器名称仅支持字母、数字、点、下划线和连字符')
  if (!values.image.trim() || /\s/.test(values.image.trim()))
    throw new Error('请输入有效的镜像名称')
  const exposedPorts = textLines(values.ports).map((line) => {
    const match = /^(?:(\d{1,3}(?:\.\d{1,3}){3}):)?(\d+):(\d+)(?:\/(tcp|udp))?$/.exec(line)
    if (
      !match ||
      [Number(match[2]), Number(match[3])].some((port) => port < 1 || port > 65535) ||
      match[1]?.split('.').some((part) => Number(part) > 255)
    )
      throw new Error(`端口映射无效：${line}`)
    return {
      hostIP: match[1] || '0.0.0.0',
      hostPort: match[2],
      containerPort: match[3],
      protocol: match[4] || 'tcp',
    }
  })
  if (values.network === 'host' && exposedPorts.length)
    throw new Error('主机网络不支持端口映射，请清空映射后提交')
  const volumes = textLines(values.volumes).map((line) => {
    const parts = line.split(':')
    const [sourceDir, containerDir, mode = 'rw'] = parts
    if (
      parts.length < 2 ||
      parts.length > 3 ||
      !sourceDir ||
      !containerDir.startsWith('/') ||
      !['ro', 'rw'].includes(mode)
    )
      throw new Error(`挂载格式无效：${line}`)
    if (!sourceDir.startsWith('/') && !/^[a-z\d][a-z\d_.-]*$/i.test(sourceDir))
      throw new Error(`请输入绝对路径或存储卷名称：${sourceDir}`)
    return { type: sourceDir.startsWith('/') ? 'bind' : 'volume', sourceDir, containerDir, mode }
  })
  const env = textLines(values.env)
  if (env.some((line) => !/^[A-Za-z_][A-Za-z0-9_]*=/.test(line)))
    throw new Error('环境变量请使用 KEY=value 格式，每行一个')
  if (
    !Number.isFinite(values.memory) ||
    values.memory < 0 ||
    !Number.isFinite(values.cpus) ||
    values.cpus < 0
  )
    throw new Error('资源限制不能为负数')
  return {
    name: values.name,
    image: values.image.trim(),
    forcePull: values.forcePull,
    networks: [{ network: values.network, ipv4: '', ipv6: '' }],
    restartPolicy: values.restartPolicy,
    exposedPorts,
    volumes,
    env,
    memory: values.memory,
    nanoCPUs: values.cpus,
    privileged: false,
    autoRemove: false,
    publishAllPorts: false,
    cmd: [],
    entrypoint: [],
    labels: [],
    dns: [],
    extraHosts: [],
  }
}
export function formatInspect(value: string) {
  try {
    return JSON.stringify(JSON.parse(value), null, 2)
  } catch {
    return value
  }
}
