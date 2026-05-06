import s from './ScreenshotPlaceholder.module.scss'

interface Props {
  label: string
}

export function ScreenshotPlaceholder({ label }: Props) {
  const id = `sg-${label.replace(/\W+/g, '-').toLowerCase()}`
  return (
    <svg
      className={s.svg}
      viewBox="0 0 400 260"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id={id}
          width="8"
          height="8"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(35)"
        >
          <rect width="8" height="8" fill="oklch(0.78 0 0)" />
          <line x1="0" y1="0" x2="0" y2="8" stroke="oklch(0.72 0 0)" strokeWidth="3" />
        </pattern>
      </defs>
      <rect width="400" height="260" fill={`url(#${id})`} />
      <text
        x="20"
        y="244"
        fontFamily="ui-monospace, 'JetBrains Mono', monospace"
        fontSize="10"
        letterSpacing="0.08em"
        fill="oklch(0.32 0 0)"
        opacity="0.7"
      >
        SCREENSHOT — {label.toUpperCase()}
      </text>
    </svg>
  )
}
