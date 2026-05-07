import { useState } from 'react'
import type { Game } from '../../types'
import { BattleshipsOnline, type BsKickoff } from './BattleshipsOnline'
import { useApp } from '../../lib/appContext'
import s from './Battleships.module.scss'

type Mode = { kind: 'select' } | { kind: 'online'; kickoff: BsKickoff }

export function Battleships({ game }: { game: Game }) {
  const [mode, setMode] = useState<Mode>({ kind: 'select' })
  const exit = () => setMode({ kind: 'select' })

  if (mode.kind === 'online') {
    return <BattleshipsOnline game={game} kickoff={mode.kickoff} onExit={exit} />
  }
  return <ModeSelector game={game} onPick={setMode} />
}

function ModeSelector({ game, onPick }: { game: Game; onPick: (m: Mode) => void }) {
  const { user } = useApp()
  const [code, setCode] = useState('')
  const trimmed = code.trim().toUpperCase()
  const codeOk = /^[A-Z0-9]{5}$/.test(trimmed)

  if (!user) {
    return (
      <div className={s.screen}>
        <h1 className={s.screenTitle}>⚓ {game.title}</h1>
        <p className={s.screenText}>Для игры необходимо войти в аккаунт.</p>
      </div>
    )
  }

  function handleJoinSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!codeOk) return
    onPick({ kind: 'online', kickoff: { code: trimmed } })
  }

  return (
    <div className={s.lobby}>
      <h1 className={s.lobbyTitle}>⚓ {game.title}</h1>
      <p className={s.tagline}>Классический морской бой — расставьте флот и потопите соперника.</p>

      <div className={s.lobbyCard}>
        <button className={s.btnPrimary} onClick={() => onPick({ kind: 'online', kickoff: 'host' })}>
          Создать комнату
        </button>
        <div className={s.divider}>или</div>
        <form onSubmit={handleJoinSubmit}>
          <div className={s.joinRow}>
            <input
              className={s.joinInput}
              type="text"
              placeholder="Код комнаты (например, A7K2P)"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={5}
              autoComplete="off"
              spellCheck={false}
            />
            <button type="submit" className={s.btnSecondary} disabled={!codeOk}>
              Войти
            </button>
          </div>
        </form>
      </div>

      <div className={s.rules}>
        <h3 className={s.rulesTitle}>Правила</h3>
        <ul className={s.rulesList}>
          <li>Поле 10×10. Каждый расставляет 10 кораблей: 1 на 4, 2 на 3, 3 на 2, 4 на 1 клетку.</li>
          <li>Корабли не могут касаться друг друга — даже по углам.</li>
          <li>Попал — ход остаётся. Промахнулся — ход переходит сопернику.</li>
          <li>Потопи весь флот соперника, чтобы победить.</li>
          <li>За попадания начисляются монеты: сонар, мина, авиаудар — за монеты.</li>
        </ul>
      </div>
    </div>
  )
}
