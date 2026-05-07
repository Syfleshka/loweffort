import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useTheme } from './useTheme'
import { useLang } from './useLang'
import { Ctx, type Identity } from './appContext'
import { fetchIdentity, fetchSession, logout as authLogout } from './auth'
import type { User } from '../types'

// `undefined` = first identity fetch in flight; `null` = nothing yet; `User` = signed in.
type UserState = User | null | undefined

export function AppProvider({ children }: { children: ReactNode }) {
  const { theme, setTheme } = useTheme()
  const { lang, setLang } = useLang()
  const [user, setUser] = useState<UserState>(undefined)
  const [identity, setIdentity] = useState<Identity | null>(null)

  const refreshSession = useCallback(async () => {
    const [session, ident] = await Promise.all([fetchSession(), fetchIdentity()])
    setUser(session?.user ?? null)
    setIdentity(ident)
  }, [])

  const signOut = useCallback(async () => {
    await authLogout()
    setUser(null)
    // After signing out the backend issues a fresh guest cookie on the next call.
    const ident = await fetchIdentity()
    setIdentity(ident)
  }, [])

  useEffect(() => {
    let cancelled = false
    Promise.all([fetchSession(), fetchIdentity()]).then(([session, ident]) => {
      if (cancelled) return
      setUser(session?.user ?? null)
      setIdentity(ident)
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
        identity,
        isAuthLoading: user === undefined,
        refreshSession,
        signOut,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}
