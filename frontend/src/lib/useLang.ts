import { useCallback, useEffect, useState } from 'react'
import type { Lang } from './i18n'

const STORAGE_KEY = 'lang'

const isLang = (v: unknown): v is Lang => v === 'ru' || v === 'en'

const readStored = (): Lang | null => {
  if (typeof localStorage === 'undefined') return null
  const v = localStorage.getItem(STORAGE_KEY)
  return isLang(v) ? v : null
}

export function useLang() {
  const [lang, setLangState] = useState<Lang>(() => readStored() ?? 'ru')

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((next: Lang) => {
    localStorage.setItem(STORAGE_KEY, next)
    setLangState(next)
  }, [])

  return { lang, setLang }
}
