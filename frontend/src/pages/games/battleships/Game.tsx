import { useEffect, useState } from 'react'
import type { Cell, Orientation, Ship } from './types'
import { COST_AIRSTRIKE, COST_MINE, COST_RADAR } from './types'
import type { BoardMode, RadarMark } from './Board'
import { BattleshipsBoard } from './Board'
import s from './Battleships.module.scss'

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

  const enemyShotsSet = new Set(enemyShots.map((sh) => `${sh.x},${sh.y}`))

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
    <div className={s.game}>
      <div className={s.statusBar}>
        {gameOver ? (
          <strong>
            {gameOver.youWon
              ? '🏆 Победа! Вы потопили весь флот соперника.'
              : '💀 Поражение. Соперник потопил ваш флот.'}
          </strong>
        ) : (
          <strong className={yourTurn ? s.yourTurn : s.enemyTurn}>{status}</strong>
        )}
        {gameOver && onRematch && (
          <button className={s.btnPrimary} onClick={onRematch}>Реванш</button>
        )}
      </div>

      {!gameOver && (
        <div className={s.shop}>
          <div className={s.coins} title="Монеты">🪙 {coins}</div>
          <button
            className={[s.abilityBtn, ability === 'shoot' ? s.abilityActive : ''].filter(Boolean).join(' ')}
            onClick={() => setAbility('shoot')}
            title="Обычный выстрел"
          >
            🎯 Выстрел
          </button>
          <button
            className={[s.abilityBtn, ability === 'mine' ? s.abilityActive : ''].filter(Boolean).join(' ')}
            onClick={() => setAbility((a) => (a === 'mine' ? 'shoot' : 'mine'))}
            disabled={coins < COST_MINE && ability !== 'mine'}
            title="Установить мину на своё поле"
          >
            💣 Мина <span className={s.cost}>{COST_MINE}</span>
          </button>
          <button
            className={[s.abilityBtn, ability === 'radar' ? s.abilityActive : ''].filter(Boolean).join(' ')}
            onClick={() => setAbility((a) => (a === 'radar' ? 'shoot' : 'radar'))}
            disabled={!yourTurn || (coins < COST_RADAR && ability !== 'radar')}
            title="Сонар — разведка 3×3"
          >
            📡 Сонар <span className={s.cost}>{COST_RADAR}</span>
          </button>
          <button
            className={[s.abilityBtn, ability === 'airstrike' ? s.abilityActive : ''].filter(Boolean).join(' ')}
            onClick={() => setAbility((a) => (a === 'airstrike' ? 'shoot' : 'airstrike'))}
            disabled={!yourTurn || (coins < COST_AIRSTRIKE && ability !== 'airstrike')}
            title="Авиаудар по линии (R — поворот)"
          >
            ✈️ Авиаудар <span className={s.cost}>{COST_AIRSTRIKE}</span>
          </button>
          {ability === 'airstrike' && (
            <button
              className={s.rotateBtn}
              onClick={() => setStrikeOrientation((o) => (o === 'h' ? 'v' : 'h'))}
            >
              {strikeOrientation === 'h' ? '→' : '↓'}
            </button>
          )}
        </div>
      )}

      {abilityError && <div className={s.error}>{abilityError}</div>}
      {ability === 'mine' && !gameOver && (
        <div className={s.info}>Кликните по своей свободной клетке, чтобы поставить мину</div>
      )}
      {ability === 'radar' && !gameOver && (
        <div className={s.info}>Наведитесь на клетку — сонар покажет квадрат 3×3</div>
      )}
      {ability === 'airstrike' && !gameOver && (
        <div className={s.info}>
          Выберите {strikeOrientation === 'h' ? 'строку' : 'столбец'}. R — поворот направления.
        </div>
      )}

      <div className={s.boards}>
        <BattleshipsBoard
          title="Море соперника"
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
          title="Ваше море"
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
