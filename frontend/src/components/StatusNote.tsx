import type { ReactNode } from 'react'

export function StatusNote({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <p className="font-mono text-[11px] tracking-[0.06em] text-fg-3">{children}</p>
    </div>
  )
}
