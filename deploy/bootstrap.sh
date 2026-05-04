#!/usr/bin/env bash
# Одноразовая первичная настройка проекта на VPS.
# Запускать на сервере как пользователь deploy:
#   bash <(curl -fsSL https://raw.githubusercontent.com/Syfleshka/loweffort/main/deploy/bootstrap.sh)
# или, если репо приватный, сначала склонить руками и потом:
#   bash /home/deploy/loweffort/deploy/bootstrap.sh
#
# Скрипт идемпотентный — повторный запуск ничего не сломает.

set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/Syfleshka/loweffort.git}"
PROJECT_DIR="${PROJECT_DIR:-/home/deploy/loweffort}"
BRANCH="${BRANCH:-main}"

echo "▶ Bootstrap: $PROJECT_DIR (ветка $BRANCH)"

# ─── 1. Проверки окружения ─────────────────────────────────────
command -v node    >/dev/null || { echo "✗ Node.js не установлен"; exit 1; }
command -v npm     >/dev/null || { echo "✗ npm не установлен"; exit 1; }
command -v pm2     >/dev/null || { echo "✗ PM2 не установлен (npm i -g pm2)"; exit 1; }
command -v psql    >/dev/null || { echo "✗ PostgreSQL не установлен"; exit 1; }
command -v nginx   >/dev/null || { echo "✗ Nginx не установлен"; exit 1; }

NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
if [ "$NODE_MAJOR" -lt 20 ]; then
  echo "✗ Нужен Node.js ≥ 20 (стоит $(node -v))"
  exit 1
fi

# ─── 2. Клонируем репо (если ещё нет) ──────────────────────────
if [ ! -d "$PROJECT_DIR/.git" ]; then
  echo "▶ Клонирую $REPO_URL → $PROJECT_DIR"
  mkdir -p "$(dirname "$PROJECT_DIR")"
  git clone --branch "$BRANCH" "$REPO_URL" "$PROJECT_DIR"
else
  echo "▶ Репо уже есть, делаю pull"
  git -C "$PROJECT_DIR" fetch origin "$BRANCH"
  git -C "$PROJECT_DIR" checkout "$BRANCH"
  git -C "$PROJECT_DIR" reset --hard "origin/$BRANCH"
fi

# ─── 3. Подсказка по .env ──────────────────────────────────────
if [ ! -f "$PROJECT_DIR/backend/.env" ]; then
  cp "$PROJECT_DIR/backend/.env.example" "$PROJECT_DIR/backend/.env"
  cat <<EOF

⚠ ВНИМАНИЕ: создан $PROJECT_DIR/backend/.env из шаблона.
   Открой его и подставь:
   - DATABASE_URL (с реальным паролем БД)
   - BETTER_AUTH_SECRET (сгенерируй: openssl rand -hex 32)
   - BETTER_AUTH_URL=https://loweffort.site
   - FRONTEND_URL=https://loweffort.site

   Затем:
   1. sudo -u postgres psql -f $PROJECT_DIR/deploy/init-db.sql
      (предварительно правь пароль в init-db.sql, чтобы совпадал с .env)
   2. bash $PROJECT_DIR/deploy/deploy.sh
   3. pm2 startup   # один раз: PM2 будет подниматься после ребута
   4. pm2 save      # сохранить текущий список процессов

EOF
  exit 0
fi

# ─── 4. Если .env уже есть — гоняем deploy.sh ──────────────────
echo "▶ .env найден, запускаю deploy.sh"
bash "$PROJECT_DIR/deploy/deploy.sh"
