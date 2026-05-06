#!/usr/bin/env bash
# Инкрементальный деплой. Вызывается:
#  - вручную после bootstrap.sh
#  - GitHub Actions при пуше в main
#
# Шаги: pull → install → migrate → build → reload PM2.
# Если что-то падает на середине — старая версия остаётся работать (PM2 reload использует
# zero-downtime рестарт; в случае краша старый процесс остаётся живой).

set -euo pipefail

# Добавляем Node (из nvm) в PATH. Non-interactive SSH сессии (GitHub Actions)
# не читают .bashrc, где обычно прописан nvm — поэтому npm/node/pm2 без этого
# не находятся. Не сорсим nvm.sh, потому что он не всегда выставляет PATH;
# вместо этого добавляем bin последней установленной версии Node напрямую.
export NVM_DIR="$HOME/.nvm"
if [ -d "$NVM_DIR/versions/node" ]; then
    NODE_BIN="$NVM_DIR/versions/node/$(ls -1 "$NVM_DIR/versions/node" | sort -V | tail -1)/bin"
    export PATH="$NODE_BIN:$PATH"
fi

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
# Каталог игр — идемпотентный upsert, безопасно гонять каждый деплой.
npm run seed
npm run build

# ─── Frontend ──────────────────────────────────────────────────
echo "▶ Frontend: install + build"
cd "$PROJECT_DIR/frontend"
npm ci
npm run build
# Права для Nginx (www-data): он должен читать dist/, иначе 500 на index.html.
chmod -R o+rX dist
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
