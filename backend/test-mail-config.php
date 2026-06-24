<?php
/**
 * Test Mail Configuration Script
 * Run this on the server to check mail settings
 */

// Check if we're in the Laravel backend directory
if (!file_exists('artisan')) {
    die("Error: This script must be run from the Laravel backend directory.\n");
}

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== EDeen Mail Configuration Test ===\n\n";

// Check .env file exists
if (!file_exists('.env')) {
    echo "❌ ERROR: .env file not found!\n";
    exit(1);
}

// Load environment variables
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

echo "1. Environment: " . env('APP_ENV', 'not set') . "\n";
echo "2. App URL: " . env('APP_URL', 'not set') . "\n\n";

echo "=== Mail Configuration ===\n";
echo "MAIL_MAILER: " . env('MAIL_MAILER', 'not set') . "\n";
echo "MAIL_HOST: " . env('MAIL_HOST', 'not set') . "\n";
echo "MAIL_PORT: " . env('MAIL_PORT', 'not set') . "\n";
echo "MAIL_USERNAME: " . (env('MAIL_USERNAME') ? '***SET***' : '❌ EMPTY') . "\n";
echo "MAIL_PASSWORD: " . (env('MAIL_PASSWORD') ? '***SET***' : '❌ EMPTY') . "\n";
echo "MAIL_ENCRYPTION: " . env('MAIL_ENCRYPTION', 'not set') . "\n";
echo "MAIL_FROM_ADDRESS: " . env('MAIL_FROM_ADDRESS', 'not set') . "\n";
echo "MAIL_FROM_NAME: " . env('MAIL_FROM_NAME', 'not set') . "\n\n";

if (!env('MAIL_USERNAME') || !env('MAIL_PASSWORD')) {
    echo "❌ PROBLEM FOUND: MAIL_USERNAME and/or MAIL_PASSWORD are empty!\n";
    echo "   This is why emails are not being sent.\n\n";
    echo "✅ SOLUTION:\n";
    echo "   1. Get SMTP credentials from Hostinger control panel\n";
    echo "   2. Update .env file with:\n";
    echo "      MAIL_USERNAME=your-email@edeenapp.co.uk\n";
    echo "      MAIL_PASSWORD=your-smtp-password\n";
    echo "   3. Run: php artisan config:clear\n";
    echo "   4. Test again\n";
} else {
    echo "✅ Mail credentials are set.\n\n";
    echo "Testing SMTP connection...\n";
    
    try {
        $transport = new \Swift_SmtpTransport(
            env('MAIL_HOST'),
            env('MAIL_PORT'),
            env('MAIL_ENCRYPTION')
        );
        $transport->setUsername(env('MAIL_USERNAME'));
        $transport->setPassword(env('MAIL_PASSWORD'));
        
        $mailer = new \Swift_Mailer($transport);
        $transport->start();
        
        echo "✅ SMTP connection successful!\n";
        echo "   Host: " . env('MAIL_HOST') . ":" . env('MAIL_PORT') . "\n";
        
    } catch (\Exception $e) {
        echo "❌ SMTP connection failed!\n";
        echo "   Error: " . $e->getMessage() . "\n";
    }
}

echo "\n=== Recent OTP Codes (for debugging) ===\n";
try {
    $otps = \App\Models\OtpCode::latest()->take(5)->get();
    foreach ($otps as $otp) {
        echo "Email: {$otp->email} | Code: {$otp->code} | Created: {$otp->created_at}\n";
    }
} catch (\Exception $e) {
    echo "Could not fetch OTPs: " . $e->getMessage() . "\n";
}

echo "\n=== End of Test ===\n";
