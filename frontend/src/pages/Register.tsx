import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { Field } from '../components/Field'
import { useApp } from '../lib/appContext'
import { t } from '../lib/i18n'
import {
  classifyAuthError,
  EMAIL_RE,
  MIN_PASSWORD_LENGTH,
  register,
  USERNAME_RE,
} from '../lib/auth'
import s from './Auth.module.scss'

interface FieldErrors {
  username?: string
  email?: string
  password?: string
  confirm?: string
  form?: string
}

export default function Register() {
  const { lang, user, isAuthLoading, refreshSession } = useApp()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isAuthLoading && user) navigate('/', { replace: true })
  }, [isAuthLoading, user, navigate])

  function validate(): FieldErrors {
    const e: FieldErrors = {}
    const trimmedName = username.trim()
    if (!USERNAME_RE.test(trimmedName)) {
      e.username =
        trimmedName.length < 3 || trimmedName.length > 24
          ? t(lang, 'reg_err_username_length')
          : t(lang, 'reg_err_username_format')
    }
    if (email.trim() && !EMAIL_RE.test(email.trim())) {
      e.email = t(lang, 'reg_err_email_format')
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      e.password = t(lang, 'reg_err_password_short')
    }
    if (password !== confirm) {
      e.confirm = t(lang, 'reg_err_password_mismatch')
    }
    return e
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length > 0) return

    setSubmitting(true)
    try {
      await register({
        username: username.trim(),
        email: email.trim() || undefined,
        password,
      })
      await refreshSession()
      navigate('/', { replace: true })
    } catch (err) {
      const kind = classifyAuthError(err)
      setErrors({
        form:
          kind === 'taken'
            ? t(lang, 'reg_err_taken')
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
        <h1 className={s.title}>{t(lang, 'reg_title')}</h1>

        <form onSubmit={handleSubmit} className={s.form} noValidate>
          <Field
            label={t(lang, 'reg_username')}
            value={username}
            onChange={setUsername}
            error={errors.username}
            autoComplete="username"
            autoFocus
            required
          />
          <Field
            type="email"
            label={t(lang, 'reg_email')}
            hint={t(lang, 'reg_optional')}
            value={email}
            onChange={setEmail}
            error={errors.email}
            autoComplete="email"
          />
          <Field
            type="password"
            label={t(lang, 'auth_password')}
            value={password}
            onChange={setPassword}
            error={errors.password}
            autoComplete="new-password"
            required
          />
          <Field
            type="password"
            label={t(lang, 'reg_password_confirm')}
            value={confirm}
            onChange={setConfirm}
            error={errors.confirm}
            autoComplete="new-password"
            required
          />

          {errors.form && <p className={s.formError}>{errors.form}</p>}

          <button type="submit" className={s.submit} disabled={submitting}>
            {submitting ? t(lang, 'reg_submitting') : t(lang, 'reg_submit')}
          </button>
        </form>

        <p className={s.alt}>
          {t(lang, 'reg_have_account')}{' '}
          <Link to="/login" className={s.altLink}>
            {t(lang, 'reg_login_link')}
          </Link>
        </p>
      </div>
    </Layout>
  )
}
