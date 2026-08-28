<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

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
