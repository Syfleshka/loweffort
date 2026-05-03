export interface User {
    id: string
    email: string
    username: string
    name: string
    image?: string | null
    emailVerified: boolean
    createdAt: Date
    updatedAt: Date
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
    createdAt: Date
}

export type MatchStatus = 'waiting' | 'active' | 'finished'

export interface Match {
    id: string
    gameId: string
    status: MatchStatus
    state?: unknown
    winnerId?: string | null
    createdAt: Date
}
