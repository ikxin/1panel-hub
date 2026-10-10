export interface OsInfo {
  os: string
  platform: string
  platformFamily: string
  kernelArch: string
  kernelVersion: string
  prettyDistro: string
  diskSize: number
}

export interface BaseInfo {
  websiteNumber: number
  agentNumber: number
  databaseNumber: number
  cronjobNumber: number
  appInstalledNumber: number
  hostname: string
  os: string
  platform: string
  platformFamily: string
  platformVersion: string
  prettyDistro: string
  kernelArch: string
  kernelVersion: string
  virtualizationSystem: string
  systemProxy: string
  cpuCores: number
  cpuLogicalCores: number
  cpuModelName: string
  cpuMhz: number
  quickJump: QuickJump[] | null
  currentInfo: CurrentInfo
}

export interface QuickJump {
  id: number
  name: string
  alias: string
  title: string
  detail: string
  recommend: number
  isShow: boolean
  router: string
}

export interface CurrentInfo {
  uptime: number
  timeSinceUptime: string
  runningTime: {
    days: number
    hours: number
    minutes: number
    seconds: number
  }
  procs: number
  load1: number
  load5: number
  load15: number
  loadUsagePercent: number
  cpuPercent: number[] | null
  cpuDetailedPercent: number[] | null
  cpuUsedPercent: number
  cpuUsed: number
  cpuTotal: number
  memoryTotal: number
  memoryAvailable: number
  memoryUsed: number
  memoryFree: number
  memoryShard: number
  memoryCache: number
  memoryUsedPercent: number
  swapMemoryTotal: number
  swapMemoryAvailable: number
  swapMemoryUsed: number
  swapMemoryUsedPercent: number
  ioReadBytes: number
  ioWriteBytes: number
  ioCount: number
  ioReadTime: number
  ioWriteTime: number
  diskData: DiskInfo[] | null
  gpuData: GPUInfo[] | null
  npuData: NPUInfo[] | null
  xpuData: XPUInfo[] | null
  topCPUItems: ProcessInfo[] | null
  topMemItems: ProcessInfo[] | null
  netBytesSent: number
  netBytesRecv: number
  shotTime: string
}

export interface DiskInfo {
  path: string
  type: string
  device: string
  total: number
  free: number
  used: number
  usedPercent: number
  inodesTotal: number
  inodesUsed: number
  inodesFree: number
  inodesUsedPercent: number
}

export interface GPUInfo {
  type: string
  index: number
  npuIndex: number
  chipIndex: number
  productName: string
  busID: string
  gpuUtil: string
  temperature: string
  performanceState: string
  powerUsage: string
  powerDraw: string
  maxPowerLimit: string
  memoryUsage: string
  memUsed: string
  memTotal: string
  fanSpeed: string
}

export interface NPUInfo {
  type: string
  index: number
  npuIndex: number
  chipIndex: number
  productName: string
  busID: string
  health: string
  temperature: string
  powerDraw: string
  aiCore: string
  memUsed: string
  memTotal: string
  memoryUsed: string
  memoryTotal: string
  hbmUsed: string
  hbmTotal: string
  hugepagesUsed: string
  hugepagesTotal: string
}

export interface XPUInfo {
  deviceID: number
  deviceName: string
  pciBdfAddress: string
  memory: string
  temperature: string
  gpuUtil: string
  memoryUsed: string
  power: string
  memoryUtil: string
}

export interface ProcessInfo {
  name: string
  pid: number
  percent: number
  memory: number
  cmd: string
  user: string
}
