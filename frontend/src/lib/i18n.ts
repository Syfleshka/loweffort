export type Lang = 'ru' | 'en'

export const STRINGS = {
  ru: {
    nav_login: 'войти',
    nav_register: 'Регистрация',
    players_solo: 'Один игрок',
    players_multi: 'до {n} игроков',
    play: 'Играть',
    footer_made: 'Сделано на минималках в Москве.',
    footer_online: 'онлайн сейчас',
    theme_light: 'Светлая',
    theme_dark: 'Тёмная',
    state_loading: 'загрузка',
    state_error: 'не удалось загрузить',
    state_empty: 'пока пусто',
  },
  en: {
    nav_login: 'log in',
    nav_register: 'Sign up',
    players_solo: 'Single player',
    players_multi: 'up to {n} players',
    play: 'Play',
    footer_made: 'Made on a low-effort budget in Moscow.',
    footer_online: 'online now',
    theme_light: 'Light',
    theme_dark: 'Dark',
    state_loading: 'loading',
    state_error: 'failed to load',
    state_empty: 'nothing yet',
  },
} as const

export type StringKey = keyof typeof STRINGS['ru']

export const t = (lang: Lang, key: StringKey): string => STRINGS[lang][key]
