import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../lib/appContext'
import { t } from '../lib/i18n'

export function TopBar() {
  const { lang, user, signOut } = useApp()
  const location = useLocation()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <header className="le-top-bg sticky top-0 z-10 grid grid-cols-[auto_1fr_auto] items-center gap-8 border-b border-line px-14 py-[22px] max-[920px]:px-7">
      <Link
        to="/"
        className="font-serif text-[26px] font-semibold leading-none tracking-[-0.02em]"
      >
        loweffort<span className="text-fg">.</span>
      </Link>
      <div />
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <span className="font-mono text-[13px] text-fg-2">
              {user.username || user.name}
            </span>
            <button type="button" onClick={handleSignOut} className="le-btn-auth">
              {t(lang, 'nav_logout')}
            </button>
          </>
        ) : (
          <>
            {location.pathname !== '/login' && (
              <Link to="/login" className="le-btn-auth">
                {t(lang, 'nav_login')}
              </Link>
            )}
            {location.pathname !== '/register' && (
              <Link to="/register" className="le-btn-auth">
                {t(lang, 'nav_register')}
              </Link>
            )}
          </>
        )}
      </div>
    </header>
  )
}
