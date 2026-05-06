import { useState } from 'react'
import type { Game } from '../../types'
import { useApp } from '../../lib/appContext'
import { t } from '../../lib/i18n'
import s from './TicTacToe.module.scss'

type Player = 'X' | 'O'
type Cell = Player | null
type Board = Cell[]

const LINES: ReadonlyArray<readonly [number, number, number]> = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
]

interface WinResult {
  winner: Player
  line: readonly number[]
}

function findWinner(board: Board): WinResult | null {
  for (const line of LINES) {
    const [a, b, c] = line
    const v = board[a]
    if (v && v === board[b] && v === board[c]) {
      return { winner: v, line }
    }
  }
  return null
}

interface Stats {
  X: number
  O: number
  draw: number
}

const EMPTY_BOARD: Board = Array(9).fill(null)
const ZERO_STATS: Stats = { X: 0, O: 0, draw: 0 }

export function TicTacToe({ game }: { game: Game }) {
  const { lang } = useApp()
  const [board, setBoard] = useState<Board>(EMPTY_BOARD)
  const [turn, setTurn] = useState<Player>('X')
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

  const playerGlyph = (p: Player) => (p === 'X' ? '×' : '○')
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
        <p className={s.hint}>{t(lang, 'ttt_mode_hint')}</p>
      </header>

      <p className={s.status} aria-live="polite" data-status={status}>
        {statusText}
      </p>

      <div className={s.board} role="grid" aria-label={game.title}>
        {board.map((cell, i) => {
          const isWinning = win?.line.includes(i) ?? false
          const isInteractive = !cell && !finished
          return (
            <button
              key={i}
              type="button"
              role="gridcell"
              onClick={() => play(i)}
              disabled={!isInteractive}
              aria-label={cell ? `${cell} at ${i + 1}` : `empty cell ${i + 1}`}
              className={s.cell}
            >
              {cell ? (
                <Mark kind={cell} highlighted={isWinning} />
              ) : (
                isInteractive && (
                  <span className={s.ghost}>
                    <Mark kind={turn} animated={false} />
                  </span>
                )
              )}
            </button>
          )
        })}
      </div>

      <button type="button" onClick={reset} className={s.newGame}>
        {t(lang, 'ttt_new_game').toLowerCase()}
      </button>

      <dl className={s.score}>
        <span className={s.scoreHeading}>{t(lang, 'ttt_score')}</span>
        <ScoreItem label={t(lang, 'ttt_player_x')} value={stats.X} />
        <ScoreItem label={t(lang, 'ttt_player_o')} value={stats.O} />
        <ScoreItem label={t(lang, 'ttt_score_draws')} value={stats.draw} />
      </dl>
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

function Mark({
  kind,
  highlighted = false,
  animated = true,
}: {
  kind: Player
  highlighted?: boolean
  animated?: boolean
}) {
  const stroke = highlighted ? 'var(--le-accent)' : 'currentColor'
  const cls = (mod: string) => (animated ? `${s.stroke} ${mod}` : '')
  if (kind === 'X') {
    return (
      <svg viewBox="0 0 100 100" className={s.mark} aria-hidden="true">
        <line
          x1="22"
          y1="22"
          x2="78"
          y2="78"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
          pathLength="100"
          className={cls(s.strokeX1)}
        />
        <line
          x1="78"
          y1="22"
          x2="22"
          y2="78"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
          pathLength="100"
          className={cls(s.strokeX2)}
        />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 100 100" className={s.mark} aria-hidden="true">
      <circle
        cx="50"
        cy="50"
        r="28"
        stroke={stroke}
        strokeWidth="6"
        fill="none"
        pathLength="100"
        className={cls(s.strokeO)}
      />
    </svg>
  )
}
