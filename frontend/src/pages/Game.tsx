import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { useApp } from '../lib/appContext'
import { t } from '../lib/i18n'
import { Layout } from '../components/Layout'
import { StatusNote } from '../components/StatusNote'
import type { Game } from '../types'
import { TicTacToe } from './games/TicTacToe'
import { Battleships } from './games/Battleships'
import s from './Game.module.scss'

const GAME_COMPONENTS: Record<string, React.ComponentType<{ game: Game }>> = {
  tictactoe: TicTacToe,
  battleships: Battleships,
}

export default function GamePage() {
  const { slug = '' } = useParams<{ slug: string }>()
  // Force remount on slug change so per-slug fetch + game state reset cleanly.
  return <GameView key={slug} slug={slug} />
}

function GameView({ slug }: { slug: string }) {
  const { lang } = useApp()
  const [game, setGame] = useState<Game | null>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false
    api
      .get<Game>(`/games/${slug}`)
      .then(({ data }) => {
        if (!cancelled) setGame(data)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)))
      })
    return () => {
      cancelled = true
    }
  }, [slug])

  const Component = GAME_COMPONENTS[slug]

  return (
    <Layout>
      <div className={s.backWrap}>
        <Link to="/" className={s.back}>
          {t(lang, 'back_to_catalog')}
        </Link>
      </div>

      {error ? (
        <StatusNote>{t(lang, 'state_error')}</StatusNote>
      ) : !game ? (
        <StatusNote>{t(lang, 'state_loading')}…</StatusNote>
      ) : !Component ? (
        <StatusNote>{t(lang, 'unknown_game')}</StatusNote>
      ) : (
        <Component game={game} />
      )}
    </Layout>
  )
}
