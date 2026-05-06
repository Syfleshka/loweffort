import type { ReactNode } from 'react'
import { TopBar } from './TopBar'
import { Footer } from './Footer'

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-14 pt-14 pb-24 max-[920px]:px-7">
        {children}
      </main>
      <Footer />
    </div>
  )
}
