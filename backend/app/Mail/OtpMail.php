<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class OtpMail extends Mailable
{
    public function __construct(
        public string $code,
        public string $purpose, // 'verify' | 'reset'
        public int $expiresInMinutes = 10,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->purpose === 'reset'
                ? 'Your Edeen password reset code'
                : 'Your Edeen verification code',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.otp',
            with: [
                'code' => $this->code,
                'purpose' => $this->purpose,
                'expiresInMinutes' => $this->expiresInMinutes,
                'logoPath' => resource_path('images/edeen-logo.png'),
            ],
        );
    }
}
