import { useId } from 'react'
import s from './Field.module.scss'

interface Props {
  label: string
  hint?: string
  value: string
  onChange: (v: string) => void
  error?: string
  type?: 'text' | 'email' | 'password'
  autoComplete?: string
  autoFocus?: boolean
  required?: boolean
}

export function Field({
  label,
  hint,
  value,
  onChange,
  error,
  type = 'text',
  autoComplete,
  autoFocus,
  required,
}: Props) {
  const id = useId()
  return (
    <div className={s.field}>
      <label htmlFor={id} className={s.label}>
        <span className={s.labelMain}>{label}</span>
        {hint && <span>{hint}</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        required={required}
        aria-invalid={!!error}
        className={`${s.input} ${error ? s.invalid : ''}`}
      />
      {error && <span className={s.error}>{error}</span>}
    </div>
  )
}
