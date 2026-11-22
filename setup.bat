@echo off
if not exist .env copy .env.example .env
call composer install
php artisan key:generate
php artisan migrate --seed --force
php artisan storage:link
call npm install
call npm run build
echo.
echo Done. Run: php artisan serve   then open http://localhost:8000
