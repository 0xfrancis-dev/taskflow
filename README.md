# TaskFlow

A task-marketplace platform: advertisers fund campaigns, users complete simple online tasks and get paid into a wallet, with referrals, submission review and a full admin dashboard.

**Stack:** Laravel 11 (API, Sanctum token auth) · React 18 + React Router · Tailwind CSS 3 · MySQL (SQLite also supported) · Vite · Google Material Symbols + Google Fonts.

Support email shown across the site and used for contact-form delivery: **francis.audits@gmail.com**

## Requirements
PHP 8.2+ (with pdo_mysql or pdo_sqlite, mbstring, openssl, fileinfo), Composer 2, Node 18+, MySQL 8 (or SQLite).

## Install
```bash
# MySQL: create an empty database called "taskflow", then edit DB_* in .env
./setup.sh            # Windows: setup.bat
# or zero-config local database:
./setup.sh sqlite

php artisan serve     # http://localhost:8000
```
For live front-end editing run `npm run dev` in a second terminal (instead of using the built files).

Manual steps if you prefer: `cp .env.example .env && composer install && php artisan key:generate && php artisan migrate --seed && php artisan storage:link && npm install && npm run build`

## Accounts created by the seeder
| Role | Email | Password |
|---|---|---|
| Admin | admin@taskflow.test | Admin@12345 |
| Advertiser (demo) | advertiser@taskflow.test | Password123 |
| Earner (demo) | user@taskflow.test | Password123 |

Change `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env` before seeding a real server, and set `SEED_DEMO_DATA=false` to skip the demo users and tasks.

## Features
**Public site:** animated landing page (typing headline, live approvals feed, counters, scroll reveals, FAQ), contact page, login and register (with referral codes).
**Users:** dashboard with earnings chart, task marketplace with search/filter/sort, task detail with proof upload, create/pause/close campaigns (with cost summary and refunds), review submissions (approve or reject with reason), wallet with ledger, funding and withdrawals, referral page, profile and password change.
**Admin:** overview stats and charts, user management (search, suspend, promote, wallet adjustments), campaign moderation, withdrawal and deposit queues, contact-message inbox.
**Backend rules:** every money movement goes through `WalletService` (row lock + ledger entry); slots are locked during submission so a campaign can never be oversubscribed; reward is paid once on approval; referral bonus is paid once, on the referred user's first approved task; withdrawals are held at request time and refunded if rejected; suspended users are blocked and their tokens revoked; throttling on login, register and contact.

## Settings (.env)
`PLATFORM_FEE_PERCENT`, `MIN_REWARD`, `MIN_DEPOSIT`, `MIN_WITHDRAWAL`, `REFERRAL_BONUS`, `SUPPORT_EMAIL`, and the bank account shown to users when funding (`PAY_BANK_NAME`, `PAY_ACCOUNT_NUMBER`, `PAY_ACCOUNT_NAME`).

## Email
`MAIL_MAILER=log` writes emails to `storage/logs/laravel.log`. For real delivery set `MAIL_MAILER=smtp` plus your SMTP credentials (for Gmail use an App Password). Contact messages are always saved and visible in Admin > Messages, even if mail fails.

## Wallet funding
Funding is a manual-approval flow: the user transfers to the account in `.env`, submits the reference, and an admin approves it in Admin > Deposits. To automate it, add a payment gateway (Paystack or Flutterwave) and call `WalletService::credit()` from its webhook.

## Folder map
`app/Http/Controllers` API controllers (`Admin/` for the admin API) · `app/Services/WalletService.php` money logic · `app/Models` · `database/migrations` + `seeders` · `routes/api.php` · `resources/js` React app (`pages/`, `components/`, `lib/`) · `resources/css/app.css` design tokens and animations · `tailwind.config.js` brand colours and keyframes.

## Going live
Set `APP_ENV=production`, `APP_DEBUG=false`, your real `APP_URL`, run `php artisan migrate --force`, `npm run build`, `php artisan config:cache route:cache`, and point the web server document root at `public/`.
