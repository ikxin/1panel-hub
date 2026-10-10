export interface MonitorSample {
  timestamp: number
  cpu?: number
  memory?: number
  load1?: number
  load5?: number
  load15?: number
  networkSent?: number
  networkRecv?: number
  diskRead?: number
  diskWrite?: number
}

export type MonitorKind = 'usage' | 'load' | 'network' | 'io'
