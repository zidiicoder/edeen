<?php

return [
    // Prayer-times provider (Aladhan public API).
    'aladhan' => [
        'base_url' => 'https://api.aladhan.com/v1',
        'method' => (int) env('PRAYER_TIMES_METHOD', 3),
    ],

    // Firebase Cloud Messaging (push notifications).
    'firebase' => [
        'project_id' => env('FIREBASE_PROJECT_ID'),
        'credentials' => env('FIREBASE_CREDENTIALS', 'storage/app/firebase/service-account.json'),
    ],
];
