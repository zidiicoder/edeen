<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\HabitController;
use App\Http\Controllers\Api\JournalController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\QuranController;
use App\Http\Controllers\Api\SalahController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Edeen API routes  (prefix: /api)
|--------------------------------------------------------------------------
| The mobile app's base URL is http://edeenapp.co.uk/api/ so every path here
| is reachable as e.g. http://edeenapp.co.uk/api/login.
*/

// ---- Public (no auth) ----
Route::post('signup', [AuthController::class, 'signup']);
Route::post('login', [AuthController::class, 'login']);
Route::post('verify', [AuthController::class, 'verify']);
Route::get('get-otp', [AuthController::class, 'getOtp']);
Route::post('resend-otp', [AuthController::class, 'resendOtp']);
Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('reset-password', [AuthController::class, 'resetPassword']);

// ---- Authenticated (Sanctum bearer token) ----
Route::middleware('auth:sanctum')->group(function () {
    // Auth / profile
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('profile', [ProfileController::class, 'show']);
    Route::put('profile', [ProfileController::class, 'update']);
    Route::post('profile', [ProfileController::class, 'update']); // some clients send multipart via POST
    Route::post('change-password', [ProfileController::class, 'changePassword']);
    Route::put('device-token', [ProfileController::class, 'deviceToken']);

    // Habits
    Route::get('habits', [HabitController::class, 'index']);
    Route::post('habits', [HabitController::class, 'store']);
    Route::get('habits/progress', [HabitController::class, 'progress']);
    Route::put('habits/{habit}', [HabitController::class, 'update']);
    Route::delete('habits/{habit}', [HabitController::class, 'destroy']);
    Route::post('habits/{habit}/mark-completion', [HabitController::class, 'markCompletion']);
    Route::delete('habits/{habit}/unmark-completion', [HabitController::class, 'unmarkCompletion']);

    // Journals
    Route::get('journals', [JournalController::class, 'index']);
    Route::post('journals', [JournalController::class, 'store']);
    Route::put('journals/{journal}', [JournalController::class, 'update']);
    Route::delete('journals/{journal}', [JournalController::class, 'destroy']);

    // Quran tracking
    Route::get('quran', [QuranController::class, 'index']);
    Route::post('quran', [QuranController::class, 'store']);
    Route::put('quran/{quran}', [QuranController::class, 'update']);

    // Salah
    Route::get('salah/timings', [SalahController::class, 'timings']);
    Route::get('salah/current-upcoming', [SalahController::class, 'currentUpcoming']);
    Route::get('salah/records', [SalahController::class, 'records']);
    Route::put('salah/records', [SalahController::class, 'updateRecords']);
    Route::post('salah/records', [SalahController::class, 'updateRecords']);
});
