import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { username } from 'better-auth/plugins'
import { prisma } from './prisma.js'

export const auth = betterAuth({
    database: prismaAdapter(prisma, { provider: 'postgresql' }),
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    trustedOrigins: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [],
    emailAndPassword: {
        enabled: true,
        autoSignIn: true,
    },
    plugins: [
        username({
            minUsernameLength: 3,
            maxUsernameLength: 24,
        }),
    ],
})

export type Session = typeof auth.$Infer.Session
