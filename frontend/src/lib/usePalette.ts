import { useEffect } from 'react'

// Applies a palette class to <html> for the lifetime of the component.
// Lets games override the global CSS variables (bg/fg/line) — the topbar and
// footer pick up the change automatically because they consume those vars.
export function usePalette(palette: string | null | undefined) {
  useEffect(() => {
    if (!palette) return
    const cls = `palette-${palette}`
    document.documentElement.classList.add(cls)
    return () => {
      document.documentElement.classList.remove(cls)
    }
  }, [palette])
}
