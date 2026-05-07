import { useState } from 'react'
import type { Game } from '../../types'
import { useApp } from '../../lib/appContext'
import { t } from '../../lib/i18n'
import { Board } from './TicTacToeBoard'
import { findWinner, type Cell, type Mark } from './tictactoeLogic'
import s from './TicTacToe.module.scss'

interface Stats {
  X: number
  O: number
  draw: number
}

const EMPTY_BOARD: Cell[] = Array(100).fill(null)
const ZERO_STATS: Stats = { X: 0, O: 0, draw: 0 }

export function TicTacToeLocal({ game, onExit }: { game: Game; onExit: () => void }) {
  const { lang } = useApp()
  const [board, setBoard] = useState<Cell[]>(EMPTY_BOARD)
  const [turn, setTurn] = useState<Mark>('X')
  const [stats, setStats] = useState<Stats>(ZERO_STATS)

  const win = findWinner(board)
  const filled = board.every((c) => c !== null)
  const status: 'play' | 'won' | 'draw' = win ? 'won' : filled ? 'draw' : 'play'
  const finished = status !== 'play'

  function play(i: number) {
    if (board[i] !== null || finished) return
    const next = board.slice()
    next[i] = turn
    const winNext = findWinner(next)
    setBoard(next)
    if (winNext) {
      setStats((cur) => ({ ...cur, [winNext.winner]: cur[winNext.winner] + 1 }))
    } else if (next.every((c) => c !== null)) {
      setStats((cur) => ({ ...cur, draw: cur.draw + 1 }))
    } else {
      setTurn(turn === 'X' ? 'O' : 'X')
    }
  }

  function reset() {
    setBoard(EMPTY_BOARD)
    setTurn('X')
  }

  const playerGlyph = (p: Mark) => (p === 'X' ? '×' : '○')
  const statusText =
    status === 'won' && win
      ? t(lang, 'ttt_won').replace('{p}', playerGlyph(win.winner))
      : status === 'draw'
        ? t(lang, 'ttt_draw')
        : t(lang, 'ttt_turn').replace('{p}', playerGlyph(turn))

  return (
    <article className={s.root}>
      <header className={s.header}>
        <h1 className={s.title}>{game.title}</h1>
        <p className={s.hint}>{t(lang, 'ttt_mode_local_hint')}</p>
      </header>

      <p className={s.status} aria-live="polite" data-status={status}>
        {statusText}
      </p>

      <Board
        board={board}
        ghostMark={finished ? null : turn}
        winningLine={win?.line ?? null}
        onCellClick={play}
        ariaLabel={game.title}
      />

      <button type="button" onClick={reset} className={s.newGame}>
        {t(lang, 'ttt_new_game').toLowerCase()}
      </button>

      <dl className={s.score}>
        <span className={s.scoreHeading}>{t(lang, 'ttt_score')}</span>
        <ScoreItem label={t(lang, 'ttt_player_x')} value={stats.X} />
        <ScoreItem label={t(lang, 'ttt_player_o')} value={stats.O} />
        <ScoreItem label={t(lang, 'ttt_score_draws')} value={stats.draw} />
      </dl>

      <button type="button" onClick={onExit} className={s.exit}>
        {t(lang, 'ttt_change_mode')}
      </button>
    </article>
  )
}

function ScoreItem({ label, value }: { label: string; value: number }) {
  return (
    <span className={s.scoreItem}>
      <dt className={s.scoreLabel}>{label}</dt>
      <dd className={s.scoreValue}>{value}</dd>
    </span>
  )
}
