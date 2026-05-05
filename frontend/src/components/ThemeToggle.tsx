import type { Theme } from '../lib/useTheme'
import type { Lang } from '../lib/i18n'
import { t } from '../lib/i18n'

interface Props {
  theme: Theme
  setTheme: (t: Theme) => void
  lang: Lang
}

export function ThemeToggle({ theme, setTheme, lang }: Props) {
  return (
    <div className="le-theme-pill" role="group" aria-label="Theme">
      <button
        type="button"
        data-active={theme === 'light'}
        onClick={() => setTheme('light')}
        aria-label={t(lang, 'theme_light')}
        title={t(lang, 'theme_light')}
      >
        <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
          <circle cx="8" cy="8" r="3" fill="currentColor" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <line
              key={deg}
              x1="8"
              y1="1"
              x2="8"
              y2="3"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              transform={`rotate(${deg} 8 8)`}
            />
          ))}
        </svg>
      </button>
      <button
        type="button"
        data-active={theme === 'dark'}
        onClick={() => setTheme('dark')}
        aria-label={t(lang, 'theme_dark')}
        title={t(lang, 'theme_dark')}
      >
        <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
          <path
            d="M12.5 9.5A4.5 4.5 0 0 1 6.5 3.5 4.6 4.6 0 0 0 8 12.5a4.5 4.5 0 0 0 4.5-3z"
            fill="currentColor"
          />
        </svg>
      </button>
    </div>
  )
}
