import { useEffect, useState } from 'react'
import type { Game } from '../../types'
import { fetchGames } from '../../lib/api'
import { useApp } from '../../lib/appContext'
import { t } from '../../lib/i18n'
import { Layout } from '../../components/Layout'
import { GameCard, GameCardSkeleton } from '../../components/GameCard'
import { StatusNote } from '../../components/StatusNote'
import s from './Home.module.scss'

export default function Home() {
  const { lang } = useApp()
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
    <Layout>
      <section id="all" className={s.section}>
        {error ? (
          <StatusNote>{t(lang, 'state_error')}</StatusNote>
        ) : games === null ? (
          <div className={s.grid}>
            {Array.from({ length: 8 }).map((_, i) => (
              <GameCardSkeleton key={i} />
            ))}
          </div>
        ) : games.length === 0 ? (
          <StatusNote>{t(lang, 'state_empty')}</StatusNote>
        ) : (
          <div className={s.grid}>
            {games.map((g) => (
              <GameCard key={g.id} game={g} lang={lang} />
            ))}
          </div>
        )}
      </section>
    </Layout>
  )
}
