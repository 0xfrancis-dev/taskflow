<?php

return [
    'support_email' => env('SUPPORT_EMAIL', 'francis.audits@gmail.com'),
    'fee_percent' => (float) env('PLATFORM_FEE_PERCENT', 10),
    'min_reward' => (float) env('MIN_REWARD', 20),
    'min_deposit' => (float) env('MIN_DEPOSIT', 500),
    'min_withdrawal' => (float) env('MIN_WITHDRAWAL', 1000),
    'withdrawal_daily_limit' => (float) env('WITHDRAWAL_DAILY_LIMIT', 200000),
    'referral_bonus' => (float) env('REFERRAL_BONUS', 100),
    'manual_funding' => filter_var(env('MANUAL_FUNDING', false), FILTER_VALIDATE_BOOL),
    'platforms' => ['instagram', 'tiktok', 'youtube', 'x', 'facebook', 'telegram', 'whatsapp', 'website', 'other'],
    'korapay' => [
        'secret_key' => env('KORAPAY_SECRET_KEY'),
        'base_url' => env('KORAPAY_BASE_URL', 'https://api.korapay.com/merchant/api/v1'),
    ],
    'payment' => [
        'bank_name' => env('PAY_BANK_NAME', 'Your Bank'),
        'account_number' => env('PAY_ACCOUNT_NUMBER', '0000000000'),
        'account_name' => env('PAY_ACCOUNT_NAME', 'TaskFlow Ltd'),
    ],
];
