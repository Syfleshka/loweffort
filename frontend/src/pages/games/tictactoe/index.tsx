import { useState } from 'react'
import type { Game } from '../../../types'
import { useApp } from '../../../lib/appContext'
import { t } from '../../../lib/i18n'
import { TicTacToeLocal } from './Local'
import { TicTacToeOnline, type OnlineKickoff } from './Online'
import s from './TicTacToe.module.scss'
import o from './Online.module.scss'

type Mode =
  | { kind: 'select' }
  | { kind: 'local' }
  | { kind: 'online'; kickoff: OnlineKickoff }

export function TicTacToe({ game }: { game: Game }) {
  const [mode, setMode] = useState<Mode>({ kind: 'select' })
  const exit = () => setMode({ kind: 'select' })

  if (mode.kind === 'local') return <TicTacToeLocal game={game} onExit={exit} />
  if (mode.kind === 'online')
    return <TicTacToeOnline game={game} kickoff={mode.kickoff} onExit={exit} />
  return <ModeSelector game={game} onPick={setMode} />
}

function ModeSelector({
  game,
  onPick,
}: {
  game: Game
  onPick: (mode: Mode) => void
}) {
  const { lang } = useApp()
  const [code, setCode] = useState('')
  const trimmed = code.trim().toUpperCase()
  const codeOk = /^[A-Z0-9]{5}$/.test(trimmed)

  function handleJoinSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!codeOk) return
    onPick({ kind: 'online', kickoff: { code: trimmed } })
  }

  return (
    <article className={s.root}>
      <header className={s.header}>
        <h1 className={s.title}>{game.title}</h1>
        <p className={s.hint}>{t(lang, 'ttt_select_mode_title')}</p>
      </header>

      <div className={o.modeList}>
        <ModeCard
          title={t(lang, 'ttt_mode_local')}
          hint={t(lang, 'ttt_mode_local_hint')}
          onClick={() => onPick({ kind: 'local' })}
        />
        <ModeCard
          title={t(lang, 'ttt_mode_host')}
          hint={t(lang, 'ttt_mode_host_hint')}
          onClick={() => onPick({ kind: 'online', kickoff: 'host' })}
        />
        <ModeCard
          title={t(lang, 'ttt_mode_random')}
          hint={t(lang, 'ttt_mode_random_hint')}
          onClick={() => onPick({ kind: 'online', kickoff: 'random' })}
        />
      </div>

      <form className={o.joinForm} onSubmit={handleJoinSubmit}>
        <span className={o.joinLabel}>{t(lang, 'ttt_mode_join')}</span>
        <div className={o.joinRow}>
          <input
            className={o.joinInput}
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={t(lang, 'ttt_join_input')}
            maxLength={5}
            autoComplete="off"
            spellCheck={false}
          />
          <button type="submit" className={o.joinBtn} disabled={!codeOk}>
            {t(lang, 'ttt_join_submit')}
          </button>
        </div>
      </form>
    </article>
  )
}

function ModeCard({
  title,
  hint,
  onClick,
}: {
  title: string
  hint: string
  onClick: () => void
}) {
  return (
    <button type="button" onClick={onClick} className={o.modeCard}>
      <span className={o.modeCardTitle}>{title}</span>
      <span className={o.modeCardHint}>{hint}</span>
    </button>
  )
}
