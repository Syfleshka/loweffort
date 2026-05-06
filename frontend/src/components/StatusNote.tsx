import type { ReactNode } from 'react'
import s from './StatusNote.module.scss'

export function StatusNote({ children }: { children: ReactNode }) {
  return (
    <div className={s.wrap}>
      <p className={s.text}>{children}</p>
    </div>
  )
}
