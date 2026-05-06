import { useId } from 'react'

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
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="flex items-baseline gap-2 font-mono text-[11px] tracking-[0.06em] text-fg-3"
      >
        <span className="text-fg-2">{label}</span>
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
        className={`le-input ${error ? 'is-error' : ''}`}
      />
      {error && <span className="le-form-error">{error}</span>}
    </div>
  )
}
