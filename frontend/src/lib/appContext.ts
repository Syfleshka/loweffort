import { createContext, useContext } from 'react'
import type { Theme } from './useTheme'
import type { Lang } from './i18n'
import type { User } from '../types'

export interface Identity {
  id: string
  username: string
  name: string
  isGuest: boolean
}

export interface AppCtx {
  theme: Theme
  setTheme: (t: Theme) => void
  lang: Lang
  setLang: (l: Lang) => void
  user: User | null
  identity: Identity | null
  isAuthLoading: boolean
  refreshSession: () => Promise<void>
  signOut: () => Promise<void>
}

export const Ctx = createContext<AppCtx | null>(null)

export function useApp(): AppCtx {
  const v = useContext(Ctx)
  if (!v) throw new Error('useApp must be used within AppProvider')
  return v
}
