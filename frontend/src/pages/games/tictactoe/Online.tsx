import { useEffect, useRef, useState } from 'react'
import type { Game } from '../../../types'
import { useApp } from '../../../lib/appContext'
import { t, type StringKey } from '../../../lib/i18n'
import { getSocket } from '../../../lib/socket'
import { Board } from './Board'
import type { Cell, Mark } from './logic'
import s from './TicTacToe.module.scss'
import o from './Online.module.scss'

export type OnlineKickoff = 'host' | 'random' | { code: string }

interface PublicState {
  matchId: string
  code: string | null
  board: Cell[]
  turn: Mark
  status: 'waiting' | 'active' | 'finished'
  winner: Mark | null
  winningLine: number[] | null
  players: {
    X: { userId: string; username: string } | null
    O: { userId: string; username: string } | null
  }
}

interface AckResponse {
  ok: boolean
  error?: string
  state?: PublicState
  queued?: boolean
}

type Phase = 'connecting' | 'queued' | 'in_match' | 'cancelled' | 'error'

export function TicTacToeOnline({
  game,
  kickoff,
  onExit,
}: {
  game: Game
  kickoff: OnlineKickoff
  onExit: () => void
}) {
  const { lang, identity } = useApp()
  const [phase, setPhase] = useState<Phase>('connecting')
  const [state, setState] = useState<PublicState | null>(null)
  const [errorKey, setErrorKey] = useState<StringKey | null>(null)
  const kickedOff = useRef(false)

  // ── Connect + listen to state updates ──────────────────────
  useEffect(() => {
    const socket = getSocket()

    function onState(next: PublicState) {
      setState(next)
      setPhase('in_match')
    }

    function onCancelled() {
      setState(null)
      setPhase('cancelled')
    }

    socket.on('ttt:state', onState)
    socket.on('ttt:cancelled', onCancelled)
    return () => {
      socket.off('ttt:state', onState)
      socket.off('ttt:cancelled', onCancelled)
    }
  }, [])

  // ── Kick off the chosen action exactly once on mount ───────
  useEffect(() => {
    // Wait until /api/me has set the (guest or auth) cookie so the socket
    // handshake won't be rejected.
    if (!identity) return
    if (kickedOff.current) return
    kickedOff.current = true
    const socket = getSocket()

    const handleAck = (res: AckResponse) => {
      if (!res.ok) {
        setErrorKey(errorKeyFor(res.error))
        setPhase('error')
        return
      }
      if (res.state) {
        setState(res.state)
        setPhase('in_match')
      } else if (res.queued) {
        setPhase('queued')
      }
    }

    if (kickoff === 'host') {
      socket.emit('ttt:create_room', handleAck)
    } else if (kickoff === 'random') {
      socket.emit('ttt:random_match', handleAck)
    } else {
      socket.emit('ttt:join_room', { code: kickoff.code }, handleAck)
    }
  }, [kickoff, identity])

  // ── Cleanup: leave/cancel server-side when unmounting ──────
  useEffect(() => {
    return () => {
      const socket = getSocket()
      // Best effort: tell server we're leaving whatever we were in.
      if (state?.matchId) {
        if (state.status === 'waiting') socket.emit('ttt:cancel_room', { matchId: state.matchId })
        else if (state.status === 'active') socket.emit('ttt:leave', { matchId: state.matchId })
      }
      socket.emit('ttt:cancel_queue')
    }
    // We deliberately don't depend on `state` — only run on unmount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (phase === 'error') {
    return (
      <article className={s.root}>
        <header className={s.header}>
          <h1 className={s.title}>{game.title}</h1>
          <p className={o.errorMsg}>{errorKey ? t(lang, errorKey) : t(lang, 'auth_err_generic')}</p>
        </header>
        <button type="button" onClick={onExit} className={s.exit}>
          {t(lang, 'ttt_back_to_modes')}
        </button>
      </article>
    )
  }

  if (phase === 'queued') {
    return (
      <article className={s.root}>
        <header className={s.header}>
          <h1 className={s.title}>{game.title}</h1>
          <p className={s.hint}>{t(lang, 'ttt_searching')}</p>
        </header>
        <button type="button" onClick={onExit} className={s.newGame}>
          {t(lang, 'ttt_cancel')}
        </button>
      </article>
    )
  }

  if (phase === 'cancelled' || !state) {
    return (
      <article className={s.root}>
        <header className={s.header}>
          <h1 className={s.title}>{game.title}</h1>
          <p className={s.hint}>{t(lang, 'ttt_room_cancelled')}</p>
        </header>
        <button type="button" onClick={onExit} className={s.exit}>
          {t(lang, 'ttt_back_to_modes')}
        </button>
      </article>
    )
  }

  return <Match game={game} state={state} onExit={onExit} />
}

function Match({
  game,
  state,
  onExit,
}: {
  game: Game
  state: PublicState
  onExit: () => void
}) {
  const { lang, identity } = useApp()
  const myRole: Mark | null =
    state.players.X?.userId === identity?.id
      ? 'X'
      : state.players.O?.userId === identity?.id
        ? 'O'
        : null
  const opponent =
    myRole === 'X' ? state.players.O : myRole === 'O' ? state.players.X : null

  function handleCellClick(idx: number) {
    if (state.status !== 'active') return
    if (state.turn !== myRole) return
    getSocket().emit('ttt:move', { matchId: state.matchId, index: idx })
  }

  // ── Waiting room (host has the code, no opponent yet) ──────
  if (state.status === 'waiting') {
    return (
      <article className={s.root}>
        <header className={s.header}>
          <h1 className={s.title}>{game.title}</h1>
          <p className={s.hint}>{t(lang, 'ttt_mode_host_hint')}</p>
        </header>
        {state.code && (
          <div className={o.codeBlock}>
            <span className={o.codeLabel}>{t(lang, 'ttt_room_code_label')}</span>
            <code className={o.code}>{state.code}</code>
          </div>
        )}
        <p className={s.hint}>{t(lang, 'ttt_waiting_opponent')}</p>
        <button type="button" onClick={onExit} className={s.newGame}>
          {t(lang, 'ttt_cancel')}
        </button>
      </article>
    )
  }

  // ── Active or finished match ────────────────────────────────
  const isMyTurn = state.status === 'active' && state.turn === myRole
  const finished = state.status === 'finished'

  let statusText: string
  if (finished) {
    if (state.winner === null) {
      statusText = t(lang, 'ttt_draw')
    } else if (state.winner === myRole) {
      statusText =
        state.winningLine === null ? t(lang, 'ttt_opponent_left') : t(lang, 'ttt_you_won')
    } else {
      statusText = t(lang, 'ttt_you_lost')
    }
  } else if (state.status === 'active') {
    statusText = isMyTurn ? t(lang, 'ttt_your_turn') : t(lang, 'ttt_opponent_turn')
  } else {
    statusText = t(lang, 'ttt_waiting_opponent')
  }

  return (
    <article className={s.root}>
      <header className={s.header}>
        <h1 className={s.title}>{game.title}</h1>
        <p className={o.matchup}>
          {playerLabel(state.players.X, myRole === 'X')} ×{' '}
          {playerLabel(state.players.O, myRole === 'O')}
        </p>
      </header>

      <p className={s.status} aria-live="polite" data-status={state.status}>
        {statusText}
      </p>

      <Board
        board={state.board}
        ghostMark={isMyTurn ? myRole : null}
        winningLine={state.winningLine}
        onCellClick={handleCellClick}
        ariaLabel={game.title}
      />

      {finished ? (
        <button type="button" onClick={onExit} className={s.newGame}>
          {t(lang, 'ttt_new_game').toLowerCase()}
        </button>
      ) : (
        <button type="button" onClick={onExit} className={s.exit}>
          {opponent ? t(lang, 'ttt_forfeit') : t(lang, 'ttt_back_to_modes')}
        </button>
      )}
    </article>
  )
}

function playerLabel(
  p: { userId: string; username: string } | null,
  isMe: boolean,
): string {
  if (!p) return '—'
  return isMe ? `${p.username} (вы)` : p.username
}

function errorKeyFor(serverError: string | undefined): StringKey {
  switch (serverError) {
    case 'room_not_found':
      return 'ttt_err_room_not_found'
    case 'room_in_progress':
      return 'ttt_err_room_in_progress'
    case 'room_full':
      return 'ttt_err_room_full'
    case 'invalid_code':
      return 'ttt_err_invalid_code'
    default:
      return 'auth_err_generic'
  }
}
