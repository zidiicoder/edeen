<?php

use Illuminate\Support\Facades\Schedule;

// Clean up expired OTP codes daily.
Schedule::call(function () {
    \App\Models\OtpCode::where('expires_at', '<', now()->subDay())->delete();
})->daily();
