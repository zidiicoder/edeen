<?php
// Quick email test script
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\Mail;

echo "Testing email sending...\n";
echo "To: forcann66@gmail.com\n\n";

try {
    Mail::raw('Your EDeen verification code is: 123456\n\nThis is a test email.\n\nIt expires in 10 minutes.', function ($message) {
        $message->to('forcann66@gmail.com')
                ->subject('EDeen Test - OTP Verification');
    });
    
    echo "✅ Email sent successfully!\n";
    echo "Check inbox: forcann66@gmail.com\n";
    echo "Also check spam/junk folder.\n";
    
} catch (\Exception $e) {
    echo "❌ Error sending email:\n";
    echo $e->getMessage() . "\n";
}
