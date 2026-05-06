import { useState } from 'react'
import type { Game } from '../../types'
import { useApp } from '../../lib/appContext'
import { t } from '../../lib/i18n'

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
      setStats((s) => ({ ...s, [winNext.winner]: s[winNext.winner] + 1 }))
    } else if (next.every((c) => c !== null)) {
      setStats((s) => ({ ...s, draw: s.draw + 1 }))
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
    <article className="flex flex-col items-center gap-10">
      <header className="flex w-full max-w-[640px] flex-col items-center gap-3 text-center">
        <h1 className="m-0 font-serif text-[44px] font-medium leading-[1.05] tracking-[-0.015em] max-[920px]:text-[36px]">
          {game.title}
        </h1>
        <p className="m-0 font-mono text-[11px] tracking-[0.06em] text-fg-3">
          {t(lang, 'ttt_mode_hint')}
        </p>
      </header>

      <p
        className="m-0 font-serif text-[20px] tracking-[-0.005em]"
        aria-live="polite"
        data-status={status}
      >
        {statusText}
      </p>

      <div
        className="grid w-full max-w-[360px] grid-cols-3 border border-line"
        role="grid"
        aria-label={game.title}
      >
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
              className={[
                'group relative flex aspect-square items-center justify-center bg-bg transition-colors duration-150',
                i % 3 < 2 ? 'border-r border-line' : '',
                i < 6 ? 'border-b border-line' : '',
                isInteractive ? 'cursor-pointer hover:bg-bg-2' : 'cursor-default',
              ].join(' ')}
            >
              {cell ? (
                <Mark kind={cell} highlighted={isWinning} />
              ) : (
                isInteractive && (
                  <span className="pointer-events-none opacity-0 transition-opacity duration-150 group-hover:opacity-30">
                    <Mark kind={turn} />
                  </span>
                )
              )}
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={reset}
        className="le-btn-auth"
        aria-label={t(lang, 'ttt_new_game')}
      >
        {t(lang, 'ttt_new_game').toLowerCase()}
      </button>

      <dl className="flex items-center gap-6 font-mono text-[11px] tracking-[0.06em] text-fg-3">
        <span className="text-fg-2">{t(lang, 'ttt_score')}</span>
        <ScoreItem label={t(lang, 'ttt_player_x')} value={stats.X} />
        <ScoreItem label={t(lang, 'ttt_player_o')} value={stats.O} />
        <ScoreItem label={t(lang, 'ttt_score_draws')} value={stats.draw} />
      </dl>
    </article>
  )
}

function ScoreItem({ label, value }: { label: string; value: number }) {
  return (
    <span className="inline-flex items-baseline gap-2">
      <dt className="text-fg-3">{label}</dt>
      <dd className="m-0 font-semibold text-fg">{value}</dd>
    </span>
  )
}

function Mark({ kind, highlighted = false }: { kind: Player; highlighted?: boolean }) {
  const stroke = highlighted ? 'var(--le-accent)' : 'currentColor'
  if (kind === 'X') {
    return (
      <svg viewBox="0 0 100 100" className="h-1/2 w-1/2" aria-hidden="true">
        <line x1="22" y1="22" x2="78" y2="78" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
        <line x1="78" y1="22" x2="22" y2="78" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 100 100" className="h-1/2 w-1/2" aria-hidden="true">
      <circle cx="50" cy="50" r="28" stroke={stroke} strokeWidth="6" fill="none" />
    </svg>
  )
}
