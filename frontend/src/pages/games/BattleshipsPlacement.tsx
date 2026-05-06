import { useEffect, useMemo, useState } from 'react'
import { Cell, FLEET, Orientation, Ship } from './BattleshipsTypes'
import { randomPlacement, shipCells, validateGeometry, validatePlacement } from './BattleshipsLogic'
import { BattleshipsBoard } from './BattleshipsBoard'

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
    const used = new Set(ships.map((s) => s.id))
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
    setShips((prev) => prev.filter((s) => !shipCells(s).some((sc) => sc.x === c.x && sc.y === c.y)))
  }

  function handleCellClick(c: Cell) {
    if (ships.some((s) => shipCells(s).some((sc) => sc.x === c.x && sc.y === c.y))) {
      removeShipAt(c)
    } else {
      placeAtHover()
    }
  }

  const allPlaced = ships.length === FLEET.length
  const validation = allPlaced ? validatePlacement(ships) : { ok: false }

  return (
    <div className="placement">
      <div className="placement-main">
        <BattleshipsBoard
          title="Ваш курятник"
          ships={ships}
          ghost={ghost}
          onHover={setHover}
          onClick={handleCellClick}
        />
        <div className="placement-controls">
          <h3>Расставьте цыплят 🐔</h3>
          <p className="hint">
            Кликайте по клеткам, чтобы посадить цыплёнка. <kbd>R</kbd> — поворот.
            Повторный клик убирает.
          </p>
          <div className="fleet">
            {pending.map((p) => (
              <button
                key={p.index}
                className={`fleet-item ${selectedSize === p.size && !p.used ? 'selected' : ''} ${p.used ? 'used' : ''}`}
                onClick={() => !p.used && setSelectedSize(p.size)}
                disabled={p.used}
              >
                {Array.from({ length: p.size }).map((_, i) => (
                  <span key={i} className="emoji">{p.used ? '·' : '🐤'}</span>
                ))}
                <span className="size-label">×{p.size}</span>
              </button>
            ))}
          </div>
          <div className="row">
            <button onClick={() => setOrientation((o) => (o === 'h' ? 'v' : 'h'))}>
              Поворот ({orientation === 'h' ? '→' : '↓'})
            </button>
            <button onClick={() => setShips(randomPlacement())}>🎲 Случайно</button>
            <button onClick={() => setShips([])}>Сброс</button>
          </div>
          {invalidReason && <div className="error">{invalidReason}</div>}
          {waitingOpponent ? (
            <div className="info">Ожидаем соперника…</div>
          ) : (
            <button
              className="primary"
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
