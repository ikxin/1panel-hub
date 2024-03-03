import http from '@/api'

export const loginApi = (params: any) => {
  return http.post('/auth/login', params)
}
