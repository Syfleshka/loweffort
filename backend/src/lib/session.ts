import type { FastifyRequest } from 'fastify'
import { auth, type Session } from './auth.js'

export async function getSession(request: FastifyRequest): Promise<Session | null> {
    const headers = new Headers()
    for (const [key, value] of Object.entries(request.headers)) {
        if (typeof value === 'string') headers.set(key, value)
        else if (Array.isArray(value)) headers.set(key, value.join(','))
    }
    return auth.api.getSession({ headers })
}

export async function requireUser(request: FastifyRequest): Promise<Session['user']> {
    const session = await getSession(request)
    if (!session) {
        const err = new Error('Unauthorized') as Error & { statusCode?: number }
        err.statusCode = 401
        throw err
    }
    return session.user
}
