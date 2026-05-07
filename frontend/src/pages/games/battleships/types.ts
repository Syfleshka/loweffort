export const BOARD_SIZE = 10
export const FLEET: number[] = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1]
export const COIN_REWARD_MISS = 50
export const COIN_REWARD_HIT = 100
export const COST_MINE = 200
export const COST_RADAR = 150
export const COST_AIRSTRIKE = 500

export type Orientation = 'h' | 'v'

export interface Cell {
  x: number
  y: number
}

export interface Ship {
  id: string
  size: number
  x: number
  y: number
  orientation: Orientation
}

export type ShotResult = 'miss' | 'hit' | 'kill'

export interface ShotCell {
  x: number
  y: number
  result: ShotResult
  killedShip?: Cell[]
  surroundingMisses?: Cell[]
}

export type BsPhase = 'connecting' | 'waiting' | 'placement' | 'playing' | 'gameOver'
