import { useApp } from '../lib/appContext'
import { t } from '../lib/i18n'
import { ThemeToggle } from './ThemeToggle'
import { LangToggle } from './LangToggle'

// TODO: replace 247 stub with a real online counter when an endpoint exists
const ONLINE_STUB = 247

export function Footer() {
  const { lang, setLang, theme, setTheme } = useApp()

  return (
    <footer
      className="grid grid-cols-[1fr_auto_1fr] items-center gap-6 border-t border-line bg-bg-2 px-14 py-7 font-mono text-[11px] tracking-[0.06em] text-fg-3 max-[920px]:px-7"
      aria-label="Site footer"
    >
      <div className="flex flex-col gap-[6px]">
        <span className="font-serif text-[16px] font-semibold tracking-[-0.01em] text-fg">
          loweffort<span className="text-fg">.</span>
        </span>
        <span>© 2026 — {t(lang, 'footer_made')}</span>
      </div>

      <div className="flex items-center gap-3 whitespace-nowrap">
        <span>
          <span className="le-pulse" aria-hidden="true" />
          <strong className="font-semibold text-fg">{ONLINE_STUB}</strong>{' '}
          {t(lang, 'footer_online')}
        </span>
      </div>

      <div className="flex items-center justify-end gap-4">
        <ThemeToggle theme={theme} setTheme={setTheme} lang={lang} />
        <a
          className="le-foot-link"
          href="https://github.com/Syfleshka/loweffort"
          target="_blank"
          rel="noreferrer"
        >
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <path
              fill="currentColor"
              d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38v-1.34c-2.23.48-2.7-1.07-2.7-1.07-.36-.93-.89-1.18-.89-1.18-.73-.5.05-.49.05-.49.81.06 1.23.83 1.23.83.72 1.23 1.88.88 2.34.67.07-.52.28-.88.51-1.08-1.78-.2-3.65-.89-3.65-3.96 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.13 0 0 .67-.21 2.2.82a7.65 7.65 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.11.16 1.93.08 2.13.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8z"
            />
          </svg>
          GitHub
        </a>
        <LangToggle lang={lang} setLang={setLang} />
      </div>
    </footer>
  )
}
