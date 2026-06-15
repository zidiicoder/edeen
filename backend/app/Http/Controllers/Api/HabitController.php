<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Habit;
use App\Services\HabitTransformer;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class HabitController extends Controller
{
    public function __construct(private HabitTransformer $transformer)
    {
    }

    public function index(Request $request)
    {
        $habits = $request->user()->habits()
            ->with('completions')
            ->latest()
            ->get()
            ->map(fn (Habit $h) => $this->transformer->transform($h));

        return $this->respond(['habits' => $habits], 'Habits fetched.');
    }

    public function store(Request $request)
    {
        $data = $this->validateHabit($request);
        $data['user_id'] = $request->user()->id;

        $habit = Habit::create($data);

        return $this->respond(
            ['habit' => $this->transformer->transform($habit->load('completions'))],
            'Habit created.',
            201
        );
    }

    public function update(Request $request, Habit $habit)
    {
        $this->authorizeHabit($request, $habit);

        $habit->update($this->validateHabit($request));

        return $this->respond(
            ['habit' => $this->transformer->transform($habit->load('completions'))],
            'Habit updated.'
        );
    }

    public function destroy(Request $request, Habit $habit)
    {
        $this->authorizeHabit($request, $habit);
        $habit->delete();

        return $this->respond(null, 'Habit deleted.');
    }

    public function markCompletion(Request $request, Habit $habit)
    {
        $this->authorizeHabit($request, $habit);

        $data = $request->validate(['completion_date' => ['required', 'date']]);

        $habit->completions()->updateOrCreate(
            ['completion_date' => $data['completion_date']],
            ['is_completed' => true]
        );

        return $this->respond(
            ['habit' => $this->transformer->transform($habit->load('completions'))],
            'Marked complete.'
        );
    }

    public function unmarkCompletion(Request $request, Habit $habit)
    {
        $this->authorizeHabit($request, $habit);

        $data = $request->validate(['completion_date' => ['required', 'date']]);

        $habit->completions()
            ->whereDate('completion_date', $data['completion_date'])
            ->delete();

        return $this->respond(
            ['habit' => $this->transformer->transform($habit->load('completions'))],
            'Marked incomplete.'
        );
    }

    public function progress(Request $request)
    {
        $habits = $request->user()->habits()->with('completions')->get();

        $completed = 0;
        $inProgress = 0;
        $pending = 0;
        $overdue = 0;
        $scoreSum = 0;

        foreach ($habits as $habit) {
            $t = $this->transformer->transform($habit);
            $scoreSum += $t['progress_percentage'];
            $status = $t['habit']['status'];
            match ($status) {
                'completed' => $completed++,
                'in_progress' => $inProgress++,
                'overdue' => $overdue++,
                default => $pending++,
            };
        }

        $total = $habits->count();
        $score = $total > 0 ? (int) round($scoreSum / $total) : 0;

        return $this->respond([
            'summary' => [
                'total' => $total,
                'completed' => $completed,
                'in_progress' => $inProgress,
                'pending' => $pending,
                'overdue' => $overdue,
                'score' => $score,
            ],
        ], 'Progress fetched.');
    }

    /* ----------------------------------------------------------------- */

    private function validateHabit(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'icon' => ['nullable', 'string', 'max:32'],
            'color' => ['nullable', 'string', 'max:32'],
            'frequency' => ['required', Rule::in(['day', '40_days', 'custom'])],
            'start_date' => ['required', 'date'],
            'custom_date' => ['nullable', 'date'],
            'days_of_week' => ['nullable', 'array'],
            'days_of_week.*' => ['string'],
        ]);
    }

    private function authorizeHabit(Request $request, Habit $habit): void
    {
        abort_unless($habit->user_id === $request->user()->id, 403, 'Not allowed.');
    }
}
