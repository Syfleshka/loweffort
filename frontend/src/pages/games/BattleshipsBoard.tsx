import { Fragment } from 'react'
import type { Cell, Ship } from './BattleshipsTypes'
import { BOARD_SIZE } from './BattleshipsTypes'
import { shipCells } from './BattleshipsLogic'
import s from './Battleships.module.scss'

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
  for (const ship of ships) {
    const allHit = shipCells(ship).every((c) => sunkSet.has(`${c.x},${c.y}`))
    for (const c of shipCells(ship)) shipMap.set(`${c.x},${c.y}`, { sunk: allHit })
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

  const modeClass = s[`mode${mode.replace('-', '')}`] ?? ''

  return (
    <div className={[s.boardWrap, highlightTurn ? s.boardTurn : ''].filter(Boolean).join(' ')}>
      <div className={s.boardTitle}>{title}</div>
      <div
        className={[s.board, disabled ? s.boardDisabled : '', modeClass].filter(Boolean).join(' ')}
        onMouseLeave={() => onHover?.(null)}
      >
        <div className={s.corner} />
        {COLS.map((l) => (
          <div key={`col-${l}`} className={s.axisCol}>{l}</div>
        ))}
        {Array.from({ length: BOARD_SIZE }, (_, y) => (
          <Fragment key={`row-${y}`}>
            <div className={s.axisRow}>{y + 1}</div>
            {Array.from({ length: BOARD_SIZE }, (_, x) => {
              const k = `${x},${y}`
              const ship = shipMap.get(k)
              const shot = shotMap.get(k)
              const inGhost = ghostSet.has(k)
              const hasMine = mineSet.has(k)
              const radarCenter = radarMap.get(k)
              const inRadarArea = radarAreaSet.has(k)
              const inHover = hoverHighlight.has(k)

              const classes = [s.cell]
              if (ship && !shot) classes.push(ship.sunk ? s.cellSunk : s.cellShip)
              if (ship?.sunk && shot) classes.push(s.cellSunk)
              if (shot === 'miss') classes.push(s.cellMiss)
              if (shot === 'hit') classes.push(s.cellHit)
              if (shot === 'kill') classes.push(s.cellSunk)
              if (inGhost) classes.push(ghost!.valid ? s.cellGhostOk : s.cellGhostBad)
              if (inRadarArea && !shot && !ship) classes.push(s.cellRadarArea)
              if (inHover && !shot) classes.push(s.cellModeHover)
              if (hasMine && !shot) classes.push(s.cellMine)

              return (
                <div
                  key={k}
                  className={classes.join(' ')}
                  onMouseEnter={() => onHover?.({ x, y })}
                  onClick={() => !disabled && onClick?.({ x, y })}
                >
                  {hasMine && !shot && <span className={s.mineGlyph}>💣</span>}
                  {radarCenter && (
                    <span className={s.radarInfo}>
                      🚢{radarCenter.ships}<br />💣{radarCenter.mines}
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
