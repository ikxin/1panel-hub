import { z } from 'zod'
import type { NodeConfig } from './nodes'
import { panelRequest } from './panel'
import { parseResponse } from '../types/management'
import { certificateSchema, websiteHttpsSchema } from '../types/website'
import type { WebsiteHttps, WebsiteHttpsValues } from '../types/website'

export async function fetchWebsiteHttps(node: NodeConfig, id: number, signal: AbortSignal) {
  const [config, certificates] = await Promise.all([
    panelRequest(node, `/websites/${id}/https`, signal),
    panelRequest(node, '/websites/ssl/list', signal, { method: 'POST', body: {} }),
  ])
  return {
    config: parseResponse(websiteHttpsSchema, config),
    certificates: (parseResponse(z.array(certificateSchema).nullable(), certificates) ?? []).filter(
      (item) => item.pem && new Date(item.expireDate).getTime() > Date.now(),
    ),
  }
}
export async function updateWebsiteHttps(
  node: NodeConfig,
  id: number,
  config: WebsiteHttps,
  values: WebsiteHttpsValues,
  signal: AbortSignal,
) {
  if (values.enable && !values.websiteSSLId) throw new Error('请选择有效证书')
  await panelRequest(node, `/websites/${id}/https`, signal, {
    method: 'POST',
    timeoutMs: 40000,
    body: {
      ...values,
      websiteId: id,
      type: 'existed',
      httpConfig: values.httpConfig || config.httpConfig || 'HTTPToHTTPS',
      SSLProtocol: config.SSLProtocol?.length ? config.SSLProtocol : ['TLSv1.3', 'TLSv1.2'],
      algorithm:
        config.algorithm ||
        'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-SHA384:ECDHE-RSA-AES128-SHA256:!aNULL:!eNULL:!EXPORT:!DSS:!DES:!RC4:!3DES:!MD5:!PSK:!KRB5:!SRP:!CAMELLIA:!SEED',
      hsts: values.enable && config.hsts,
      hstsIncludeSubDomains: values.enable && config.hstsIncludeSubDomains,
      http3: values.enable && config.http3,
      httpsPorts: config.httpsPort
        ? config.httpsPort
            .split(',')
            .map(Number)
            .filter((port) => Number.isInteger(port) && port > 0 && port <= 65535)
        : [],
    },
  })
}
