import { useEffect, useState } from 'react'

export function useTheme() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('color-mode') || localStorage.getItem('nuxt-color-mode')
    return (
      saved === 'dark' ||
      ((!saved || saved === 'system') && matchMedia('(prefers-color-scheme: dark)').matches)
    )
  })

  useEffect(() => {
    if (dark) document.body.setAttribute('theme-mode', 'dark')
    else document.body.removeAttribute('theme-mode')
    localStorage.setItem('color-mode', dark ? 'dark' : 'light')
  }, [dark])

  return { dark, toggleTheme: () => setDark((value) => !value) }
}
