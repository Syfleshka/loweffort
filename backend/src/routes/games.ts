import type { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma.js'

export async function gamesRoutes(app: FastifyInstance) {
    app.get('/games', async () => {
        return prisma.game.findMany({ orderBy: { title: 'asc' } })
    })

    app.get<{ Params: { slug: string } }>('/games/:slug', async (req, reply) => {
        const game = await prisma.game.findUnique({ where: { slug: req.params.slug } })
        if (!game) return reply.code(404).send({ error: 'Game not found' })
        return game
    })
}
