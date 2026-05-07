import { randomBytes, createHash } from 'crypto'

export interface GuestIdentity {
    id: string
    username: string
    name: string
    isGuest: true
}

export const GUEST_COOKIE = 'guest_id'
export const GUEST_COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days
const RAW_RE = /^[a-f0-9]{32}$/

export function isValidGuestId(raw: string | undefined | null): raw is string {
    return typeof raw === 'string' && RAW_RE.test(raw)
}

export function newGuestId(): string {
    return randomBytes(16).toString('hex')
}

export function guestIdentity(rawId: string): GuestIdentity {
    const num = parseInt(createHash('sha1').update(rawId).digest('hex').slice(0, 4), 16) % 10000
    const display = `Гость ${num.toString().padStart(4, '0')}`
    return { id: `guest:${rawId}`, username: display, name: display, isGuest: true }
}

export function parseGuestIdFromCookieHeader(cookieHeader: string | undefined): string | null {
    if (!cookieHeader) return null
    for (const part of cookieHeader.split(/;\s*/)) {
        if (!part.startsWith(`${GUEST_COOKIE}=`)) continue
        const value = decodeURIComponent(part.slice(GUEST_COOKIE.length + 1))
        return isValidGuestId(value) ? value : null
    }
    return null
}
