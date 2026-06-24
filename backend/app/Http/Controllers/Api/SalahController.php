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

        $payload = $this->prayerTimes->payload(
            (float) $data['latitude'],
            (float) $data['longitude'],
            $data['date'] ?? null
        );

        // payload = ['timings' => [...], 'hijri' => [...]]
        return $this->respond($payload, 'Prayer times fetched.');
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
        // If no date parameter, return all records for the user
        if (!$request->has('date')) {
            $records = $request->user()->salahRecords()
                ->orderBy('date', 'desc')
                ->get()
                ->map(fn($record) => $record->toApiArray());

            return $this->respond([
                'salah_records' => $records,
            ], 'All salah records fetched.');
        }

        // If date parameter provided, return single record for that date
        $date = $request->query('date');

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
            'fajr_performed' => ['required', 'boolean'],
            'dhuhr_performed' => ['required', 'boolean'],
            'asr_performed' => ['required', 'boolean'],
            'maghrib_performed' => ['required', 'boolean'],
            'isha_performed' => ['required', 'boolean'],
            'tahajud_performed' => ['required', 'boolean'],
        ]);

        $date = $data['date'];
        unset($data['date']);

        // Prayers are freely toggleable (check / uncheck) so the user can correct
        // mistakes. The "can't mark before its time" rule is enforced client-side.
        $record = $request->user()->salahRecords()->updateOrCreate(
            ['date' => $date],
            $data
        );

        return $this->respond(['salah_record' => $record->fresh()->toApiArray()], 'Salah record saved.');
    }
}
