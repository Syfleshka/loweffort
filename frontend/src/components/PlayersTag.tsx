import type { Lang } from '../lib/i18n'
import { t } from '../lib/i18n'
import s from './PlayersTag.module.scss'

interface Props {
  n: number
  lang: Lang
}

export function PlayersTag({ n, lang }: Props) {
  const label =
    n <= 1 ? t(lang, 'players_solo') : t(lang, 'players_multi').replace('{n}', String(n))
  const dotCount = Math.max(1, n)

  return (
    <span className={s.tag}>
      <span className={s.dots} aria-hidden="true">
        {Array.from({ length: dotCount }).map((_, i) => (
          <span key={i} className={s.dot} />
        ))}
        {n === 1 && <span className={`${s.dot} ${s.dotEmpty}`} />}
      </span>
      {label}
    </span>
  )
}
