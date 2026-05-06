import type { ReactNode } from 'react'
import { useTheme } from './useTheme'
import { useLang } from './useLang'
import { Ctx } from './appContext'

export function AppProvider({ children }: { children: ReactNode }) {
  const { theme, setTheme } = useTheme()
  const { lang, setLang } = useLang()
  return <Ctx.Provider value={{ theme, setTheme, lang, setLang }}>{children}</Ctx.Provider>
}
