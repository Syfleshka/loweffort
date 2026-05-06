import { Link } from 'react-router-dom'
import { useApp } from '../lib/appContext'
import { t } from '../lib/i18n'

export function TopBar() {
  const { lang } = useApp()
  return (
    <header className="le-top-bg sticky top-0 z-10 grid grid-cols-[auto_1fr_auto] items-center gap-8 border-b border-line px-14 py-[22px] max-[920px]:px-7">
      <Link
        to="/"
        className="font-serif text-[26px] font-semibold leading-none tracking-[-0.02em]"
      >
        loweffort<span className="text-fg">.</span>
      </Link>
      <div />
      <div className="flex items-center gap-3">
        <Link to="/login" className="le-btn-auth">
          {t(lang, 'nav_login')}
        </Link>
      </div>
    </header>
  )
}
