import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../lib/appContext'
import { t } from '../lib/i18n'
import s from './TopBar.module.scss'

export function TopBar() {
  const { lang, user, signOut } = useApp()
  const location = useLocation()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <header className={s.bar}>
      <Link to="/" className={s.logo}>
        loweffort.
      </Link>
      <div />
      <div className={s.right}>
        {user ? (
          <>
            <span className={s.user}>{user.username || user.name}</span>
            <button type="button" onClick={handleSignOut} className={s.authBtn}>
              {t(lang, 'nav_logout')}
            </button>
          </>
        ) : (
          <>
            {location.pathname !== '/login' && (
              <Link to="/login" className={s.authBtn}>
                {t(lang, 'nav_login')}
              </Link>
            )}
            {location.pathname !== '/register' && (
              <Link to="/register" className={s.authBtn}>
                {t(lang, 'nav_register')}
              </Link>
            )}
          </>
        )}
      </div>
    </header>
  )
}
