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
     * @return array{Fajr:string,Dhuhr:string,Asr:string,Maghrib:string,Isha:string,Sunrise?:string}
     */
    public function timings(float $latitude, float $longitude, ?string $date = null): array
    {
        $date = $date ? Carbon::parse($date) : Carbon::now();
        $dateKey = $date->format('d-m-Y');
        $method = config('services.aladhan.method', 3);

        $cacheKey = "prayer:{$latitude}:{$longitude}:{$dateKey}:{$method}";

        return Cache::remember($cacheKey, now()->addHours(12), function () use ($latitude, $longitude, $dateKey, $method) {
            $base = config('services.aladhan.base_url');
            $response = Http::timeout(12)->get("{$base}/timings/{$dateKey}", [
                'latitude' => $latitude,
                'longitude' => $longitude,
                'method' => $method,
            ]);

            $timings = $response->ok() ? ($response->json('data.timings') ?? []) : [];

            // Normalise to bare "HH:MM" (Aladhan may append " (TZ)").
            $clean = [];
            foreach (['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as $key) {
                if (! empty($timings[$key]) && preg_match('/(\d{1,2}:\d{2})/', $timings[$key], $m)) {
                    $clean[$key] = $m[1];
                }
            }

            return $clean;
        });
    }

    /**
     * Current (most recently started) and upcoming prayer for "now" at a location.
     *
     * @return array{current_salah: ?array, upcoming_salah: ?array}
     */
    public function currentAndUpcoming(float $latitude, float $longitude): array
    {
        $now = Carbon::now();
        $timings = $this->timings($latitude, $longitude, $now->toDateString());

        if (empty($timings)) {
            return ['current_salah' => null, 'upcoming_salah' => null];
        }

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
        foreach ($slots as $slot) {
            if ($slot['at']->lte($now)) {
                $current = $slot;
            } elseif (! $upcoming) {
                $upcoming = $slot;
            }
        }

        // Before Fajr -> current is yesterday's Isha; upcoming is today's Fajr.
        if (! $current && ! empty($slots)) {
            $current = end($slots);
        }
        // After Isha -> upcoming is tomorrow's Fajr.
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
