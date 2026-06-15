<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Log;
use Kreait\Firebase\Factory;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification;
use Throwable;

/**
 * Sends push notifications through Firebase Cloud Messaging.
 *
 * Requires a service-account JSON (FIREBASE_CREDENTIALS). If it is not present
 * the service degrades gracefully (logs and no-ops) so the rest of the API keeps
 * working — the app also schedules its own local notifications via notifee.
 */
class FcmService
{
    private $messaging = null;

    public function __construct()
    {
        $path = config('services.firebase.credentials');
        $fullPath = $path && ! str_starts_with($path, '/') ? base_path($path) : $path;

        if ($fullPath && file_exists($fullPath)) {
            try {
                $this->messaging = (new Factory)->withServiceAccount($fullPath)->createMessaging();
            } catch (Throwable $e) {
                Log::warning('FCM init failed: ' . $e->getMessage());
            }
        }
    }

    public function isEnabled(): bool
    {
        return $this->messaging !== null;
    }

    public function sendToUser(User $user, string $title, string $body, array $data = []): bool
    {
        if (! $this->isEnabled() || empty($user->device_token)) {
            return false;
        }

        return $this->sendToToken($user->device_token, $title, $body, $data);
    }

    public function sendToToken(string $token, string $title, string $body, array $data = []): bool
    {
        if (! $this->isEnabled()) {
            return false;
        }

        try {
            $message = CloudMessage::withTarget('token', $token)
                ->withNotification(Notification::create($title, $body))
                ->withData(array_map('strval', $data));

            $this->messaging->send($message);

            return true;
        } catch (Throwable $e) {
            Log::warning('FCM send failed: ' . $e->getMessage());

            return false;
        }
    }
}
