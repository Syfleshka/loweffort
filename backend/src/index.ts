import Fastify from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import { Server } from 'socket.io'

const app = Fastify({ logger: true })

await app.register(cors, {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    credentials: true,
})

await app.register(cookie)

app.get('/api/health', async () => {
    return { status: 'ok' }
})

const io = new Server(app.server, {
    cors: {
        origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
        credentials: true,
    },
})

io.on('connection', (socket) => {
    console.log('User connected:', socket.id)
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id)
    })
})

const port = Number(process.env.PORT) || 3000
await app.listen({ port, host: '0.0.0.0' })