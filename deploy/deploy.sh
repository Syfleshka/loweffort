#!/usr/bin/env bash
# Инкрементальный деплой. Вызывается:
#  - вручную после bootstrap.sh
#  - GitHub Actions при пуше в main
#
# Шаги: pull → install → migrate → build → reload PM2.
# Если что-то падает на середине — старая версия остаётся работать (PM2 reload использует
# zero-downtime рестарт; в случае краша старый процесс остаётся живой).

set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/home/deploy/loweffort}"
BRANCH="${BRANCH:-main}"
PM2_APP="loweffort-api"

cd "$PROJECT_DIR"

echo "▶ git pull"
git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"

# ─── Backend ───────────────────────────────────────────────────
echo "▶ Backend: install + migrate + build"
cd "$PROJECT_DIR/backend"
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build

# ─── Frontend ──────────────────────────────────────────────────
echo "▶ Frontend: install + build"
cd "$PROJECT_DIR/frontend"
npm ci
npm run build
# Nginx раздаёт frontend/dist напрямую, рестарт не нужен.

# ─── PM2 ───────────────────────────────────────────────────────
cd "$PROJECT_DIR/backend"
if pm2 describe "$PM2_APP" >/dev/null 2>&1; then
  echo "▶ pm2 reload $PM2_APP"
  pm2 reload "$PM2_APP" --update-env
else
  echo "▶ pm2 start (первый запуск)"
  pm2 start ecosystem.config.cjs
  pm2 save
fi

echo "✓ Deploy ok"
