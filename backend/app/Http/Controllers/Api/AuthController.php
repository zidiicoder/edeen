<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OtpCode;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class AuthController extends Controller
{
    public function signup(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
        ]);

        $this->issueOtp($user->email, 'verify');

        $token = $this->makeToken($user);

        return $this->respond([
            'access_token' => $token['token'],
            'expires_in' => $token['expires_in'],
            'user' => $user->toApiArray(),
        ], 'Account created. An OTP has been sent to your email.', 201);
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            return $this->error('These credentials do not match our records.', 401, [
                'email' => ['These credentials do not match our records.'],
            ]);
        }

        $token = $this->makeToken($user);

        return $this->respond([
            'access_token' => $token['token'],
            'expires_in' => $token['expires_in'],
            'user' => $user->toApiArray(),
        ], 'Logged in successfully.');
    }

    public function logout(Request $request)
    {
        $user = $request->user();
        if ($user) {
            $current = $user->currentAccessToken();
            if ($current) {
                $current->delete();
            }
        }

        return $this->respond(null, 'Logged out successfully.');
    }

    /**
     * GET /get-otp — re-send an OTP. Uses the authenticated user's email, or an
     * ?email query param when called unauthenticated.
     */
    public function getOtp(Request $request)
    {
        // Works whether or not the route is behind auth: resolve the bearer
        // token actively, else fall back to an ?email query param.
        $email = $request->query('email') ?: optional(auth('sanctum')->user())->email;

        if (! $email) {
            return $this->error('Email is required.', 422, ['email' => ['Email is required.']]);
        }

        $this->issueOtp($email, 'verify');

        return $this->respond(null, 'OTP sent to your email.');
    }

    public function resendOtp(Request $request)
    {
        $data = $request->validate(['email' => ['required', 'email']]);
        $this->issueOtp($data['email'], 'verify');

        return $this->respond(null, 'A new OTP has been sent.');
    }

    public function verify(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'code' => ['required', 'string'],
        ]);

        $otp = $this->consumeOtp($data['email'], $data['code'], 'verify');
        if (! $otp) {
            return $this->error('Invalid or expired OTP.', 422, ['code' => ['Invalid or expired OTP.']]);
        }

        $user = User::where('email', $data['email'])->first();
        if ($user && ! $user->email_verified_at) {
            $user->forceFill(['email_verified_at' => now()])->save();
        }

        return $this->respond(['user' => $user?->toApiArray()], 'Email verified successfully.');
    }

    public function forgotPassword(Request $request)
    {
        $data = $request->validate(['email' => ['required', 'email']]);

        // Don't reveal whether the email exists; always issue if it does.
        if (User::where('email', $data['email'])->exists()) {
            $this->issueOtp($data['email'], 'reset');
        }

        return $this->respond(null, 'If the email exists, a reset code has been sent.');
    }

    public function resetPassword(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'code' => ['required', 'string'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ]);

        $otp = $this->consumeOtp($data['email'], $data['code'], 'reset');
        if (! $otp) {
            return $this->error('Invalid or expired reset code.', 422, ['code' => ['Invalid or expired reset code.']]);
        }

        $user = User::where('email', $data['email'])->first();
        if (! $user) {
            return $this->error('User not found.', 404);
        }

        $user->forceFill(['password' => $data['password']])->save();
        $user->tokens()->delete(); // sign out everywhere

        return $this->respond(null, 'Password reset successfully.');
    }

    /* ----------------------------------------------------------------- */

    private function makeToken(User $user): array
    {
        $minutes = config('sanctum.expiration');
        $expiresAt = $minutes ? now()->addMinutes((int) $minutes) : null;

        $plain = $user->createToken('mobile', ['*'], $expiresAt)->plainTextToken;

        return [
            'token' => $plain,
            'expires_in' => $minutes ? (int) $minutes * 60 : null,
        ];
    }

    private function issueOtp(string $email, string $purpose): void
    {
        $code = (string) random_int(100000, 999999);

        OtpCode::create([
            'email' => $email,
            'code' => $code,
            'purpose' => $purpose,
            'expires_at' => now()->addMinutes(10),
        ]);

        $subject = $purpose === 'reset' ? 'Your Edeen password reset code' : 'Your Edeen verification code';
        $body = "Your Edeen code is: {$code}\n\nIt expires in 10 minutes.";

        try {
            Mail::raw($body, function ($message) use ($email, $subject) {
                $message->to($email)->subject($subject);
            });
        } catch (\Throwable $e) {
            // Mail not configured yet — log the code so verification still works in dev.
            Log::info("OTP for {$email} ({$purpose}): {$code}");
        }
    }

    private function consumeOtp(string $email, string $code, string $purpose): ?OtpCode
    {
        $otp = OtpCode::where('email', $email)
            ->where('code', $code)
            ->where('purpose', $purpose)
            ->whereNull('consumed_at')
            ->where('expires_at', '>', now())
            ->latest()
            ->first();

        if ($otp) {
            $otp->forceFill(['consumed_at' => now()])->save();
        }

        return $otp;
    }
}
