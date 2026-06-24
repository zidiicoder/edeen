<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class TestEmailCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'email:test {recipient} {--code=}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test email sending with OTP format';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $recipient = $this->argument('recipient');
        $code = $this->option('code') ?: random_int(100000, 999999);

        $this->info("📧 Testing email send to: {$recipient}");
        $this->info("🔑 OTP Code: {$code}");
        $this->newLine();

        // Display current mail configuration
        $this->info("📋 Mail Configuration:");
        $this->table(
            ['Setting', 'Value'],
            [
                ['MAIL_MAILER', config('mail.default')],
                ['MAIL_HOST', config('mail.mailers.smtp.host')],
                ['MAIL_PORT', config('mail.mailers.smtp.port')],
                ['MAIL_USERNAME', config('mail.mailers.smtp.username') ? '***SET***' : '❌ EMPTY'],
                ['MAIL_PASSWORD', config('mail.mailers.smtp.password') ? '***SET***' : '❌ EMPTY'],
                ['MAIL_ENCRYPTION', config('mail.mailers.smtp.encryption')],
                ['MAIL_FROM_ADDRESS', config('mail.from.address')],
                ['MAIL_FROM_NAME', config('mail.from.name')],
            ]
        );
        $this->newLine();

        // Check if credentials are set
        if (!config('mail.mailers.smtp.username') || !config('mail.mailers.smtp.password')) {
            $this->error('❌ MAIL_USERNAME or MAIL_PASSWORD is not set!');
            $this->warn('Update your .env file with SMTP credentials and run: php artisan config:clear');
            return 1;
        }

        $this->info("📤 Sending test email...");

        try {
            $subject = 'Your Edeen verification code';
            $body = "Your Edeen code is: {$code}\n\nIt expires in 10 minutes.\n\n" .
                    "This is a test email from EDeen mobile app.";

            Mail::raw($body, function ($message) use ($recipient, $subject) {
                $message->to($recipient)->subject($subject);
            });

            $this->newLine();
            $this->info("✅ Email sent successfully!");
            $this->info("📧 Check inbox: {$recipient}");
            $this->info("📁 Also check spam/junk folder");
            $this->newLine();

            Log::info("Test email sent successfully", [
                'recipient' => $recipient,
                'code' => $code,
            ]);

            return 0;

        } catch (\Throwable $e) {
            $this->newLine();
            $this->error("❌ Failed to send email!");
            $this->error("Error: " . $e->getMessage());
            $this->newLine();

            Log::error("Test email failed", [
                'recipient' => $recipient,
                'code' => $code,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            $this->warn("Possible causes:");
            $this->line("  1. SMTP credentials are incorrect");
            $this->line("  2. SMTP server is blocking the connection");
            $this->line("  3. Port {$this->getPort()} is blocked by firewall");
            $this->line("  4. Email account doesn't exist or is disabled");
            $this->newLine();

            $this->info("💡 Troubleshooting steps:");
            $this->line("  1. Verify SMTP credentials in Hostinger control panel");
            $this->line("  2. Check Laravel logs: storage/logs/laravel.log");
            $this->line("  3. Try different port: 587 (TLS) or 465 (SSL)");
            $this->line("  4. Test SMTP connection: telnet smtp.hostinger.com 587");
            $this->newLine();

            return 1;
        }
    }

    private function getPort()
    {
        return config('mail.mailers.smtp.port', 587);
    }
}

