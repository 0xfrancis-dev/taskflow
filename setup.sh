#!/usr/bin/env bash
# One-command setup for TaskFlow.  Usage:  ./setup.sh          (MySQL, edit .env first)
#                                          ./setup.sh sqlite   (zero-config local database)
set -e
[ -f .env ] || cp .env.example .env

if [ "$1" = "sqlite" ]; then
  sed -i.bak 's/^DB_CONNECTION=.*/DB_CONNECTION=sqlite/' .env && rm -f .env.bak
  touch database/database.sqlite
fi

composer install
php artisan key:generate
php artisan migrate --seed --force
php artisan storage:link || true
npm install
npm run build

echo ""
echo "Done. Start the app with:  php artisan serve   then open http://localhost:8000"
echo "Admin login: see ADMIN_EMAIL / ADMIN_PASSWORD in .env (default admin@taskflow.test / Admin@12345)"
