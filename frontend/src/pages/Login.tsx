import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { Field } from '../components/Field'
import { useApp } from '../lib/appContext'
import { t } from '../lib/i18n'
import { classifyAuthError, login } from '../lib/auth'
import s from './Auth.module.scss'

interface FieldErrors {
  identifier?: string
  password?: string
  form?: string
}

export default function Login() {
  const { lang, user, isAuthLoading, refreshSession } = useApp()
  const navigate = useNavigate()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isAuthLoading && user) navigate('/', { replace: true })
  }, [isAuthLoading, user, navigate])

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!identifier.trim() || !password) {
      setErrors({ form: t(lang, 'auth_err_credentials') })
      return
    }
    setErrors({})
    setSubmitting(true)
    try {
      await login(identifier.trim(), password)
      await refreshSession()
      navigate('/', { replace: true })
    } catch (err) {
      const kind = classifyAuthError(err)
      setErrors({
        form:
          kind === 'invalid_credentials'
            ? t(lang, 'auth_err_credentials')
            : kind === 'rate_limited'
              ? t(lang, 'auth_err_rate_limited')
              : t(lang, 'auth_err_generic'),
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Layout>
      <div className={s.wrap}>
        <h1 className={s.title}>{t(lang, 'auth_login_title')}</h1>

        <form onSubmit={handleSubmit} className={s.form} noValidate>
          <Field
            label={t(lang, 'auth_login_id')}
            value={identifier}
            onChange={setIdentifier}
            error={errors.identifier}
            autoComplete="username"
            autoFocus
            required
          />
          <Field
            type="password"
            label={t(lang, 'auth_password')}
            value={password}
            onChange={setPassword}
            error={errors.password}
            autoComplete="current-password"
            required
          />

          {errors.form && <p className={s.formError}>{errors.form}</p>}

          <button type="submit" className={s.submit} disabled={submitting}>
            {submitting ? t(lang, 'auth_login_submitting') : t(lang, 'auth_login_submit')}
          </button>
        </form>

        <p className={s.alt}>
          {t(lang, 'auth_login_no_account')}{' '}
          <Link to="/register" className={s.altLink}>
            {t(lang, 'auth_login_register_link')}
          </Link>
        </p>
      </div>
    </Layout>
  )
}
