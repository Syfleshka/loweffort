# Gamesite (`loweffort`) — Игровой портал

GitHub: [Syfleshka/loweffort](https://github.com/Syfleshka/loweffort) · Прод: https://loweffort.site

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
- Prisma 7 — ORM + миграции (конфиг в [backend/prisma.config.ts](backend/prisma.config.ts))
- Socket.io — мультиплеер и realtime лидерборды
- PostgreSQL — база данных

### Инфраструктура (VPS)
- VPS `185.221.154.105`, домен `loweffort.site`, проект клонирован в `/home/deploy/loweffort`
- Nginx — reverse proxy + раздача статики, конфиг в `/etc/nginx/sites-available/default`
- PM2 — process manager (запускает бэкенд из [backend/ecosystem.config.cjs](backend/ecosystem.config.cjs))
- Let's Encrypt — HTTPS (managed by Certbot)
- Node.js через nvm у пользователя `deploy`

## Структура репозитория

> Папки `routes/`, `socket/`, `pages/`, `components/`, `lib/` помечены как **целевые** — пока не созданы, появляются по мере работы над этапами 2–3.

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
│   │   ├── pages/            # маршруты приложения (целевая)
│   │   ├── pages/games/      # каждая игра — отдельный компонент (целевая)
│   │   ├── components/       # (целевая)
│   │   └── lib/              # API клиент (axios), socket клиент (целевая)
│   ├── vite.config.ts        # подключён @tailwindcss/vite
│   └── tsconfig.json
└── backend/
    ├── src/
    │   ├── index.ts          # Точка входа, Fastify + Socket.io
    │   ├── routes/           # auth, games, scores, matches (целевая)
    │   ├── socket/           # Socket.io handlers (целевая)
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
- `User` — профиль игрока (без поля `password`: пароли лежат в `Account` у better-auth).
- `Session`, `Account`, `Verification` — модели better-auth (генерируются CLI, не править руками).
- `Game` — каталог игр.
- `Score` — рекорды по играм.
- `Match` + `MatchPlayer` — мультиплеерные матчи (`winnerId` → `User`).

Миграции коммитятся в `backend/prisma/migrations/`. На проде применяются через `prisma migrate deploy` (это делает [deploy/deploy.sh](deploy/deploy.sh)).

## TypeScript типы

Источник истины — [backend/src/types/index.ts](backend/src/types/index.ts). Эти же типы используются и фронтендом (импортируются напрямую или копируются — TBD на этапе 3).

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
- [ ] Этап 2 — Бэкенд: auth (better-auth) + API роуты (`routes/auth`, `routes/games`, `routes/scores`, `routes/matches`)
- [ ] Этап 3 — Фронтенд: базовые страницы, axios-клиент, socket-клиент
- [ ] Этап 4 — Первая игра
- [ ] Этап 5 — Мультиплеер
