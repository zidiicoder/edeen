<?php

// Configuration for kreait/laravel-firebase. The credentials file is the
// service-account JSON generated in the Firebase console (NOT google-services.json).
return [
    'default' => 'app',
    'projects' => [
        'app' => [
            'credentials' => env('FIREBASE_CREDENTIALS', 'storage/app/firebase/service-account.json'),
            'project_id' => env('FIREBASE_PROJECT_ID', 'edeen-38edc'),
        ],
    ],
];
