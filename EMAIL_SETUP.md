# Email notifications

## Emails TaskFlow sends
| Who | When |
|---|---|
| New user | Welcome email after registering |
| Campaign owner | Someone submitted proof for their task |
| Earner | Submission approved (reward added) or rejected (with reason) |
| Any user | Wallet funded (online or approved manual deposit) |
| User | Withdrawal request received, then payment sent, or failed/rejected with refund |
| Support inbox (SUPPORT_EMAIL) | New withdrawal request needs approval |
| Support inbox | Contact-form messages |

Emails are sent after the page has already responded, and a mail failure is only logged. It can never break a payment or an approval.

## Gmail setup (francis.audits@gmail.com)
1. Turn on **2-Step Verification** for the Google account.
2. Go to https://myaccount.google.com/apppasswords, create an App Password (name it "TaskFlow") and copy the 16 characters.
3. Put this in `.env`:
```
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_ENCRYPTION=tls
MAIL_USERNAME=francis.audits@gmail.com
MAIL_PASSWORD="xxxx xxxx xxxx xxxx"
MAIL_FROM_ADDRESS=francis.audits@gmail.com
MAIL_FROM_NAME=TaskFlow
```
4. Run `php artisan config:clear`, then test:
```
php artisan taskflow:test-mail francis.audits@gmail.com
```
Check the inbox and the spam folder.

## Before real users arrive
Gmail allows roughly 500 emails per day and may put mail from a personal address in spam. For a live site use a transactional email service (Brevo, Mailgun, Resend, SendGrid or Amazon SES) with your own domain and just change the MAIL_* values.

Tip: with `MAIL_MAILER=log` emails are written to `storage/logs/laravel.log` instead of being sent, which is handy while developing.
