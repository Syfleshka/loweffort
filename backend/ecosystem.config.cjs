// PM2 process manifest. Загружается командой `pm2 start ecosystem.config.cjs`.
// Файл .cjs (а не .js), потому что в backend/package.json стоит "type": "module",
// а PM2 читает конфиг через require().
module.exports = {
  apps: [
    {
      name: 'loweffort-api',
      cwd: __dirname,
      script: 'dist/index.js',
      // --env-file=.env требует Node 20.6+. На сервере стоит свежий Node.
      node_args: '--env-file=.env',
      exec_mode: 'fork',
      instances: 1,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
}
