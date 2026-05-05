// Mirror of backend/src/types/index.ts. Source of truth lives there;
// keep this file in sync when shared types change.

export interface User {
    id: string
    email: string
    username: string
    name: string
    image?: string | null
    emailVerified: boolean
    createdAt: string
    updatedAt: string
}

export interface Game {
    id: string
    slug: string
    title: string
    description?: string | null
    thumbnail?: string | null
    maxPlayers: number
}

export interface Score {
    id: string
    userId: string
    gameId: string
    score: number
    createdAt: string
}

export type MatchStatus = 'waiting' | 'active' | 'finished'

export interface Match {
    id: string
    gameId: string
    status: MatchStatus
    state?: unknown
    winnerId?: string | null
    createdAt: string
}
