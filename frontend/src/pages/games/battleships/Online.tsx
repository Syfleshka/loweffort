import { useEffect, useRef, useState } from 'react'
import type { Game } from '../../../types'
import { useApp } from '../../../lib/appContext'
import { getSocket } from '../../../lib/socket'
import type { Cell, Orientation, Ship } from './types'
import type { RadarMark } from './Board'
import { BattleshipsPlacement } from './Placement'
import { BattleshipsGame } from './Game'
import s from './Battleships.module.scss'

export type BsKickoff = 'host' | 'random' | { code: string }

type Phase = 'connecting' | 'waiting' | 'placement' | 'playing' | 'gameOver'

interface ShotMark { x: number; y: number; result: 'miss' | 'hit' | 'kill' }

export function BattleshipsOnline({
  game,
  kickoff,
  onExit,
}: {
  game: Game
  kickoff: BsKickoff
  onExit: () => void
}) {
  const { identity } = useApp()
  const [phase, setPhase] = useState<Phase>('connecting')
  const [connectError, setConnectError] = useState<string | null>(null)

  // Room
  const [roomCode, setRoomCode] = useState<string | null>(null)
  const [opponentInRoom, setOpponentInRoom] = useState(false)

  // Placement
  const [placementError, setPlacementError] = useState<string | null>(null)
  const [waitingOpponent, setWaitingOpponent] = useState(false)

  // Game state
  const [myShips, setMyShips] = useState<Ship[]>([])
  const [myShots, setMyShots] = useState<ShotMark[]>([])
  const [mySunk, setMySunk] = useState<Cell[]>([])
  const [myMines, setMyMines] = useState<Cell[]>([])
  const [enemyShots, setEnemyShots] = useState<ShotMark[]>([])
  const [enemySunk, setEnemySunk] = useState<Cell[]>([])
  const [enemyShips, setEnemyShips] = useState<Ship[] | undefined>()
  const [enemyMines, setEnemyMines] = useState<Cell[] | undefined>()
  const [coins, setCoins] = useState(0)
  const [radarMarks, setRadarMarks] = useState<RadarMark[]>([])
  const [abilityError, setAbilityError] = useState<string | null>(null)
  const [yourTurn, setYourTurn] = useState(false)
  const [gameOver, setGameOver] = useState<{ youWon: boolean } | null>(null)
  const [statusMsg, setStatusMsg] = useState('')

  const kickedOff = useRef(false)
  const phaseRef = useRef(phase)
  phaseRef.current = phase

  function resetGameState() {
    setMyShips([])
    setMyShots([])
    setMySunk([])
    setMyMines([])
    setEnemyShots([])
    setEnemySunk([])
    setEnemyShips(undefined)
    setEnemyMines(undefined)
    setCoins(0)
    setRadarMarks([])
    setYourTurn(false)
    setGameOver(null)
    setPlacementError(null)
    setWaitingOpponent(false)
    setAbilityError(null)
  }

  function clearAbilityErrorSoon() {
    setTimeout(() => setAbilityError(null), 3000)
  }

  useEffect(() => {
    const socket = getSocket()

    function onOpponentJoined() {
      setOpponentInRoom(true)
      setPhase('placement')
      resetGameState()
    }
    function onOpponentLeft() {
      setOpponentInRoom(false)
      setStatusMsg('Соперник покинул комнату. Дождитесь нового.')
      setPhase('placement')
      resetGameState()
    }
    function onPlacementInvalid({ reason }: { reason: string }) {
      setPlacementError(reason)
      setWaitingOpponent(false)
    }
    function onWaitingOpponent() {
      setWaitingOpponent(true)
      setPlacementError(null)
    }
    function onGameStart({ yourTurn: yt, coins: c }: { yourTurn: boolean; coins: number }) {
      setPhase('playing')
      setYourTurn(yt)
      setCoins(c)
      setStatusMsg(yt ? 'Ваш ход — открывайте огонь!' : 'Ход соперника…')
      setWaitingOpponent(false)
    }
    function onShotResult(msg: {
      byYou: boolean; x: number; y: number; result: 'miss' | 'hit' | 'kill'
      killedShip?: Cell[]; surroundingMisses?: Cell[]
      mineTriggered?: boolean; coins?: number
    }) {
      const mark: ShotMark = { x: msg.x, y: msg.y, result: msg.result }
      const surrounding = (msg.surroundingMisses ?? []).map((c) => ({ x: c.x, y: c.y, result: 'miss' as const }))
      if (msg.byYou) {
        setEnemyShots((prev) => [...prev, mark, ...surrounding])
        if (msg.result === 'kill' && msg.killedShip) setEnemySunk((prev) => [...prev, ...msg.killedShip!])
        if (typeof msg.coins === 'number') setCoins(msg.coins)
      } else {
        setMyShots((prev) => [...prev, mark, ...surrounding])
        if (msg.result === 'kill' && msg.killedShip) setMySunk((prev) => [...prev, ...msg.killedShip!])
        if (msg.mineTriggered) {
          setMyMines((prev) => prev.filter((m) => !(m.x === msg.x && m.y === msg.y)))
        }
      }
      if (msg.mineTriggered) {
        setStatusMsg(msg.byYou
          ? '💣 Вы подорвали мину соперника! Пропускаете следующий ход.'
          : '💣 Соперник подорвал вашу мину! Он пропустит следующий ход.')
      }
    }
    function onAirstrikeResult(msg: {
      byYou: boolean; orientation: Orientation; index: number
      cells: { x: number; y: number; result: 'miss' | 'hit' | 'kill'; killedShip?: Cell[]; surroundingMisses?: Cell[] }[]
      mineTriggered?: boolean; coins?: number
    }) {
      const newShots: ShotMark[] = []
      for (const c of msg.cells) {
        newShots.push({ x: c.x, y: c.y, result: c.result })
        for (const sm of c.surroundingMisses ?? []) newShots.push({ x: sm.x, y: sm.y, result: 'miss' })
      }
      if (msg.byYou) {
        setEnemyShots((prev) => [...prev, ...newShots])
        const killed: Cell[] = []
        for (const c of msg.cells) if (c.killedShip) killed.push(...c.killedShip)
        if (killed.length) setEnemySunk((prev) => [...prev, ...killed])
        if (typeof msg.coins === 'number') setCoins(msg.coins)
      } else {
        setMyShots((prev) => [...prev, ...newShots])
        const killed: Cell[] = []
        for (const c of msg.cells) if (c.killedShip) killed.push(...c.killedShip)
        if (killed.length) setMySunk((prev) => [...prev, ...killed])
        if (msg.mineTriggered) {
          const struck = new Set(msg.cells.map((c) => `${c.x},${c.y}`))
          setMyMines((prev) => prev.filter((m) => !struck.has(`${m.x},${m.y}`)))
        }
      }
      setStatusMsg(msg.byYou
        ? `✈️ Авиаудар по ${msg.orientation === 'h' ? 'строке' : 'столбцу'} ${msg.index + 1}!`
        : '✈️ Соперник провёл авиаудар!')
    }
    function onMinePlaced({ x, y, coins: c }: { x: number; y: number; coins: number }) {
      setMyMines((prev) => [...prev, { x, y }])
      setCoins(c)
    }
    function onRadarResult({ x, y, ships, mines, coins: c }: { x: number; y: number; ships: number; mines: number; coins: number }) {
      setRadarMarks((prev) => [...prev.filter((r) => !(r.x === x && r.y === y)), { x, y, ships, mines }])
      setCoins(c)
    }
    function onAbilityError({ reason }: { reason: string }) {
      setAbilityError(reason)
      clearAbilityErrorSoon()
    }
    function onTurn({ yourTurn: yt }: { yourTurn: boolean }) {
      setYourTurn(yt)
      setStatusMsg(yt ? 'Ваш ход — открывайте огонь!' : 'Ход соперника…')
    }
    function onGameOver({ youWon, opponentShips, opponentMines }: { youWon: boolean; opponentShips: Ship[]; opponentMines?: Cell[] }) {
      setGameOver({ youWon })
      setEnemyShips(opponentShips)
      setEnemyMines(opponentMines)
      setPhase('gameOver')
    }
    function onRematchRequested() {
      setStatusMsg('Соперник хочет реванш!')
    }
    function onError({ message }: { message: string }) {
      setConnectError(message)
    }

    socket.on('bs:opponent_joined', onOpponentJoined)
    socket.on('bs:opponent_left', onOpponentLeft)
    socket.on('bs:placement_invalid', onPlacementInvalid)
    socket.on('bs:waiting_opponent', onWaitingOpponent)
    socket.on('bs:game_start', onGameStart)
    socket.on('bs:shot_result', onShotResult)
    socket.on('bs:airstrike_result', onAirstrikeResult)
    socket.on('bs:mine_placed', onMinePlaced)
    socket.on('bs:radar_result', onRadarResult)
    socket.on('bs:ability_error', onAbilityError)
    socket.on('bs:turn', onTurn)
    socket.on('bs:game_over', onGameOver)
    socket.on('bs:rematch_requested', onRematchRequested)
    socket.on('bs:error', onError)

    return () => {
      socket.off('bs:opponent_joined', onOpponentJoined)
      socket.off('bs:opponent_left', onOpponentLeft)
      socket.off('bs:placement_invalid', onPlacementInvalid)
      socket.off('bs:waiting_opponent', onWaitingOpponent)
      socket.off('bs:game_start', onGameStart)
      socket.off('bs:shot_result', onShotResult)
      socket.off('bs:airstrike_result', onAirstrikeResult)
      socket.off('bs:mine_placed', onMinePlaced)
      socket.off('bs:radar_result', onRadarResult)
      socket.off('bs:ability_error', onAbilityError)
      socket.off('bs:turn', onTurn)
      socket.off('bs:game_over', onGameOver)
      socket.off('bs:rematch_requested', onRematchRequested)
      socket.off('bs:error', onError)
    }
  }, [])

  useEffect(() => {
    // Wait for /api/me to have set the (guest or auth) cookie before opening
    // the socket — otherwise the handshake would be rejected.
    if (!identity) return
    if (kickedOff.current) return
    kickedOff.current = true
    const socket = getSocket()

    if (kickoff === 'host') {
      socket.emit('bs:create_room', (res: { ok: boolean; code?: string; error?: string }) => {
        if (!res.ok) {
          setConnectError(res.error ?? 'Не удалось создать комнату')
          return
        }
        setRoomCode(res.code ?? null)
        setPhase('waiting')
      })
    } else if (kickoff === 'random') {
      socket.emit('bs:random_match', (res: { ok: boolean; queued?: boolean; error?: string }) => {
        if (!res.ok) {
          setConnectError(errorText(res.error))
          return
        }
        // Either we just got paired (opponent_joined will arrive) or we sit in
        // the queue. Either way, show the waiting screen — paired flow flips
        // the phase to placement when bs:opponent_joined fires.
        if (res.queued) setPhase('waiting')
      })
    } else {
      socket.emit('bs:join_room', { code: kickoff.code }, (res: { ok: boolean; error?: string }) => {
        if (!res.ok) {
          setConnectError(errorText(res.error))
        }
      })
    }
  }, [kickoff, identity])

  useEffect(() => {
    return () => {
      getSocket().emit('bs:cancel_queue')
      getSocket().emit('bs:leave')
    }
  }, [])

  // ── Render ─────────────────────────────────────────────────

  if (connectError) {
    return (
      <div className={s.screen}>
        <h2 className={s.screenTitle}>{game.title}</h2>
        <p className={s.screenError}>{connectError}</p>
        <button className={s.btnSecondary} onClick={onExit}>Назад</button>
      </div>
    )
  }

  if (phase === 'connecting') {
    return (
      <div className={s.screen}>
        <h2 className={s.screenTitle}>{game.title}</h2>
        <p className={s.screenText}>Подключение…</p>
      </div>
    )
  }

  if (phase === 'waiting') {
    return (
      <div className={s.screen}>
        <h2 className={s.screenTitle}>{game.title}</h2>
        {roomCode ? (
          <>
            <div className={s.codeBlock}>
              <p className={s.codeLabel}>Код комнаты — поделитесь с соперником</p>
              <div className={s.code}>{roomCode}</div>
            </div>
            <p className={s.screenText}>Ожидаем соперника…</p>
          </>
        ) : (
          <p className={s.screenText}>Ищем соперника…</p>
        )}
        <button className={s.btnSecondary} onClick={onExit}>Отмена</button>
      </div>
    )
  }

  if (phase === 'placement' || (phase === 'playing' && myShips.length === 0)) {
    return (
      <div className={s.root}>
        <div className={s.header}>
          <h2 className={s.headerTitle}>{game.title}</h2>
          {roomCode && (
            <div className={s.roomInfo}>
              Комната: <strong>{roomCode}</strong>
              <span className={[s.dot, opponentInRoom ? s.dotOnline : ''].filter(Boolean).join(' ')} />
            </div>
          )}
          <button className={s.exitBtn} onClick={onExit}>Выйти</button>
        </div>
        <BattleshipsPlacement
          onReady={(ships) => {
            setMyShips(ships)
            setPlacementError(null)
            getSocket().emit('bs:ready', { ships })
          }}
          invalidReason={placementError}
          waitingOpponent={waitingOpponent || !opponentInRoom}
        />
      </div>
    )
  }

  return (
    <div className={s.root}>
      <div className={s.header}>
        <h2 className={s.headerTitle}>{game.title}</h2>
        {roomCode && (
          <div className={s.roomInfo}>
            Комната: <strong>{roomCode}</strong>
            <span className={[s.dot, opponentInRoom ? s.dotOnline : ''].filter(Boolean).join(' ')} />
          </div>
        )}
        <button className={s.exitBtn} onClick={onExit}>Выйти</button>
      </div>
      <BattleshipsGame
        myShips={myShips}
        myShots={myShots}
        mySunkCells={mySunk}
        myMines={myMines}
        enemyShots={enemyShots}
        enemySunkCells={enemySunk}
        enemyRevealedShips={enemyShips}
        enemyRevealedMines={enemyMines}
        radarMarks={radarMarks}
        coins={coins}
        yourTurn={yourTurn}
        status={statusMsg}
        abilityError={abilityError}
        onShoot={(c) => getSocket().emit('bs:shoot', { x: c.x, y: c.y })}
        onPlaceMine={(c) => getSocket().emit('bs:place_mine', { x: c.x, y: c.y })}
        onUseRadar={(c) => getSocket().emit('bs:use_radar', { x: c.x, y: c.y })}
        onUseAirstrike={(orientation, index) => getSocket().emit('bs:use_airstrike', { orientation, index })}
        gameOver={gameOver}
        onRematch={phase === 'gameOver' ? () => {
          getSocket().emit('bs:rematch')
          setStatusMsg('Запрос реванша отправлен…')
        } : undefined}
      />
    </div>
  )
}

function errorText(error: string | undefined): string {
  switch (error) {
    case 'room_not_found': return 'Комната не найдена'
    case 'room_full': return 'Комната уже занята'
    case 'already_in_room': return 'Вы уже в другой комнате'
    default: return 'Не удалось подключиться'
  }
}
