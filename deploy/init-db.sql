-- Создание Postgres-юзера и БД для проекта.
-- Запускать на сервере один раз:
--   sudo -u postgres psql -f /home/deploy/loweffort/deploy/init-db.sql
--
-- ВАЖНО: подставь нормальный пароль вместо CHANGE_ME ПЕРЕД выполнением,
-- и тот же пароль пропиши в /home/deploy/loweffort/backend/.env (DATABASE_URL).

CREATE USER loweffort WITH PASSWORD 'CHANGE_ME';
CREATE DATABASE loweffort OWNER loweffort;
GRANT ALL PRIVILEGES ON DATABASE loweffort TO loweffort;
