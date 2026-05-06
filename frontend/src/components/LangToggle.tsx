import type { Lang } from '../lib/i18n'
import s from './LangToggle.module.scss'

interface Props {
  lang: Lang
  setLang: (l: Lang) => void
}

export function LangToggle({ lang, setLang }: Props) {
  return (
    <div className={s.group} role="group" aria-label="Language">
      <button
        type="button"
        className={s.btn}
        data-active={lang === 'ru'}
        onClick={() => setLang('ru')}
      >
        ru
      </button>
      <span aria-hidden="true">/</span>
      <button
        type="button"
        className={s.btn}
        data-active={lang === 'en'}
        onClick={() => setLang('en')}
      >
        en
      </button>
    </div>
  )
}
