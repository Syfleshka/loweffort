import { useEffect, useMemo, useState } from 'react'
import type { Cell, Orientation, Ship } from './BattleshipsTypes'
import { FLEET } from './BattleshipsTypes'
import { randomPlacement, shipCells, validateGeometry, validatePlacement } from './BattleshipsLogic'
import { BattleshipsBoard } from './BattleshipsBoard'
import s from './Battleships.module.scss'

interface Props {
  onReady: (ships: Ship[]) => void
  invalidReason?: string | null
  waitingOpponent?: boolean
}

interface PendingShip {
  size: number
  index: number
  used: boolean
}

export function BattleshipsPlacement({ onReady, invalidReason, waitingOpponent }: Props) {
  const [ships, setShips] = useState<Ship[]>([])
  const [orientation, setOrientation] = useState<Orientation>('h')
  const [selectedSize, setSelectedSize] = useState<number | null>(null)
  const [hover, setHover] = useState<Cell | null>(null)

  const pending: PendingShip[] = useMemo(() => {
    const used = new Set(ships.map((ship) => ship.id))
    return FLEET.map((size, index) => ({ size, index, used: used.has(`s${index}`) }))
  }, [ships])

  useEffect(() => {
    if (selectedSize !== null && pending.some((p) => !p.used && p.size === selectedSize)) return
    const next = pending.find((p) => !p.used)
    setSelectedSize(next ? next.size : null)
  }, [pending, selectedSize])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'r' || e.key === 'R' || e.key === 'к' || e.key === 'К') {
        setOrientation((o) => (o === 'h' ? 'v' : 'h'))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const ghost = useMemo(() => {
    if (!hover || selectedSize == null) return null
    const idx = pending.find((p) => !p.used && p.size === selectedSize)?.index
    if (idx == null) return null
    const candidate: Ship = { id: `s${idx}`, size: selectedSize, x: hover.x, y: hover.y, orientation }
    const cells = shipCells(candidate)
    const ok = validateGeometry([...ships, candidate]).ok
    return { cells, valid: ok }
  }, [hover, selectedSize, orientation, ships, pending])

  function placeAtHover() {
    if (!hover || selectedSize == null || !ghost?.valid) return
    const idx = pending.find((p) => !p.used && p.size === selectedSize)?.index
    if (idx == null) return
    setShips((prev) => [...prev, { id: `s${idx}`, size: selectedSize, x: hover.x, y: hover.y, orientation }])
  }

  function removeShipAt(c: Cell) {
    setShips((prev) => prev.filter((ship) => !shipCells(ship).some((sc) => sc.x === c.x && sc.y === c.y)))
  }

  function handleCellClick(c: Cell) {
    if (ships.some((ship) => shipCells(ship).some((sc) => sc.x === c.x && sc.y === c.y))) {
      removeShipAt(c)
    } else {
      placeAtHover()
    }
  }

  const allPlaced = ships.length === FLEET.length
  const validation = allPlaced ? validatePlacement(ships) : { ok: false }

  return (
    <div className={s.placement}>
      <div className={s.placementMain}>
        <BattleshipsBoard
          title="Ваш флот"
          ships={ships}
          ghost={ghost}
          onHover={setHover}
          onClick={handleCellClick}
        />
        <div className={s.placementControls}>
          <h3 className={s.placementHeading}>Расставьте флот</h3>
          <p className={s.hint}>
            Кликайте по клеткам, чтобы поставить корабль. <kbd>R</kbd> — поворот.
            Повторный клик убирает.
          </p>
          <div className={s.fleet}>
            {pending.map((p) => (
              <button
                key={p.index}
                className={[
                  s.fleetItem,
                  selectedSize === p.size && !p.used ? s.fleetItemSelected : '',
                  p.used ? s.fleetItemUsed : '',
                ].filter(Boolean).join(' ')}
                onClick={() => !p.used && setSelectedSize(p.size)}
                disabled={p.used}
              >
                <span className={s.fleetShip}>
                  {Array.from({ length: p.size }).map((_, i) => (
                    <span key={i} className={s.fleetCell} />
                  ))}
                </span>
                <span className={s.fleetLabel}>×{p.size}</span>
              </button>
            ))}
          </div>
          <div className={s.placementRow}>
            <button className={s.btnSecondary} onClick={() => setOrientation((o) => (o === 'h' ? 'v' : 'h'))}>
              Поворот ({orientation === 'h' ? '→' : '↓'})
            </button>
            <button className={s.btnSecondary} onClick={() => setShips(randomPlacement())}>🎲 Случайно</button>
            <button className={s.btnSecondary} onClick={() => setShips([])}>Сброс</button>
          </div>
          {invalidReason && <div className={s.error}>{invalidReason}</div>}
          {waitingOpponent ? (
            <div className={s.info}>Ожидаем соперника…</div>
          ) : (
            <button
              className={s.btnPrimary}
              disabled={!allPlaced || !validation.ok}
              onClick={() => onReady(ships)}
            >
              Готово, в бой!
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
