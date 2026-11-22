<?php

use Illuminate\Support\Facades\Artisan;

Artisan::command('taskflow:about', function () {
    $this->info('TaskFlow - support: '.config('taskflow.support_email'));
})->purpose('Show TaskFlow info');
