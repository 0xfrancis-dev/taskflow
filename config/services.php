<?php

return [
    'monnify' => [
        'base_url' => env('MONNIFY_BASE_URL', 'https://sandbox.monnify.com'),
        'api_key' => env('MONNIFY_API_KEY'),
        'secret_key' => env('MONNIFY_SECRET_KEY'),
        'contract_code' => env('MONNIFY_CONTRACT_CODE'),
        'wallet_account' => env('MONNIFY_WALLET_ACCOUNT'), // reserved for automated payouts later
    ],
];
