import { api } from './api'
import type { User } from '../types'

export const USERNAME_RE = /^[a-zA-Z0-9_-]{3,24}$/
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const MIN_PASSWORD_LENGTH = 8

export interface SessionResponse {
  user: User
  session: { id: string; expiresAt: string }
}

export async function fetchSession(): Promise<SessionResponse | null> {
  try {
    const { data } = await api.get<SessionResponse | null>('/auth/get-session')
    return data
  } catch {
    return null
  }
}

export interface IdentityResponse {
  id: string
  username: string
  name: string
  isGuest: boolean
}

export async function fetchIdentity(): Promise<IdentityResponse | null> {
  try {
    const { data } = await api.get<IdentityResponse>('/me')
    return data
  } catch {
    return null
  }
}

interface RegisterInput {
  username: string
  email?: string
  password: string
}

export async function register(input: RegisterInput): Promise<{ user: User }> {
  // better-auth requires an email in the schema. If the user didn't supply one,
  // synthesize a non-routable placeholder so we don't have to fork the plugin.
  // The `.local` TLD is reserved (RFC 6762) and cannot be addressed.
  const email = input.email?.trim() || `${input.username.toLowerCase()}@noemail.local`
  const { data } = await api.post<{ user: User }>('/auth/sign-up/email', {
    email,
    password: input.password,
    name: input.username,
    username: input.username,
  })
  return data
}

export async function login(identifier: string, password: string): Promise<{ user: User }> {
  if (identifier.includes('@')) {
    const { data } = await api.post<{ user: User }>('/auth/sign-in/email', {
      email: identifier,
      password,
    })
    return data
  }
  const { data } = await api.post<{ user: User }>('/auth/sign-in/username', {
    username: identifier,
    password,
  })
  return data
}

export async function logout(): Promise<void> {
  await api.post('/auth/sign-out')
}

// Heuristic to map better-auth error responses to UI buckets.
export type AuthErrorKind = 'taken' | 'invalid_credentials' | 'rate_limited' | 'generic'

export function classifyAuthError(err: unknown): AuthErrorKind {
  const e = err as { response?: { status?: number; data?: { code?: string; message?: string } } }
  const status = e?.response?.status
  const code = e?.response?.data?.code
  if (code === 'USER_ALREADY_EXISTS' || code === 'USERNAME_IS_ALREADY_TAKEN') return 'taken'
  if (status === 422 || status === 409) return 'taken'
  if (code === 'INVALID_EMAIL_OR_PASSWORD' || status === 401) return 'invalid_credentials'
  if (status === 429) return 'rate_limited'
  return 'generic'
}
