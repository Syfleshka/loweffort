import type { Lang } from '../lib/i18n'

interface Props {
  lang: Lang
  setLang: (l: Lang) => void
}

export function LangToggle({ lang, setLang }: Props) {
  return (
    <div className="le-lang inline-flex items-center gap-[6px] text-line-2" role="group" aria-label="Language">
      <button type="button" data-active={lang === 'ru'} onClick={() => setLang('ru')}>
        ru
      </button>
      <span aria-hidden="true">/</span>
      <button type="button" data-active={lang === 'en'} onClick={() => setLang('en')}>
        en
      </button>
    </div>
  )
}
