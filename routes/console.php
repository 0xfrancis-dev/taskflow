<?php

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Mail;

Artisan::command('taskflow:about', function () {
    $this->info('TaskFlow - support: '.config('taskflow.support_email'));
})->purpose('Show TaskFlow info');

// Usage: php artisan taskflow:test-mail you@example.com
Artisan::command('taskflow:test-mail {to}', function (string $to) {
    $this->info('Sending with mailer "'.config('mail.default').'" ...');
    try {
        Mail::to($to)->send(new \App\Mail\NotificationMail('TaskFlow test email', 'Email is working', ['If you can read this, TaskFlow can send emails.'], 'Open TaskFlow', url('/')));
        $this->info('Sent. Check the inbox (and spam) of '.$to.'. With MAIL_MAILER=log, look in storage/logs/laravel.log.');
    } catch (\Throwable $e) {
        $this->error('Failed: '.$e->getMessage());
    }
})->purpose('Send a test email');
