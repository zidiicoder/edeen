<?php

namespace App\Services;

use App\Models\Habit;
use Carbon\Carbon;

/**
 * Builds the habit payload exactly as HabitTrackerScreen.transformData() expects:
 *
 * {
 *   habit: { id, name, description, frequency, start_date, custom_date, status, color, icon },
 *   days_data: [ { chunk_index, days: [ { day_number, date, marked, completed } ] } ],
 *   marked_complete_days, progress_percentage, total_days
 * }
 */
class HabitTransformer
{
    public function transform(Habit $habit): array
    {
        $start = Carbon::parse($habit->start_date)->startOfDay();
        $totalDays = $this->totalDays($habit, $start);

        // completion_date (Y-m-d) => bool
        $completions = $habit->completions
            ->mapWithKeys(fn ($c) => [Carbon::parse($c->completion_date)->toDateString() => (bool) $c->is_completed]);

        $days = [];
        $markedCount = 0;
        for ($i = 0; $i < $totalDays; $i++) {
            $date = (clone $start)->addDays($i)->toDateString();
            $marked = (bool) ($completions[$date] ?? false);
            if ($marked) {
                $markedCount++;
            }
            $days[] = [
                'day_number' => $i + 1,
                'date' => $date,
                'marked' => $marked,
                'completed' => $marked,
            ];
        }

        // Chunk into rows of 10 (the app renders 10 boxes per row).
        $daysData = [];
        foreach (array_chunk($days, 10) as $index => $chunk) {
            $daysData[] = [
                'chunk_index' => $index,
                'days' => $chunk,
            ];
        }

        $progress = $totalDays > 0 ? (int) round(($markedCount / $totalDays) * 100) : 0;

        return [
            'habit' => [
                'id' => $habit->id,
                'name' => $habit->name,
                'description' => $habit->description,
                'frequency' => $habit->frequency,
                'start_date' => $start->toDateString(),
                'custom_date' => optional($habit->custom_date)->toDateString(),
                'status' => $this->status($markedCount, $totalDays, $start),
                'color' => $habit->color,
                'icon' => $habit->icon,
                'days_of_week' => $habit->days_of_week ?? [],
            ],
            'days_data' => $daysData,
            'marked_complete_days' => $markedCount,
            'progress_percentage' => $progress,
            'total_days' => $totalDays,
        ];
    }

    public function totalDays(Habit $habit, ?Carbon $start = null): int
    {
        $start = $start ?: Carbon::parse($habit->start_date)->startOfDay();

        if ($habit->frequency === 'custom' && $habit->custom_date) {
            $end = Carbon::parse($habit->custom_date)->startOfDay();
            return max(1, $start->diffInDays($end) + 1);
        }

        if ($habit->frequency === '40_days') {
            return 40;
        }

        if ($habit->frequency === 'day') {
            return 1;
        }

        return 40;
    }

    private function status(int $marked, int $total, Carbon $start): string
    {
        if ($total > 0 && $marked >= $total) {
            return 'completed';
        }

        $today = Carbon::now()->startOfDay();
        if ($today->lt($start)) {
            return 'pending';
        }

        return $marked > 0 ? 'in_progress' : 'pending';
    }
}
