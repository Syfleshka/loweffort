import type { Lang } from '../lib/i18n'
import { t } from '../lib/i18n'

interface Props {
  n: number
  lang: Lang
}

export function PlayersTag({ n, lang }: Props) {
  const label =
    n <= 1 ? t(lang, 'players_solo') : t(lang, 'players_multi').replace('{n}', String(n))
  const dotCount = Math.max(1, n)

  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap font-mono text-[11px] tracking-[0.06em] text-fg-2">
      <span className="inline-flex gap-[3px]" aria-hidden="true">
        {Array.from({ length: dotCount }).map((_, i) => (
          <span key={i} className="inline-block h-[6px] w-[6px] rounded-full bg-fg" />
        ))}
        {n === 1 && (
          <span className="inline-block h-[6px] w-[6px] rounded-full border border-line-2" />
        )}
      </span>
      {label}
    </span>
  )
}
