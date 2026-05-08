# loweffort — игровой портал

Веб-сайт с играми (одиночка + мультиплеер): авторизация, лидерборды, комнаты, профили.

**Прод:** [loweffort.site](https://loweffort.site)

## Стек (TL;DR)

- **Frontend:** React 19 + Vite + TypeScript, SCSS-модули, Axios
- **Backend:** Node.js + Fastify 5 (ESM, TS), better-auth, Prisma 7, Socket.io
- **БД:** PostgreSQL
- **Прод:** VPS + Nginx + PM2 + Let's Encrypt, auto-deploy через GitHub Actions

Подробное описание архитектуры, моделей БД, API-роутов, Socket.io-хендлеров и пайплайна деплоя — в [CLAUDE.md](CLAUDE.md).

## Игры

- **Крестики-нолики** (`/games/tictactoe`) — hot-seat, комната по коду, рандомный матч (Socket.io, авторитетный сервер)
- **Морской бой** (`/games/battleships`)

## Быстрый старт (локально)

Нужны: Node.js 20+, Docker, npm.

```bash
# 1. .env-файлы
cp .env.example .env
cp backend/.env.example backend/.env
# отредактируй пароли и BETTER_AUTH_SECRET (см. комментарии внутри)

# 2. PostgreSQL в Docker
docker compose up -d db

# 3. Backend
cd backend
npm ci
npx prisma migrate deploy
npm run dev          # http://localhost:3000

# 4. Frontend (в новом терминале)
cd frontend
npm ci
npm run dev          # http://localhost:5173
```

Vite проксирует `/api` и `/socket.io` на бэкенд автоматически (см. [frontend/vite.config.ts](frontend/vite.config.ts)).

Полный список команд (Prisma, better-auth CLI, build) — в [CLAUDE.md → Команды](CLAUDE.md#команды).

## Деплой

`git push origin main` → GitHub Actions → SSH на VPS → [deploy/deploy.sh](deploy/deploy.sh) → PM2 reload.

Детали (bootstrap сервера, секреты, ручные операции) — в [CLAUDE.md → Деплой](CLAUDE.md#деплой).

## Структура репозитория

```
backend/    Fastify + Prisma + Socket.io
frontend/   React + Vite
deploy/     bootstrap.sh, deploy.sh, init-db.sql, nginx-snippet.conf
.github/    workflow auto-deploy
```

Полное дерево с пояснениями — в [CLAUDE.md → Структура репозитория](CLAUDE.md#структура-репозитория).

## Контрибьютинг

- Ветка `main` = прод, работаем через `feat/*` / `fix/*` + PR.
- Миграции БД создавать **только локально** (`prisma migrate dev`), коммитить в git — на проде применятся автоматически.
- Общие TS-типы — в [backend/src/types/index.ts](backend/src/types/index.ts).

Соглашения целиком — в [CLAUDE.md → Соглашения](CLAUDE.md#соглашения).
