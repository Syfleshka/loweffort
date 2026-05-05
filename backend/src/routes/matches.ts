import type { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma.js'
import { requireUser } from '../lib/session.js'

export async function matchesRoutes(app: FastifyInstance) {
    app.post<{ Body: { gameId: string } }>('/matches', async (req, reply) => {
        const user = await requireUser(req)
        const { gameId } = req.body ?? {}
        if (typeof gameId !== 'string') {
            return reply.code(400).send({ error: 'gameId is required' })
        }

        const game = await prisma.game.findUnique({ where: { id: gameId } })
        if (!game) return reply.code(404).send({ error: 'Game not found' })

        return prisma.match.create({
            data: {
                gameId,
                status: 'waiting',
                players: { create: { userId: user.id } },
            },
            include: { players: true },
        })
    })

    app.get<{ Params: { id: string } }>('/matches/:id', async (req, reply) => {
        const match = await prisma.match.findUnique({
            where: { id: req.params.id },
            include: {
                players: {
                    include: {
                        user: { select: { id: true, username: true, displayUsername: true, name: true, image: true } },
                    },
                },
                game: true,
            },
        })
        if (!match) return reply.code(404).send({ error: 'Match not found' })
        return match
    })

    app.post<{ Params: { id: string } }>('/matches/:id/join', async (req, reply) => {
        const user = await requireUser(req)
        const match = await prisma.match.findUnique({
            where: { id: req.params.id },
            include: { game: true, players: true },
        })
        if (!match) return reply.code(404).send({ error: 'Match not found' })
        if (match.status !== 'waiting') return reply.code(409).send({ error: 'Match already started' })
        if (match.players.length >= match.game.maxPlayers) {
            return reply.code(409).send({ error: 'Match is full' })
        }
        if (match.players.some((p) => p.userId === user.id)) {
            return reply.code(409).send({ error: 'Already joined' })
        }

        await prisma.matchPlayer.create({
            data: { matchId: match.id, userId: user.id },
        })

        return prisma.match.findUnique({
            where: { id: match.id },
            include: { players: true },
        })
    })

    app.post<{ Params: { id: string }; Body: { winnerId?: string; state?: unknown } }>(
        '/matches/:id/finish',
        async (req, reply) => {
            const user = await requireUser(req)
            const { winnerId, state } = req.body ?? {}

            const match = await prisma.match.findUnique({
                where: { id: req.params.id },
                include: { players: true },
            })
            if (!match) return reply.code(404).send({ error: 'Match not found' })
            if (match.status === 'finished') return reply.code(409).send({ error: 'Match already finished' })
            if (!match.players.some((p) => p.userId === user.id)) {
                return reply.code(403).send({ error: 'Not a participant' })
            }
            if (winnerId && !match.players.some((p) => p.userId === winnerId)) {
                return reply.code(400).send({ error: 'Winner must be a participant' })
            }

            return prisma.match.update({
                where: { id: match.id },
                data: {
                    status: 'finished',
                    winnerId: winnerId ?? null,
                    state: state === undefined ? undefined : (state as never),
                },
                include: { players: true },
            })
        },
    )
}
