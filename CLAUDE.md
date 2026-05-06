# Gamesite (`loweffort`) — Игровой портал

GitHub: [Syfleshka/loweffort](https://github.com/Syfleshka/loweffort) · Прод: https://loweffort.site

## Описание
Сайт для веб-игр с поддержкой одиночного и мультиплеерного режима.
Функции: регистрация/авторизация, таблицы лидеров, комнаты для мультиплеера, профили игроков.

## Стек

### Frontend
- React 19 + Vite + TypeScript
- React Router — навигация
- SCSS-модули (`*.module.scss` рядом с компонентом) + дизайн-токены в `frontend/src/styles/` ([_tokens.scss](frontend/src/styles/_tokens.scss), [_mixins.scss](frontend/src/styles/_mixins.scss), [global.scss](frontend/src/styles/global.scss)). Темы — через CSS-переменные на `:root` / `.dark` в `global.scss`, без Tailwind
- Axios — HTTP запросы

### Backend
- Node.js + Fastify 5 + TypeScript (ESM)
- better-auth — аутентификация (email/пароль + плагин `username`, 3–24 симв.). Свои таблицы (`Account`, `Verification`) генерируются better-auth CLI.
- Prisma 7 — ORM + миграции (конфиг в [backend/prisma.config.ts](backend/prisma.config.ts)). Рантайм-подключение к Postgres через driver-adapter [`@prisma/adapter-pg`](https://www.npmjs.com/package/@prisma/adapter-pg) (в Prisma 7 `url` в `schema.prisma` запрещён).
- Socket.io — мультиплеер и realtime лидерборды
- PostgreSQL — база данных

### Инфраструктура (VPS)
- VPS `185.221.154.105`, домен `loweffort.site`, проект клонирован в `/home/deploy/loweffort`
- Nginx — reverse proxy + раздача статики, конфиг в `/etc/nginx/sites-available/default`
- PM2 — process manager (запускает бэкенд из [backend/ecosystem.config.cjs](backend/ecosystem.config.cjs))
- Let's Encrypt — HTTPS (managed by Certbot)
- Node.js через nvm у пользователя `deploy`

## Структура репозитория

```
/
├── CLAUDE.md
├── .gitignore
├── .env.example              # для docker-compose (POSTGRES_USER/PASSWORD/DB)
├── docker-compose.yml        # локальный Postgres
├── .github/
│   └── workflows/
│       └── deploy.yml        # auto-deploy в main
├── deploy/
│   ├── bootstrap.sh          # одноразовая первичная настройка сервера
│   ├── deploy.sh             # инкрементальный деплой (CI + руками)
│   ├── init-db.sql           # создание Postgres-юзера/БД на сервере
│   └── nginx-snippet.conf    # блоки для существующего конфига Nginx
├── frontend/
│   ├── src/
│   │   ├── styles/                 # дизайн-токены: _tokens.scss, _mixins.scss, global.scss
│   │   ├── pages/                  # маршруты приложения (Home, Game, Login, Register)
│   │   ├── pages/<page>.module.scss
│   │   ├── pages/games/            # каждая игра — отдельный компонент (TicTacToe и т.д.)
│   │   ├── components/             # переиспользуемые: TopBar, Footer, Field, GameCard, …
│   │   ├── components/<comp>.module.scss
│   │   └── lib/                    # API клиент (axios), auth, i18n, theme/lang hooks, AppProvider
│   ├── vite.config.ts        # react plugin + dev proxy /api и /socket.io на :3000
│   └── tsconfig.json
└── backend/
    ├── src/
    │   ├── index.ts          # Точка входа: Fastify, /api/auth/*, регистрация роутов, Socket.io
    │   ├── lib/
    │   │   ├── prisma.ts     # singleton PrismaClient + PrismaPg driver-adapter
    │   │   ├── auth.ts       # конфиг better-auth (email/password + username plugin)
    │   │   └── session.ts    # getSession() / requireUser() для защищённых роутов
    │   ├── routes/
    │   │   ├── games.ts      # GET /api/games, GET /api/games/:slug
    │   │   ├── scores.ts     # POST /api/scores (auth), GET /api/scores/:gameSlug, /me (auth)
    │   │   └── matches.ts    # POST /api/matches (auth), GET /:id, /:id/join (auth), /:id/finish (auth)
    │   ├── socket/
    │   │   ├── index.ts      # auth handshake через session cookie
    │   │   └── match.ts      # match:join / match:leave / match:move / match:state (релей в комнату match:{id})
    │   └── types/index.ts    # Общие TypeScript типы
    ├── prisma/
    │   ├── schema.prisma     # источник истины для моделей БД
    │   └── migrations/       # коммитятся в git, на проде применяются `migrate deploy`
    ├── prisma.config.ts
    ├── ecosystem.config.cjs  # манифест PM2
    ├── .env.example
    └── tsconfig.json
```

## Команды

```bash
# База данных (локально, Postgres в Docker)
docker compose up -d db          # поднять БД в фоне
docker compose stop db           # остановить
docker compose down              # снести контейнер (volume сохраняется)
docker compose down -v           # снести вместе с данными

# Бэкенд
cd backend && npm run dev        # dev режим (tsx watch)
cd backend && npm run build      # сборка в dist/
cd backend && npm start          # запуск prod сборки

# Фронтенд
cd frontend && npm run dev       # dev режим
cd frontend && npm run build     # сборка в dist/

# Prisma
cd backend && npx prisma migrate dev     # ЛОКАЛЬНО: создать миграцию
cd backend && npx prisma migrate deploy  # ПРОД: применить миграции (вызывается из deploy.sh)
cd backend && npx prisma studio          # GUI для БД
cd backend && npx prisma generate        # обновить Prisma Client

# better-auth (сверить схему better-auth с актуальной)
cd backend && npx @better-auth/cli generate
```

## Переменные окружения

Шаблоны лежат в репо, реальные `.env` — нет (gitignore):
- [.env.example](.env.example) → `.env` в корне (для `docker-compose`)
- [backend/.env.example](backend/.env.example) → `backend/.env` (для бэкенда)

БД называется `loweffort` и в dev, и на проде (юзер тоже `loweffort`).

`BETTER_AUTH_SECRET` генерируется командой `openssl rand -hex 32` (на сервере) или `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

## Модели БД

Источник истины — [backend/prisma/schema.prisma](backend/prisma/schema.prisma).

Кратко:
- `User` — профиль игрока (без поля `password`: пароли лежат в `Account` у better-auth). `username` — опциональное уникальное поле (плагин `username` better-auth, нужно для login по нику + поддержки OAuth-провайдеров без юзернейма). `displayUsername` — оригинальный регистр от того же плагина.
- `Session`, `Account`, `Verification` — модели better-auth (генерируются CLI, не править руками).
- `Game` — каталог игр.
- `Score` — рекорды по играм.
- `Match` + `MatchPlayer` — мультиплеерные матчи (`winnerId` → `User`).

Миграции коммитятся в `backend/prisma/migrations/`. На проде применяются через `prisma migrate deploy` (это делает [deploy/deploy.sh](deploy/deploy.sh)).

## TypeScript типы

Источник истины — [backend/src/types/index.ts](backend/src/types/index.ts). Эти же типы используются и фронтендом (импортируются напрямую или копируются — TBD на этапе 3).

## API эндпоинты

Все роуты под префиксом `/api`. better-auth хэндлится отдельно (catch-all `/api/auth/*`).

### Auth (better-auth)
- `POST /api/auth/sign-up/email` — `{ email, password, name, username }`
- `POST /api/auth/sign-in/email` — `{ email, password }`
- `POST /api/auth/sign-in/username` — `{ username, password }` *(плагин username)*
- `POST /api/auth/sign-out`
- `GET /api/auth/get-session` — текущая сессия + user

Сессия хранится в HTTP-only cookie. Защищённые роуты дёргают `requireUser(request)` из [backend/src/lib/session.ts](backend/src/lib/session.ts).

#### Контракт регистрации/логина на фронте

Регистрация: **логин обязательный + уникальный** (regex `^[a-zA-Z0-9_-]{3,24}$`, проверяется и на фронте, и в `usernameValidator` плагина username), **email опциональный**, пароль ≥ 8 символов с подтверждением. better-auth требует email в схеме, поэтому если пользователь его не дал, фронт синтезирует placeholder `<username>@noemail.local` — `.local` это reserved TLD (RFC 6762), отправить туда что-либо нельзя. Если потом понадобится отличать "настоящий" email от синтетики — фильтровать по домену или по `emailVerified`.

Логин: одно поле "email или логин" + пароль. Фронт смотрит на наличие `@` в строке и зовёт либо `sign-in/email`, либо `sign-in/username`.

Клиент авторизации — [frontend/src/lib/auth.ts](frontend/src/lib/auth.ts). Состояние сессии в [frontend/src/lib/AppProvider.tsx](frontend/src/lib/AppProvider.tsx) (`user`, `isAuthLoading`, `refreshSession`, `signOut` через `useApp()`).

### Games
- `GET /api/games` — каталог
- `GET /api/games/:slug` — одна игра

### Scores
- `POST /api/scores` *(auth)* — `{ gameId, score }`
- `GET /api/scores/:gameSlug?limit=20` — топ-N лидерборд (с join по `User`)
- `GET /api/scores/:gameSlug/me` *(auth)* — личный лучший результат

### Matches
- `POST /api/matches` *(auth)* — `{ gameId }`, создаёт матч в статусе `waiting` и кладёт автора в `MatchPlayer`
- `GET /api/matches/:id` — состояние с игроками и игрой
- `POST /api/matches/:id/join` *(auth)* — присоединиться (проверка `maxPlayers`, статуса)
- `POST /api/matches/:id/finish` *(auth)* — `{ winnerId?, state? }`, переводит в `finished`

### Socket.io
Auth handshake берёт session cookie и валидирует через better-auth. Без сессии коннект отклоняется. Дальше — два набора хендлеров:

#### Generic match relay ([match.ts](backend/src/socket/match.ts))
- `match:join` (matchId) → ack, рассылает `match:peer-joined`
- `match:leave` (matchId) → рассылает `match:peer-left`
- `match:move` (`{ matchId, move }`) → релей как `match:move` с `from: userId`
- `match:state` (`{ matchId, state }`) → релей как `match:state` с `from: userId`

Чистый transport-relay поверх БД-таблицы `Match`. Использовать когда игре достаточно P2P-эха состояний.

#### TTT authoritative ([ttt.ts](backend/src/socket/ttt.ts))
Сервер — источник истины для крестиков-ноликов: валидирует ход, определяет победителя и winning line, шлёт `ttt:state` обоим. State в памяти, никаких записей в БД. Disconnect = форфейт. Комнаты-`waiting` без матча убираются через 30 минут.

- `ttt:create_room` → ack `{ ok, state }` (state.code — 5 символов из `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`)
- `ttt:join_room` (`{ code }`) → ack `{ ok, state }` или `{ ok: false, error: 'room_not_found' | 'room_in_progress' | 'room_full' | 'invalid_code' }`
- `ttt:random_match` → ack `{ ok, state }` если в очереди уже кто-то есть, иначе `{ ok, queued: true }`
- `ttt:cancel_queue` — выйти из random-очереди
- `ttt:cancel_room` (`{ matchId }`) — закрыть комнату-`waiting` (только хост)
- `ttt:move` (`{ matchId, index }`) → ack `{ ok, error? }` (`not_active | invalid_index | cell_taken | not_a_player | not_your_turn | match_not_found`)
- `ttt:leave` (`{ matchId }`) — форфейт
- сервер → клиент: `ttt:state` (PublicState) и `ttt:cancelled` (`{ matchId }`)

## Деплой

Полный цикл уже работает:

```
git push origin main
        ↓
GitHub Actions (.github/workflows/deploy.yml)
        ↓
SSH deploy@185.221.154.105 (ключ из секрета DEPLOY_SSH_KEY)
        ↓
bash /home/deploy/loweffort/deploy/deploy.sh
   • git fetch + reset --hard origin/main
   • npm ci (backend + frontend)
   • prisma generate + migrate deploy
   • npm run build (backend + frontend)
   • chmod o+rX на frontend/dist (для www-data)
   • pm2 reload loweffort-api (zero-downtime)
        ↓
https://loweffort.site обновлён
```

### Артефакты деплоя
- [deploy/bootstrap.sh](deploy/bootstrap.sh) — одноразовая первичная настройка на сервере
- [deploy/deploy.sh](deploy/deploy.sh) — инкрементальный деплой (CI + ручной)
- [deploy/init-db.sql](deploy/init-db.sql) — создание Postgres-юзера/БД
- [deploy/nginx-snippet.conf](deploy/nginx-snippet.conf) — блоки Nginx
- [backend/ecosystem.config.cjs](backend/ecosystem.config.cjs) — манифест PM2
- [.github/workflows/deploy.yml](.github/workflows/deploy.yml) — workflow

### Когда нужно зайти на сервер руками
- Посмотреть логи бэкенда: `pm2 logs loweffort-api`
- Перезапустить: `pm2 restart loweffort-api`
- Глянуть Nginx: `sudo tail -f /var/log/nginx/error.log`
- Поправить конфиг Nginx: `sudo nano /etc/nginx/sites-available/default`, потом `sudo nginx -t && sudo systemctl reload nginx`

### GitHub Secrets
- `DEPLOY_SSH_KEY` — приватный SSH-ключ для входа от имени `deploy@185.221.154.105`. Публичная пара лежит в `~deploy/.ssh/authorized_keys` на VPS.

## Соглашения

- Ветка `main` = прод. Работаем в фиче-ветках (`feat/*`, `fix/*`), мерджим через PR.
- Все API роуты с префиксом `/api/`
- Общие типы — в [backend/src/types/index.ts](backend/src/types/index.ts)
- Socket.io handlers — в `backend/src/socket/`
- Каждая игра — отдельный компонент в `frontend/src/pages/games/`
- Score отправляется на `/api/scores` после окончания игры
- Миграции БД создавать **только локально** (`migrate dev`), коммитить в git, применять на проде автоматически через `migrate deploy` в pipeline

## Прогресс по этапам

- [x] Этап 1 — Инфраструктура VPS (Nginx, PM2, PostgreSQL, HTTPS, auto-deploy через GitHub Actions)
- [x] Этап 2 — Бэкенд: better-auth (email/password + username plugin), Prisma + pg-adapter, REST роуты (`games`, `scores`, `matches`), Socket.io match-handlers как фундамент под этап 5
- [x] Этап 3 — Фронтенд: главная (каталог), маршрутизация, axios-клиент, theme/lang в context, формы регистрации и логина
- [x] Этап 4 — Первая игра: крестики-нолики на `/games/tictactoe` (hot-seat / комната по коду / случайный противник)
- [x] Этап 5 — Мультиплеер для TTT через Socket.io ([backend/src/socket/ttt.ts](backend/src/socket/ttt.ts) — авторитетный сервер)
