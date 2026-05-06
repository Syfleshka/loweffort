import { Link } from 'react-router-dom'
import type { Game } from '../types'
import type { Lang } from '../lib/i18n'
import { t } from '../lib/i18n'
import { PlayersTag } from './PlayersTag'
import { ScreenshotPlaceholder } from './ScreenshotPlaceholder'
import s from './GameCard.module.scss'

interface Props {
  game: Game
  lang: Lang
}

export function GameCard({ game, lang }: Props) {
  return (
    <Link to={`/games/${game.slug}`} className={s.card}>
      <div className={s.cover}>
        {game.thumbnail ? (
          <img src={game.thumbnail} alt="" className={s.thumb} loading="lazy" />
        ) : (
          <ScreenshotPlaceholder label={game.title} />
        )}
        <div className={s.overlay}>
          {game.description && <p className={s.desc}>{game.description}</p>}
          <span className={s.cta}>
            {t(lang, 'play')}
            <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
              <path
                d="M2 8h11M9 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      </div>
      <div className={s.foot}>
        <h3 className={s.title}>{game.title}</h3>
        <PlayersTag n={game.maxPlayers} lang={lang} />
      </div>
    </Link>
  )
}

export function GameCardSkeleton() {
  return (
    <div className={s.skeleton} aria-hidden="true">
      <div className={s.skelCover} />
      <div className={s.skelFoot}>
        <div className={s.skelLine} />
        <div className={s.skelTag} />
      </div>
    </div>
  )
}
