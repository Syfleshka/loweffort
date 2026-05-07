import { BOARD_SIZE, type Cell, type Mark } from './tictactoeLogic'
import s from './TicTacToe.module.scss'

interface BoardProps {
  board: Cell[]
  ghostMark: Mark | null // null = no ghost preview (not your turn / game over)
  winningLine: readonly number[] | null
  onCellClick: (i: number) => void
  ariaLabel: string
}

export function Board({ board, ghostMark, winningLine, onCellClick, ariaLabel }: BoardProps) {
  const finished = !!winningLine || board.every((c) => c !== null)
  return (
    <div className={s.board} role="grid" aria-label={ariaLabel}>
      {board.map((cell, i) => {
        const isWinning = winningLine?.includes(i) ?? false
        const canClick = !cell && !finished && ghostMark !== null
        return (
          <button
            key={i}
            type="button"
            role="gridcell"
            onClick={() => onCellClick(i)}
            disabled={!canClick}
            aria-label={cell ? `${cell} at ${i + 1}` : `empty cell ${i + 1}`}
            className={s.cell}
          >
            {cell ? (
              <SvgMark kind={cell} highlighted={isWinning} />
            ) : (
              canClick &&
              ghostMark && (
                <span className={s.ghost}>
                  <SvgMark kind={ghostMark} animated={false} />
                </span>
              )
            )}
          </button>
        )
      })}
      {winningLine && winningLine.length >= 2 && <WinLine line={winningLine} />}
    </div>
  )
}

function WinLine({ line }: { line: readonly number[] }) {
  const N = BOARD_SIZE
  const cell = 100 / N
  const center = (idx: number) => ({
    x: (idx % N + 0.5) * cell,
    y: (Math.floor(idx / N) + 0.5) * cell,
  })
  const a = center(line[0])
  const b = center(line[line.length - 1])
  return (
    <svg
      className={s.winLine}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <line
        x1={a.x}
        y1={a.y}
        x2={b.x}
        y2={b.y}
        stroke="var(--le-accent)"
        strokeWidth="1.2"
        strokeLinecap="round"
        pathLength="1"
        className={s.winLineStroke}
      />
    </svg>
  )
}

export function SvgMark({
  kind,
  highlighted = false,
  animated = true,
}: {
  kind: Mark
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
        className={cls(s.strokeO)}
      />
    </svg>
  )
}
