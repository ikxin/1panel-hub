import { z } from 'zod'

export const pageSchema = <T>(item: z.ZodType<T>) =>
  z.object({
    total: z.number().int().nonnegative(),
    items: z
      .array(item)
      .nullish()
      .transform((value) => value ?? []),
  })

export interface ResourceSearch {
  page: number
  pageSize: number
  name: string
}
export interface ResourcePage<T> {
  total: number
  items: T[]
}
export const stringList = z
  .array(z.string())
  .nullish()
  .transform((value) => value ?? [])

export function parseResponse<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) throw new Error('节点返回的数据格式不兼容，请检查 1Panel 版本')
  return result.data
}
