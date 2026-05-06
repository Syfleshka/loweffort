import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useTheme } from './useTheme'
import { useLang } from './useLang'
import { Ctx } from './appContext'
import { fetchSession, logout as authLogout } from './auth'
import type { User } from '../types'

// `undefined` = session fetch in flight; `null` = unauthenticated; `User` = signed in.
type UserState = User | null | undefined

export function AppProvider({ children }: { children: ReactNode }) {
  const { theme, setTheme } = useTheme()
  const { lang, setLang } = useLang()
  const [user, setUser] = useState<UserState>(undefined)

  const refreshSession = useCallback(async () => {
    const session = await fetchSession()
    setUser(session?.user ?? null)
  }, [])

  const signOut = useCallback(async () => {
    await authLogout()
    setUser(null)
  }, [])

  useEffect(() => {
    let cancelled = false
    fetchSession().then((session) => {
      if (!cancelled) setUser(session?.user ?? null)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <Ctx.Provider
      value={{
        theme,
        setTheme,
        lang,
        setLang,
        user: user ?? null,
        isAuthLoading: user === undefined,
        refreshSession,
        signOut,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}
