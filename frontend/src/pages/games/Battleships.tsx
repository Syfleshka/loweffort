import { useState } from 'react'
import type { Game } from '../../types'
import { BattleshipsOnline, type BsKickoff } from './BattleshipsOnline'
import { useApp } from '../../lib/appContext'

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
      <div className="bs-screen">
        <h1>🐤 {game.title}</h1>
        <p>Для игры необходимо войти в аккаунт.</p>
      </div>
    )
  }

  function handleJoinSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!codeOk) return
    onPick({ kind: 'online', kickoff: { code: trimmed } })
  }

  return (
    <div className="lobby">
      <h1>🐤 {game.title} 🌾</h1>
      <p className="tagline">Морской бой, но вместо кораблей — стаи цыплят, а вместо снарядов — корм.</p>

      <div className="lobby-card">
        <button className="primary big" onClick={() => onPick({ kind: 'online', kickoff: 'host' })}>
          Создать комнату
        </button>
        <div className="divider">или</div>
        <form onSubmit={handleJoinSubmit}>
          <input
            type="text"
            placeholder="Код комнаты (например, A7K2P)"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={5}
            autoComplete="off"
            spellCheck={false}
          />
          <button type="submit" disabled={!codeOk}>
            Войти
          </button>
        </form>
      </div>

      <div className="rules">
        <h3>Правила</h3>
        <ul>
          <li>Поле 10×10. Каждый расставляет 10 стай: 1 по 4, 2 по 3, 3 по 2, 4 по 1.</li>
          <li>Стаи не могут касаться друг друга — даже по углам.</li>
          <li>Попал — ход остаётся. Промахнулся — ход переходит.</li>
          <li>Накорми все стаи соперника, чтобы победить.</li>
          <li>За попадания начисляются зёрна: радар, мина, авиаудар — за зёрна.</li>
        </ul>
      </div>
    </div>
  )
}
