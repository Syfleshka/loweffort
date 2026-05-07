export const BOARD_SIZE = 10
export const WIN_COUNT = 5

export type Mark = 'X' | 'O'
export type Cell = Mark | null

export interface WinResult {
  winner: Mark
  line: readonly number[]
}

export function findWinner(board: Cell[]): WinResult | null {
  const N = BOARD_SIZE
  const W = WIN_COUNT
  const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]] as const

  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const v = board[r * N + c]
      if (!v) continue
      for (const [dr, dc] of dirs) {
        const line: number[] = []
        for (let k = 0; k < W; k++) {
          const nr = r + dr * k
          const nc = c + dc * k
          if (nr < 0 || nr >= N || nc < 0 || nc >= N) break
          if (board[nr * N + nc] !== v) break
          line.push(nr * N + nc)
        }
        if (line.length === W) return { winner: v, line }
      }
    }
  }
  return null
}
