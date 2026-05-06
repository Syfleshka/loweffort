import type { Server, Socket } from 'socket.io'
import { auth } from '../lib/auth.js'
import { registerMatchHandlers } from './match.js'
import { registerTttHandlers } from './ttt.js'

export interface SocketUser {
    id: string
    username: string | null
    name: string
}

declare module 'socket.io' {
    interface Socket {
        user?: SocketUser
    }
}

export function setupSocketServer(io: Server) {
    io.use(async (socket, next) => {
        try {
            const headers = new Headers()
            const cookie = socket.handshake.headers.cookie
            if (cookie) headers.set('cookie', cookie)

            const session = await auth.api.getSession({ headers })
            if (!session) return next(new Error('Unauthorized'))

            socket.user = {
                id: session.user.id,
                username: session.user.username ?? null,
                name: session.user.name,
            }
            next()
        } catch (err) {
            next(err as Error)
        }
    })

    io.on('connection', (socket: Socket) => {
        registerMatchHandlers(io, socket)
        registerTttHandlers(io, socket)
    })
}
