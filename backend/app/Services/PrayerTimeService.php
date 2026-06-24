<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

/**
 * Resolves prayer times from the Aladhan public API (server-side) and shapes
 * them for the app's Salah screens.
 */
class PrayerTimeService
{
    private array $order = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

    /**
     * Cleaned timings only (Sunrise included).
     *
     * @return array{Fajr:string,Dhuhr:string,Asr:string,Maghrib:string,Isha:string,Sunrise?:string}
     */
    public function timings(float $latitude, float $longitude, ?string $date = null): array
    {
        return $this->payload($latitude, $longitude, $date)['timings'];
    }

    /**
     * Full payload for a day: cleaned timings + the Hijri (Islamic) date.
     *
     * @return array{timings: array, hijri: array}
     */
    public function payload(float $latitude, float $longitude, ?string $date = null): array
    {
        $date = $date ? Carbon::parse($date) : Carbon::now();
        $dateKey = $date->format('d-m-Y');
        $method = config('services.aladhan.method', 1);
        $school = config('services.aladhan.school', 1);
        $hijriMethod = config('services.aladhan.hijri_method', 'MATHEMATICAL');

        // v3 cache namespace: the cached value/shape changed (timings+hijri, hijri method).
        $cacheKey = "prayer_v3:{$latitude}:{$longitude}:{$dateKey}:{$method}:{$school}:{$hijriMethod}";

        return Cache::remember($cacheKey, now()->addHours(12), function () use ($latitude, $longitude, $dateKey, $method, $school, $hijriMethod) {
            $base = config('services.aladhan.base_url');
            $response = Http::timeout(12)->get("{$base}/timings/{$dateKey}", [
                'latitude' => $latitude,
                'longitude' => $longitude,
                'method' => $method,
                'school' => $school,
                'calendarMethod' => $hijriMethod,
            ]);

            $data = $response->ok() ? ($response->json('data') ?? []) : [];
            $timings = $data['timings'] ?? [];

            // Normalise to bare "HH:MM" (Aladhan may append " (TZ)").
            $clean = [];
            foreach (['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as $key) {
                if (! empty($timings[$key]) && preg_match('/(\d{1,2}:\d{2})/', $timings[$key], $m)) {
                    $clean[$key] = $m[1];
                }
            }

            // Hijri (Islamic) date for the day.
            $h = $data['date']['hijri'] ?? [];
            $hijri = [];
            if (! empty($h)) {
                $monthEn = $h['month']['en'] ?? '';
                $day = $h['day'] ?? '';
                $year = $h['year'] ?? '';
                $hijri = [
                    'day' => $day,
                    'month' => $monthEn,
                    'year' => $year,
                    'weekday' => $h['weekday']['en'] ?? '',
                    'formatted' => trim($day . ' ' . $monthEn . ' ' . $year),
                ];
            }

            return ['timings' => $clean, 'hijri' => $hijri];
        });
    }

    /**
     * Current (most recently started) and upcoming prayer for "now" at a location.
     *
     * @return array{current_salah: ?array, upcoming_salah: ?array}
     */
    public function currentAndUpcoming(float $latitude, float $longitude): array
    {
        // Get the timezone for the user's coordinates using TimezoneDB or similar
        // For now, we'll use the Aladhan API which returns times in the user's local timezone
        $timings = $this->timings($latitude, $longitude, null);

        if (empty($timings)) {
            return ['current_salah' => null, 'upcoming_salah' => null];
        }

        // Get the current time in UTC and convert it to local time for the coordinates
        // We need to fetch the timezone offset from the Aladhan API response
        $base = config('services.aladhan.base_url');
        $method = config('services.aladhan.method', 1);
        $school = config('services.aladhan.school', 1);
        $today = Carbon::now()->format('d-m-Y');

        $response = Http::timeout(12)->get("{$base}/timings/{$today}", [
            'latitude' => $latitude,
            'longitude' => $longitude,
            'method' => $method,
            'school' => $school,
        ]);

        if (!$response->ok()) {
            return ['current_salah' => null, 'upcoming_salah' => null];
        }

        $data = $response->json('data');
        $meta = $data['meta'] ?? [];
        
        // Get the local time at the user's location from Aladhan API
        // Aladhan returns the date object with timezone information
        $dateInfo = $data['date'] ?? [];
        $timezone = $meta['timezone'] ?? 'UTC';
        
        // Create a Carbon instance in the user's timezone
        $now = Carbon::now($timezone);

        $slots = [];
        foreach ($this->order as $name) {
            if (! empty($timings[$name])) {
                [$h, $m] = explode(':', $timings[$name]);
                $slots[] = [
                    'name' => $name,
                    'start_time' => $timings[$name],
                    'at' => (clone $now)->setTime((int) $h, (int) $m, 0),
                ];
            }
        }

        $current = null;
        $upcoming = null;
        
        // Find the most recent prayer that has started (current)
        // and the next prayer that hasn't started yet (upcoming)
        foreach ($slots as $slot) {
            if ($slot['at']->lte($now)) {
                $current = $slot; // Keep updating to get the LAST one that passed
            } elseif (! $upcoming) {
                $upcoming = $slot; // First one that hasn't started yet
                break; // Stop here since we found upcoming
            }
        }

        // Before Fajr (early morning) -> current is yesterday's Isha; upcoming is today's Fajr.
        if (! $current && ! empty($slots)) {
            // Get yesterday's timings for Isha
            $yesterday = $this->timings($latitude, $longitude, $now->copy()->subDay()->toDateString());
            if (! empty($yesterday['Isha'])) {
                $current = ['name' => 'Isha', 'start_time' => $yesterday['Isha']];
            }
            $upcoming = $slots[0]; // First prayer of today (Fajr)
        }
        
        // After Isha (late night) -> upcoming is tomorrow's Fajr.
        if (! $upcoming) {
            $tomorrow = $this->timings($latitude, $longitude, $now->copy()->addDay()->toDateString());
            if (! empty($tomorrow['Fajr'])) {
                $upcoming = ['name' => 'Fajr', 'start_time' => $tomorrow['Fajr']];
            }
        }

        return [
            'current_salah' => $current ? ['name' => $current['name'], 'start_time' => $current['start_time']] : null,
            'upcoming_salah' => $upcoming ? ['name' => $upcoming['name'], 'start_time' => $upcoming['start_time']] : null,
        ];
    }
}
