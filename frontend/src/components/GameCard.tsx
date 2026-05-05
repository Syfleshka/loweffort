import { Link } from 'react-router-dom'
import type { Game } from '../types'
import type { Lang } from '../lib/i18n'
import { t } from '../lib/i18n'
import { PlayersTag } from './PlayersTag'
import { ScreenshotPlaceholder } from './ScreenshotPlaceholder'

interface Props {
  game: Game
  lang: Lang
}

export function GameCard({ game, lang }: Props) {
  return (
    <Link to={`/games/${game.slug}`} className="le-card flex flex-col gap-[14px]">
      <div className="relative aspect-[4/3] overflow-hidden rounded-[4px] border border-line bg-bg-2">
        {game.thumbnail ? (
          <img
            src={game.thumbnail}
            alt=""
            className="block h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <ScreenshotPlaceholder label={game.title} />
        )}
        <div className="le-card-overlay">
          {game.description && (
            <p className="m-0 font-serif text-[15px] leading-[1.45] text-fg">
              {game.description}
            </p>
          )}
          <span className="inline-flex items-center gap-2 self-start font-mono text-[11px] uppercase tracking-[0.12em] text-fg-2">
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
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="le-card-title m-0 font-serif text-[20px] font-medium tracking-[-0.005em] transition-colors duration-150">
          {game.title}
        </h3>
        <PlayersTag n={game.maxPlayers} lang={lang} />
      </div>
    </Link>
  )
}

export function GameCardSkeleton() {
  return (
    <div className="flex flex-col gap-[14px]" aria-hidden="true">
      <div className="aspect-[4/3] rounded-[4px] border border-line bg-bg-2" />
      <div className="flex items-baseline justify-between gap-4">
        <div className="h-[20px] w-2/3 rounded-sm bg-bg-2" />
        <div className="h-[11px] w-20 rounded-sm bg-bg-2" />
      </div>
    </div>
  )
}
