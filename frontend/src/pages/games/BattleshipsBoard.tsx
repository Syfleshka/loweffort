import { Fragment } from 'react'
import type { Cell, Ship } from './BattleshipsTypes'
import { BOARD_SIZE } from './BattleshipsTypes'
import { shipCells } from './BattleshipsLogic'

export type BoardMode =
  | 'shoot'
  | 'mine'
  | 'radar'
  | 'airstrike-h'
  | 'airstrike-v'
  | 'placement'
  | 'view'

export interface RadarMark {
  x: number
  y: number
  ships: number
  mines: number
}

export interface BoardProps {
  title: string
  ships?: Ship[]
  shots?: { x: number; y: number; result: 'miss' | 'hit' | 'kill' }[]
  sunkCells?: Cell[]
  ghost?: { cells: Cell[]; valid: boolean } | null
  ownMines?: Cell[]
  radarMarks?: RadarMark[]
  mode?: BoardMode
  hoverCell?: Cell | null
  onHover?: (c: Cell | null) => void
  onClick?: (c: Cell) => void
  highlightTurn?: boolean
  disabled?: boolean
}

const COLS = 'АБВГДЕЖЗИК'.split('')

export function BattleshipsBoard(props: BoardProps) {
  const {
    title,
    ships = [],
    shots = [],
    sunkCells = [],
    ghost,
    ownMines = [],
    radarMarks = [],
    mode = 'view',
    hoverCell,
    onHover,
    onClick,
    highlightTurn,
    disabled,
  } = props

  const sunkSet = new Set(sunkCells.map((c) => `${c.x},${c.y}`))
  const shipMap = new Map<string, { sunk: boolean }>()
  for (const s of ships) {
    const allHit = shipCells(s).every((c) => sunkSet.has(`${c.x},${c.y}`))
    for (const c of shipCells(s)) shipMap.set(`${c.x},${c.y}`, { sunk: allHit })
  }
  const shotMap = new Map<string, 'miss' | 'hit' | 'kill'>()
  for (const sh of shots) shotMap.set(`${sh.x},${sh.y}`, sh.result)
  const ghostSet = new Set((ghost?.cells ?? []).map((c) => `${c.x},${c.y}`))
  const mineSet = new Set(ownMines.map((c) => `${c.x},${c.y}`))
  const radarMap = new Map<string, RadarMark>()
  for (const r of radarMarks) radarMap.set(`${r.x},${r.y}`, r)
  const radarAreaSet = new Set<string>()
  for (const r of radarMarks) {
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const nx = r.x + dx, ny = r.y + dy
        if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE) {
          radarAreaSet.add(`${nx},${ny}`)
        }
      }
    }
  }

  const hoverHighlight = new Set<string>()
  if (hoverCell && !disabled) {
    if (mode === 'airstrike-h') {
      for (let i = 0; i < BOARD_SIZE; i++) hoverHighlight.add(`${i},${hoverCell.y}`)
    } else if (mode === 'airstrike-v') {
      for (let i = 0; i < BOARD_SIZE; i++) hoverHighlight.add(`${hoverCell.x},${i}`)
    } else if (mode === 'radar') {
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const nx = hoverCell.x + dx, ny = hoverCell.y + dy
          if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE) {
            hoverHighlight.add(`${nx},${ny}`)
          }
        }
      }
    }
  }

  return (
    <div className={`board-wrap ${highlightTurn ? 'turn' : ''}`}>
      <div className="board-title">{title}</div>
      <div
        className={`board ${disabled ? 'disabled' : ''} mode-${mode}`}
        onMouseLeave={() => onHover?.(null)}
      >
        <div className="corner" />
        {COLS.map((l) => (
          <div key={`col-${l}`} className="axis col">{l}</div>
        ))}
        {Array.from({ length: BOARD_SIZE }, (_, y) => (
          <Fragment key={`row-${y}`}>
            <div className="axis row">{y + 1}</div>
            {Array.from({ length: BOARD_SIZE }, (_, x) => {
              const k = `${x},${y}`
              const ship = shipMap.get(k)
              const shot = shotMap.get(k)
              const inGhost = ghostSet.has(k)
              const hasMine = mineSet.has(k)
              const radarCenter = radarMap.get(k)
              const inRadarArea = radarAreaSet.has(k)
              const inHover = hoverHighlight.has(k)

              const classes = ['cell']
              if (ship && !shot) classes.push('chicken')
              if (ship?.sunk) classes.push('sunk')
              if (shot === 'miss') classes.push('miss')
              if (shot === 'hit' || shot === 'kill') classes.push('hit')
              if (inGhost) classes.push(ghost!.valid ? 'ghost-ok' : 'ghost-bad')
              if (inRadarArea) classes.push('radar-area')
              if (inHover) classes.push('mode-hover')
              if (hasMine && !shot) classes.push('mine')

              return (
                <div
                  key={k}
                  className={classes.join(' ')}
                  onMouseEnter={() => onHover?.({ x, y })}
                  onClick={() => !disabled && onClick?.({ x, y })}
                >
                  {ship && !shot && <span className="emoji">🐤</span>}
                  {shot === 'miss' && <span className="emoji">🌾</span>}
                  {shot === 'hit' && <span className="emoji">💥</span>}
                  {shot === 'kill' && <span className="emoji">🍗</span>}
                  {hasMine && !shot && <span className="emoji mine-glyph">🪤</span>}
                  {radarCenter && (
                    <span className="radar-info">
                      🐤{radarCenter.ships}<br />🪤{radarCenter.mines}
                    </span>
                  )}
                </div>
              )
            })}
          </Fragment>
        ))}
      </div>
    </div>
  )
}
