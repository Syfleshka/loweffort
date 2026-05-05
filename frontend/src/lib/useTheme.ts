import { useCallback, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'

const isTheme = (v: unknown): v is Theme => v === 'light' || v === 'dark'

const readStored = (): Theme | null => {
  if (typeof localStorage === 'undefined') return null
  const v = localStorage.getItem(STORAGE_KEY)
  return isTheme(v) ? v : null
}

const systemTheme = (): Theme =>
  typeof window !== 'undefined' && window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light'

const applyTheme = (theme: Theme) => {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.classList.toggle('light', theme === 'light')
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => readStored() ?? systemTheme())
  const [isExplicit, setIsExplicit] = useState<boolean>(() => readStored() !== null)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    if (isExplicit) return
    const mq = window.matchMedia(DARK_QUERY)
    const onChange = () => setTheme(mq.matches ? 'dark' : 'light')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [isExplicit])

  const set = useCallback((next: Theme) => {
    localStorage.setItem(STORAGE_KEY, next)
    setIsExplicit(true)
    setTheme(next)
  }, [])

  return { theme, setTheme: set }
}
