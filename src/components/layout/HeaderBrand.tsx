import type { ReactNode } from 'react'
import { Logo } from '../Logo'

export function HeaderBrand({ control }: { control?: ReactNode }) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      {control}
      <Logo className="h-8 w-24 shrink-0" />
    </div>
  )
}
