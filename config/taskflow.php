<?php

return [
    'support_email' => env('SUPPORT_EMAIL', 'francis.audits@gmail.com'),
    'fee_percent' => (float) env('PLATFORM_FEE_PERCENT', 10),
    'min_reward' => (float) env('MIN_REWARD', 20),
    'min_deposit' => (float) env('MIN_DEPOSIT', 500),
    'min_withdrawal' => (float) env('MIN_WITHDRAWAL', 1000),
    'referral_bonus' => (float) env('REFERRAL_BONUS', 100),
    'platforms' => ['instagram', 'tiktok', 'youtube', 'x', 'facebook', 'telegram', 'whatsapp', 'website', 'other'],
    'payment' => [
        'bank_name' => env('PAY_BANK_NAME', 'Your Bank'),
        'account_number' => env('PAY_ACCOUNT_NUMBER', '0000000000'),
        'account_name' => env('PAY_ACCOUNT_NAME', 'TaskFlow Ltd'),
    ],
];
