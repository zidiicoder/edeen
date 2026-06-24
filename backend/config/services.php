<?php

return [
    // Prayer-times provider (Aladhan public API).
    // Defaults follow Ahle Sunnat (Hanafi): the University of Islamic Sciences,
    // Karachi method (Fajr/Isha angles) + the Hanafi school for Asr (shadow
    // factor 2, so Asr begins later than the standard/Shafi calculation).
    'aladhan' => [
        'base_url' => 'https://api.aladhan.com/v1',
        'method' => (int) env('PRAYER_TIMES_METHOD', 1),
        'school' => (int) env('PRAYER_TIMES_SCHOOL', 1), // 0 = Shafi, 1 = Hanafi
        // Hijri (Islamic) date calendar. MATHEMATICAL matches the local
        // (South-Asia / Pakistan) observed date; alternatives: HJCoSA, UAQ, DIYANET.
        'hijri_method' => env('PRAYER_HIJRI_METHOD', 'MATHEMATICAL'),
    ],

    // Firebase Cloud Messaging (push notifications).
    'firebase' => [
        'project_id' => env('FIREBASE_PROJECT_ID'),
        'credentials' => env('FIREBASE_CREDENTIALS', 'storage/app/firebase/service-account.json'),
    ],
];
