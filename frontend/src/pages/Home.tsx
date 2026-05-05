import { useEffect, useState } from 'react'
import type { Game } from '../types'
import { fetchGames } from '../lib/api'
import { useTheme } from '../lib/useTheme'
import { useLang } from '../lib/useLang'
import { t } from '../lib/i18n'
import { TopBar } from '../components/TopBar'
import { Footer } from '../components/Footer'
import { GameCard, GameCardSkeleton } from '../components/GameCard'

export default function Home() {
  const { theme, setTheme } = useTheme()
  const { lang, setLang } = useLang()
  const [games, setGames] = useState<Game[] | null>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchGames()
      .then((data) => {
        if (!cancelled) setGames(data)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)))
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar lang={lang} />

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-14 pt-14 pb-24 max-[920px]:px-7">
        <section id="all">
          {error ? (
            <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-fg-3">
              {t(lang, 'state_error')}
            </p>
          ) : games === null ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-x-6 gap-y-7">
              {Array.from({ length: 8 }).map((_, i) => (
                <GameCardSkeleton key={i} />
              ))}
            </div>
          ) : games.length === 0 ? (
            <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-fg-3">
              {t(lang, 'state_empty')}
            </p>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-x-6 gap-y-7">
              {games.map((g) => (
                <GameCard key={g.id} game={g} lang={lang} />
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} online={247} />
    </div>
  )
}
