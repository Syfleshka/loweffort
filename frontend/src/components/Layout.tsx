import type { ReactNode } from 'react'
import { TopBar } from './TopBar'
import { Footer } from './Footer'
import s from './Layout.module.scss'

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className={s.root}>
      <TopBar />
      <main className={s.main}>{children}</main>
      <Footer />
    </div>
  )
}
