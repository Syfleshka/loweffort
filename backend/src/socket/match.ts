import type { Server, Socket } from 'socket.io'
import { prisma } from '../lib/prisma.js'

const room = (matchId: string) => `match:${matchId}`

export function registerMatchHandlers(io: Server, socket: Socket) {
    socket.on('match:join', async (matchId: string, ack?: (res: unknown) => void) => {
        if (!socket.user) return ack?.({ ok: false, error: 'Unauthorized' })
        const match = await prisma.match.findUnique({
            where: { id: matchId },
            include: { players: true },
        })
        if (!match) return ack?.({ ok: false, error: 'Match not found' })
        if (!match.players.some((p) => p.userId === socket.user!.id)) {
            return ack?.({ ok: false, error: 'Not a participant' })
        }

        await socket.join(room(matchId))
        socket.to(room(matchId)).emit('match:peer-joined', {
            userId: socket.user.id,
            username: socket.user.username,
        })
        ack?.({ ok: true })
    })

    socket.on('match:leave', async (matchId: string) => {
        await socket.leave(room(matchId))
        if (socket.user) {
            socket.to(room(matchId)).emit('match:peer-left', { userId: socket.user.id })
        }
    })

    socket.on('match:move', (payload: { matchId: string; move: unknown }) => {
        if (!socket.user || !payload?.matchId) return
        socket.to(room(payload.matchId)).emit('match:move', {
            from: socket.user.id,
            move: payload.move,
        })
    })

    socket.on('match:state', (payload: { matchId: string; state: unknown }) => {
        if (!socket.user || !payload?.matchId) return
        socket.to(room(payload.matchId)).emit('match:state', {
            from: socket.user.id,
            state: payload.state,
        })
    })
}
