<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PrayerTimeService;
use Illuminate\Http\Request;

class SalahController extends Controller
{
    public function __construct(private PrayerTimeService $prayerTimes)
    {
    }

    public function timings(Request $request)
    {
        $data = $request->validate([
            'latitude' => ['required', 'numeric'],
            'longitude' => ['required', 'numeric'],
            'date' => ['nullable', 'date'],
        ]);

        $timings = $this->prayerTimes->timings(
            (float) $data['latitude'],
            (float) $data['longitude'],
            $data['date'] ?? null
        );

        return $this->respond(['timings' => $timings], 'Prayer times fetched.');
    }

    public function currentUpcoming(Request $request)
    {
        $data = $request->validate([
            'latitude' => ['required', 'numeric'],
            'longitude' => ['required', 'numeric'],
        ]);

        $result = $this->prayerTimes->currentAndUpcoming(
            (float) $data['latitude'],
            (float) $data['longitude']
        );

        return $this->respond($result, 'Current and upcoming prayer fetched.');
    }

    public function records(Request $request)
    {
        $date = $request->query('date', now()->toDateString());

        $record = $request->user()->salahRecords()
            ->whereDate('date', $date)
            ->first();

        return $this->respond([
            'salah_record' => $record
                ? $record->toApiArray()
                : ['date' => $date],
        ], 'Salah record fetched.');
    }

    public function updateRecords(Request $request)
    {
        $data = $request->validate([
            'date' => ['required', 'date'],
            'fajr_performed' => ['sometimes', 'boolean'],
            'dhuhr_performed' => ['sometimes', 'boolean'],
            'asr_performed' => ['sometimes', 'boolean'],
            'maghrib_performed' => ['sometimes', 'boolean'],
            'isha_performed' => ['sometimes', 'boolean'],
            'tahajud_performed' => ['sometimes', 'boolean'],
        ]);

        $date = $data['date'];
        unset($data['date']);

        $record = $request->user()->salahRecords()->updateOrCreate(
            ['date' => $date],
            $data
        );

        return $this->respond(['salah_record' => $record->fresh()->toApiArray()], 'Salah record saved.');
    }
}
