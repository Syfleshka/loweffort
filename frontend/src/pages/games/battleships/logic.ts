import type { Cell, Ship } from './types'
import { BOARD_SIZE, FLEET } from './types'

export function shipCells(ship: Ship): Cell[] {
  const cells: Cell[] = []
  for (let i = 0; i < ship.size; i++) {
    cells.push({
      x: ship.orientation === 'h' ? ship.x + i : ship.x,
      y: ship.orientation === 'v' ? ship.y + i : ship.y,
    })
  }
  return cells
}

export function inBounds(c: Cell): boolean {
  return c.x >= 0 && c.x < BOARD_SIZE && c.y >= 0 && c.y < BOARD_SIZE
}

function neighbors(c: Cell): Cell[] {
  const out: Cell[] = []
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue
      out.push({ x: c.x + dx, y: c.y + dy })
    }
  }
  return out
}

function key(c: Cell): string { return `${c.x},${c.y}` }

export function validateGeometry(ships: Ship[]): { ok: boolean; reason?: string } {
  const occupied = new Set<string>()
  const buffered = new Set<string>()
  for (const ship of ships) {
    const cells = shipCells(ship)
    for (const c of cells) {
      if (!inBounds(c)) return { ok: false, reason: 'Цыплёнок за пределами поля' }
      if (occupied.has(key(c))) return { ok: false, reason: 'Цыплята пересекаются' }
      if (buffered.has(key(c))) return { ok: false, reason: 'Цыплята слишком близко друг к другу' }
    }
    for (const c of cells) {
      occupied.add(key(c))
      for (const n of neighbors(c)) {
        if (inBounds(n)) buffered.add(key(n))
      }
    }
  }
  return { ok: true }
}

export function validatePlacement(ships: Ship[]): { ok: boolean; reason?: string } {
  const expected = [...FLEET].sort((a, b) => b - a)
  const actual = ships.map((s) => s.size).sort((a, b) => b - a)
  if (expected.length !== actual.length || expected.some((v, i) => v !== actual[i])) {
    return { ok: false, reason: 'Неверный состав флота' }
  }
  return validateGeometry(ships)
}

export function randomPlacement(rng: () => number = Math.random): Ship[] {
  for (let attempt = 0; attempt < 200; attempt++) {
    const ships: Ship[] = []
    let ok = true
    for (let i = 0; i < FLEET.length; i++) {
      const size = FLEET[i]
      let placed = false
      for (let tries = 0; tries < 200 && !placed; tries++) {
        const orientation: 'h' | 'v' = rng() < 0.5 ? 'h' : 'v'
        const maxX = orientation === 'h' ? BOARD_SIZE - size : BOARD_SIZE - 1
        const maxY = orientation === 'v' ? BOARD_SIZE - size : BOARD_SIZE - 1
        const x = Math.floor(rng() * (maxX + 1))
        const y = Math.floor(rng() * (maxY + 1))
        const ship: Ship = { id: `s${i}`, size, x, y, orientation }
        if (validateGeometry([...ships, ship]).ok) {
          ships.push(ship)
          placed = true
        }
      }
      if (!placed) { ok = false; break }
    }
    if (ok) return ships
  }
  return []
}
