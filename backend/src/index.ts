import Fastify from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import { Server } from 'socket.io'
import { auth } from './lib/auth.js'
import {
    GUEST_COOKIE,
    GUEST_COOKIE_MAX_AGE,
    guestIdentity,
    isValidGuestId,
    newGuestId,
} from './lib/guest.js'
import { setupSocketServer } from './socket/index.js'
import { gamesRoutes } from './routes/games.js'
import { scoresRoutes } from './routes/scores.js'
import { matchesRoutes } from './routes/matches.js'

const app = Fastify({ logger: true })

const frontendOrigin = process.env.FRONTEND_URL ?? 'http://localhost:5173'

await app.register(cors, {
    origin: frontendOrigin,
    credentials: true,
})

await app.register(cookie)

app.get('/api/health', async () => ({ status: 'ok' }))

// Effective identity for the current request: real user if signed in, else
// a stable in-cookie guest. Used by the frontend to render UI and to match
// the player id reported by the socket server in game state.
app.get('/api/me', async (request, reply) => {
    const headers = new Headers()
    for (const [key, value] of Object.entries(request.headers)) {
        if (typeof value === 'string') headers.set(key, value)
        else if (Array.isArray(value)) headers.set(key, value.join(','))
    }
    const session = await auth.api.getSession({ headers })
    if (session) {
        return {
            id: session.user.id,
            username: session.user.username ?? null,
            name: session.user.name,
            isGuest: false,
        }
    }

    let raw = request.cookies[GUEST_COOKIE]
    if (!isValidGuestId(raw)) {
        raw = newGuestId()
        reply.setCookie(GUEST_COOKIE, raw, {
            path: '/',
            maxAge: GUEST_COOKIE_MAX_AGE,
            httpOnly: true,
            sameSite: 'lax',
        })
    }
    const guest = guestIdentity(raw)
    return { id: guest.id, username: guest.username, name: guest.name, isGuest: true }
})

app.route({
    method: ['GET', 'POST'],
    url: '/api/auth/*',
    async handler(request, reply) {
        const url = new URL(request.url, `http://${request.headers.host}`)
        const headers = new Headers()
        for (const [key, value] of Object.entries(request.headers)) {
            if (typeof value === 'string') headers.set(key, value)
            else if (Array.isArray(value)) headers.set(key, value.join(','))
        }

        const response = await auth.handler(
            new Request(url, {
                method: request.method,
                headers,
                body:
                    request.method === 'GET' || request.method === 'HEAD'
                        ? undefined
                        : JSON.stringify(request.body),
            }),
        )

        reply.status(response.status)
        response.headers.forEach((value, key) => {
            reply.header(key, value)
        })
        reply.send(response.body ? await response.text() : null)
    },
})

await app.register(
    async (instance) => {
        await instance.register(gamesRoutes)
        await instance.register(scoresRoutes)
        await instance.register(matchesRoutes)
    },
    { prefix: '/api' },
)

app.setErrorHandler((err: Error & { statusCode?: number }, _req, reply) => {
    const status = err.statusCode ?? 500
    if (status >= 500) app.log.error(err)
    reply.code(status).send({ error: err.message })
})

const io = new Server(app.server, {
    cors: { origin: frontendOrigin, credentials: true },
})
setupSocketServer(io)

const port = Number(process.env.PORT) || 3000
await app.listen({ port, host: '0.0.0.0' })
