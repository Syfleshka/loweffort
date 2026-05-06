import { useEffect, useState } from 'react'
import type { Cell, Orientation, Ship } from './BattleshipsTypes'
import { COST_AIRSTRIKE, COST_MINE, COST_RADAR } from './BattleshipsTypes'
import type { BoardMode, RadarMark } from './BattleshipsBoard'
import { BattleshipsBoard } from './BattleshipsBoard'

type AbilityMode = 'shoot' | 'mine' | 'radar' | 'airstrike'

interface Props {
  myShips: Ship[]
  myShots: { x: number; y: number; result: 'miss' | 'hit' | 'kill' }[]
  mySunkCells: Cell[]
  myMines: Cell[]
  enemyShots: { x: number; y: number; result: 'miss' | 'hit' | 'kill' }[]
  enemySunkCells: Cell[]
  enemyRevealedShips?: Ship[]
  enemyRevealedMines?: Cell[]
  radarMarks: RadarMark[]
  coins: number
  yourTurn: boolean
  status: string
  abilityError?: string | null
  onShoot: (c: Cell) => void
  onPlaceMine: (c: Cell) => void
  onUseRadar: (c: Cell) => void
  onUseAirstrike: (orientation: Orientation, index: number) => void
  gameOver?: { youWon: boolean } | null
  onRematch?: () => void
}

export function BattleshipsGame(props: Props) {
  const {
    myShips, myShots, mySunkCells, myMines,
    enemyShots, enemySunkCells, enemyRevealedShips, enemyRevealedMines,
    radarMarks, coins, yourTurn, status, abilityError,
    onShoot, onPlaceMine, onUseRadar, onUseAirstrike,
    gameOver, onRematch,
  } = props

  const [ability, setAbility] = useState<AbilityMode>('shoot')
  const [strikeOrientation, setStrikeOrientation] = useState<Orientation>('h')
  const [hover, setHover] = useState<Cell | null>(null)

  useEffect(() => {
    if (gameOver) setAbility('shoot')
  }, [gameOver])

  useEffect(() => {
    if (!yourTurn && ability !== 'mine') setAbility('shoot')
  }, [yourTurn, ability])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (ability !== 'airstrike') return
      if (e.key === 'r' || e.key === 'R' || e.key === 'к' || e.key === 'К') {
        setStrikeOrientation((o) => (o === 'h' ? 'v' : 'h'))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [ability])

  const enemyShotsSet = new Set(enemyShots.map((s) => `${s.x},${s.y}`))

  const enemyMode: BoardMode = gameOver
    ? 'view'
    : ability === 'radar'
      ? 'radar'
      : ability === 'airstrike'
        ? strikeOrientation === 'h' ? 'airstrike-h' : 'airstrike-v'
        : 'shoot'
  const myMode: BoardMode = ability === 'mine' && !gameOver ? 'mine' : 'view'

  function handleEnemyClick(c: Cell) {
    if (gameOver || !yourTurn) return
    if (ability === 'shoot') {
      if (enemyShotsSet.has(`${c.x},${c.y}`)) return
      onShoot(c)
    } else if (ability === 'radar') {
      onUseRadar(c)
    } else if (ability === 'airstrike') {
      onUseAirstrike(strikeOrientation, strikeOrientation === 'h' ? c.y : c.x)
      setAbility('shoot')
    }
  }

  function handleMyClick(c: Cell) {
    if (gameOver || ability !== 'mine') return
    onPlaceMine(c)
  }

  return (
    <div className="game">
      <div className="status-bar">
        {gameOver ? (
          <strong>
            {gameOver.youWon
              ? '🏆 Победа! Все цыплята соперника накормлены.'
              : '😿 Поражение. Соперник раскормил всех ваших цыплят.'}
          </strong>
        ) : (
          <strong className={yourTurn ? 'your-turn' : 'enemy-turn'}>{status}</strong>
        )}
        {gameOver && onRematch && (
          <button className="primary" onClick={onRematch}>Реванш</button>
        )}
      </div>

      {!gameOver && (
        <div className="shop">
          <div className="coins" title="Зёрен">🌾 {coins}</div>
          <button
            className={`ability ${ability === 'shoot' ? 'active' : ''}`}
            onClick={() => setAbility('shoot')}
            title="Обычный выстрел кормом"
          >
            🌾 Корм
          </button>
          <button
            className={`ability ${ability === 'mine' ? 'active' : ''}`}
            onClick={() => setAbility((a) => (a === 'mine' ? 'shoot' : 'mine'))}
            disabled={coins < COST_MINE && ability !== 'mine'}
            title="Установить мину на свою свободную клетку"
          >
            🪤 Мина <span className="cost">{COST_MINE}</span>
          </button>
          <button
            className={`ability ${ability === 'radar' ? 'active' : ''}`}
            onClick={() => setAbility((a) => (a === 'radar' ? 'shoot' : 'radar'))}
            disabled={!yourTurn || (coins < COST_RADAR && ability !== 'radar')}
            title="Разведка 3×3 на поле соперника"
          >
            📡 Радар <span className="cost">{COST_RADAR}</span>
          </button>
          <button
            className={`ability ${ability === 'airstrike' ? 'active' : ''}`}
            onClick={() => setAbility((a) => (a === 'airstrike' ? 'shoot' : 'airstrike'))}
            disabled={!yourTurn || (coins < COST_AIRSTRIKE && ability !== 'airstrike')}
            title="Удар по линии (R — поворот)"
          >
            ✈️ Авиаудар <span className="cost">{COST_AIRSTRIKE}</span>
          </button>
          {ability === 'airstrike' && (
            <button
              className="rotate"
              onClick={() => setStrikeOrientation((o) => (o === 'h' ? 'v' : 'h'))}
            >
              {strikeOrientation === 'h' ? '→' : '↓'}
            </button>
          )}
        </div>
      )}

      {abilityError && <div className="error">{abilityError}</div>}
      {ability === 'mine' && !gameOver && (
        <div className="info">Кликните по своей свободной клетке, чтобы поставить мину</div>
      )}
      {ability === 'radar' && !gameOver && (
        <div className="info">Наведитесь на клетку соперника — радар покажет 3×3</div>
      )}
      {ability === 'airstrike' && !gameOver && (
        <div className="info">
          Выберите {strikeOrientation === 'h' ? 'строку' : 'столбец'} соперника. R — поворот.
        </div>
      )}

      <div className="boards">
        <BattleshipsBoard
          title="Курятник соперника"
          ships={enemyRevealedShips}
          shots={enemyShots}
          sunkCells={enemySunkCells}
          ownMines={gameOver ? enemyRevealedMines : undefined}
          radarMarks={radarMarks}
          mode={enemyMode}
          hoverCell={hover}
          onHover={setHover}
          onClick={handleEnemyClick}
          highlightTurn={yourTurn && !gameOver}
          disabled={!yourTurn || !!gameOver || ability === 'mine'}
        />
        <BattleshipsBoard
          title="Ваш курятник"
          ships={myShips}
          shots={myShots}
          sunkCells={mySunkCells}
          ownMines={myMines}
          mode={myMode}
          hoverCell={hover}
          onHover={setHover}
          onClick={handleMyClick}
          highlightTurn={!yourTurn && !gameOver}
          disabled={ability !== 'mine' || !!gameOver}
        />
      </div>
    </div>
  )
}
