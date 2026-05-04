# Gamesite — Игровой портал

## Описание
Сайт для веб-игр с поддержкой одиночного и мультиплеерного режима.
Функции: регистрация/авторизация, таблицы лидеров, комнаты для мультиплеера, профили игроков.

## Стек

### Frontend
- React 19 + Vite + TypeScript
- React Router — навигация
- Tailwind CSS **v4** (через `@tailwindcss/vite`, без PostCSS-конфига)
- Axios — HTTP запросы

### Backend
- Node.js + Fastify 5 + TypeScript (ESM)
- better-auth — аутентификация (email/пароль, OAuth). Свои таблицы (`Account`, `Verification`) генерируются better-auth CLI.
- Prisma 7 — ORM + миграции (конфиг в `backend/prisma.config.ts`)
- Socket.io — мультиплеер и realtime лидерборды
- PostgreSQL — база данных

### Инфраструктура (VPS)
- Nginx — reverse proxy + раздача статики
- PM2 — process manager
- Let's Encrypt — HTTPS

## Целевая структура проекта

> Это **план**. Папки `routes/`, `socket/`, `pages/`, `components/`, `lib/` пока не созданы — добавляются по мере работы над этапами 2–3.

```
/
├── CLAUDE.md
├── .gitignore
├── frontend/
│   ├── src/
│   │   ├── pages/         # маршруты приложения
│   │   ├── pages/games/   # каждая игра — отдельный компонент
│   │   ├── components/
│   │   └── lib/           # API клиент (axios), socket клиент
│   ├── vite.config.ts     # сюда подключается @tailwindcss/vite
│   └── tsconfig.json
│
└── backend/
    ├── src/
    │   ├── index.ts       # Точка входа, Fastify + Socket.io
    │   ├── routes/        # auth, games, scores, matches
    │   ├── socket/        # Socket.io handlers
    │   └── types/index.ts # Общие TypeScript типы
    ├── prisma/
    │   └── schema.prisma  # источник истины для моделей БД
    ├── prisma.config.ts
    ├── tsconfig.json
    └── .env
```

## Команды

```bash
# База данных (Postgres в Docker)
docker compose up -d db          # поднять БД в фоне
docker compose stop db           # остановить
docker compose down              # снести контейнер (volume gamesite-db-data сохраняется)
docker compose down -v           # снести вместе с данными

# Бэкенд
cd backend && npm run dev        # dev режим (tsx watch)
cd backend && npm run build      # сборка в dist/
cd backend && npm start          # запуск prod сборки

# Фронтенд
cd frontend && npm run dev       # dev режим
cd frontend && npm run build     # сборка в dist/

# Prisma
cd backend && npx prisma migrate dev     # создать и применить миграцию
cd backend && npx prisma migrate deploy  # применить миграции на проде
cd backend && npx prisma studio          # GUI для БД
cd backend && npx prisma generate        # обновить Prisma Client

# better-auth (сгенерировать недостающие модели в schema.prisma)
cd backend && npx @better-auth/cli generate
```

## Переменные окружения

`backend/.env`:
```env
DATABASE_URL="postgresql://gamesite:пароль@localhost:5432/gamesite_db"
BETTER_AUTH_SECRET="длинная_случайная_строка"
BETTER_AUTH_URL="https://твой_домен.com"
FRONTEND_URL="https://твой_домен.com"
PORT=3000
```

> better-auth сам управляет хранением паролей, сессий и OAuth-аккаунтов — отдельный `JWT_SECRET` не нужен.

## Модели БД

Источник истины — [backend/prisma/schema.prisma](backend/prisma/schema.prisma).

Кратко:
- `User` — профиль игрока (без поля `password`: пароли лежат в `Account` у better-auth).
- `Session`, `Account`, `Verification` — модели better-auth (генерируются CLI, не править руками).
- `Game` — каталог игр.
- `Score` — рекорды по играм.
- `Match` + `MatchPlayer` — мультиплеерные матчи.

## TypeScript типы

Источник истины — [backend/src/types/index.ts](backend/src/types/index.ts). Эти же типы используются и фронтендом (импортируются напрямую или копируются — TBD на этапе 3).

## Деплой

Прод: VPS `185.221.154.105`, домен `loweffort.site`, проект клонирован в `/home/deploy/loweffort`.

Артефакты в репо:
- [deploy/bootstrap.sh](deploy/bootstrap.sh) — одноразовая первичная настройка на сервере
- [deploy/deploy.sh](deploy/deploy.sh) — инкрементальный деплой (вызывается из CI и вручную)
- [deploy/init-db.sql](deploy/init-db.sql) — создание Postgres-юзера/БД
- [deploy/nginx-snippet.conf](deploy/nginx-snippet.conf) — блоки для существующего конфига Nginx
- [backend/ecosystem.config.cjs](backend/ecosystem.config.cjs) — манифест PM2
- [.github/workflows/deploy.yml](.github/workflows/deploy.yml) — авто-деплой на push в `main`

### Первичная настройка (один раз)

См. [deploy/bootstrap.sh](deploy/bootstrap.sh) — скрипт ведёт за руку.

### GitHub Actions

Workflow слушает push в `main` и `workflow_dispatch`. На сервер заходит SSH-ключом из секрета `DEPLOY_SSH_KEY`. Чтобы поднять:

1. На локальной машине: `ssh-keygen -t ed25519 -f ~/.ssh/loweffort_deploy -C "github-actions"` (без passphrase)
2. Публичную часть `~/.ssh/loweffort_deploy.pub` добавить в `~deploy/.ssh/authorized_keys` на VPS
3. Приватную часть (`~/.ssh/loweffort_deploy`) скопировать в GitHub: Repo → Settings → Secrets and variables → Actions → New repository secret → имя `DEPLOY_SSH_KEY`

## Соглашения

- Все API роуты с префиксом `/api/`
- Общие типы — в [backend/src/types/index.ts](backend/src/types/index.ts)
- Socket.io handlers — в `backend/src/socket/`
- Каждая игра — отдельный компонент в `frontend/src/pages/games/`
- Score отправляется на `/api/scores` после окончания игры

## Прогресс по этапам

- [x] Этап 1 — Инфраструктура VPS (Nginx, PM2, PostgreSQL, HTTPS)
- [ ] Этап 2 — Бэкенд: auth (better-auth) + API роуты (`routes/auth`, `routes/games`, `routes/scores`, `routes/matches`)
- [ ] Этап 3 — Фронтенд: базовые страницы, axios-клиент, socket-клиент
- [ ] Этап 4 — Первая игра
- [ ] Этап 5 — Мультиплеер
