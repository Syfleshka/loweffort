import type { Server, Socket } from 'socket.io'
import { auth } from '../lib/auth.js'
import { guestIdentity, parseGuestIdFromCookieHeader } from '../lib/guest.js'
import { registerMatchHandlers } from './match.js'
import { registerTttHandlers } from './ttt.js'
import { registerBsHandlers } from './battleships.js'

export interface SocketUser {
    id: string
    username: string | null
    name: string
    isGuest: boolean
}

declare module 'socket.io' {
    interface Socket {
        user?: SocketUser
    }
}

export function setupSocketServer(io: Server) {
    io.use(async (socket, next) => {
        try {
            const cookie = socket.handshake.headers.cookie
            const headers = new Headers()
            if (cookie) headers.set('cookie', cookie)

            const session = await auth.api.getSession({ headers })
            if (session) {
                socket.user = {
                    id: session.user.id,
                    username: session.user.username ?? null,
                    name: session.user.name,
                    isGuest: false,
                }
                return next()
            }

            // Fall back to guest cookie. The frontend calls GET /api/me before
            // opening the socket, which guarantees the cookie is set.
            const rawGuest = parseGuestIdFromCookieHeader(cookie)
            if (!rawGuest) return next(new Error('Unauthorized'))
            const guest = guestIdentity(rawGuest)
            socket.user = {
                id: guest.id,
                username: guest.username,
                name: guest.name,
                isGuest: true,
            }
            next()
        } catch (err) {
            next(err as Error)
        }
    })

    io.on('connection', (socket: Socket) => {
        registerMatchHandlers(io, socket)
        registerTttHandlers(io, socket)
        registerBsHandlers(io, socket)
    })
}
