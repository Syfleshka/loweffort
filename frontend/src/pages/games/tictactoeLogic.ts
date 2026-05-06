export type Mark = 'X' | 'O'
export type Cell = Mark | null

export const LINES: ReadonlyArray<readonly [number, number, number]> = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
]

export interface WinResult {
  winner: Mark
  line: readonly number[]
}

export function findWinner(board: Cell[]): WinResult | null {
  for (const line of LINES) {
    const [a, b, c] = line
    const v = board[a]
    if (v && v === board[b] && v === board[c]) {
      return { winner: v, line }
    }
  }
  return null
}
