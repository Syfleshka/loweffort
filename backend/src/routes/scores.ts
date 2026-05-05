import type { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma.js'
import { requireUser } from '../lib/session.js'

export async function scoresRoutes(app: FastifyInstance) {
    app.post<{ Body: { gameId: string; score: number } }>('/scores', async (req, reply) => {
        const user = await requireUser(req)
        const { gameId, score } = req.body ?? {}

        if (typeof gameId !== 'string' || typeof score !== 'number' || !Number.isFinite(score)) {
            return reply.code(400).send({ error: 'gameId (string) and score (number) are required' })
        }

        const game = await prisma.game.findUnique({ where: { id: gameId } })
        if (!game) return reply.code(404).send({ error: 'Game not found' })

        return prisma.score.create({
            data: { userId: user.id, gameId, score: Math.trunc(score) },
        })
    })

    app.get<{ Params: { gameSlug: string }; Querystring: { limit?: string } }>(
        '/scores/:gameSlug',
        async (req, reply) => {
            const game = await prisma.game.findUnique({ where: { slug: req.params.gameSlug } })
            if (!game) return reply.code(404).send({ error: 'Game not found' })

            const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100)

            return prisma.score.findMany({
                where: { gameId: game.id },
                orderBy: [{ score: 'desc' }, { createdAt: 'asc' }],
                take: limit,
                include: {
                    user: { select: { id: true, username: true, displayUsername: true, name: true, image: true } },
                },
            })
        },
    )

    app.get<{ Params: { gameSlug: string } }>('/scores/:gameSlug/me', async (req, reply) => {
        const user = await requireUser(req)
        const game = await prisma.game.findUnique({ where: { slug: req.params.gameSlug } })
        if (!game) return reply.code(404).send({ error: 'Game not found' })

        return prisma.score.findFirst({
            where: { gameId: game.id, userId: user.id },
            orderBy: { score: 'desc' },
        })
    })
}
