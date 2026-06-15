<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Journal;
use Illuminate\Http\Request;

class JournalController extends Controller
{
    public function index(Request $request)
    {
        $query = $request->user()->journals()->latest('date')->latest('id');

        // filter=today|week|month|custom (+ date / custom_date for custom)
        $filter = $request->query('filter');
        $date = $request->query('custom_date') ?? $request->query('date');

        if ($filter === 'today') {
            $query->whereDate('date', now()->toDateString());
        } elseif ($filter === 'week') {
            $query->whereBetween('date', [now()->startOfWeek()->toDateString(), now()->endOfWeek()->toDateString()]);
        } elseif ($filter === 'month') {
            $query->whereMonth('date', now()->month)->whereYear('date', now()->year);
        } elseif ($filter === 'custom' && $date) {
            $query->whereDate('date', $date);
        }

        $journals = $query->get()->map(fn (Journal $j) => $j->toApiArray());

        return $this->respond(['journals' => $journals], 'Journals fetched.');
    }

    public function store(Request $request)
    {
        $data = $this->validateJournal($request);
        $data['user_id'] = $request->user()->id;
        $data['date'] = $data['date'] ?? now()->toDateString();

        $journal = Journal::create($data);

        return $this->respond(['journal' => $journal->toApiArray()], 'Journal created.', 201);
    }

    public function update(Request $request, Journal $journal)
    {
        $this->authorizeJournal($request, $journal);

        $journal->update($this->validateJournal($request));

        return $this->respond(['journal' => $journal->fresh()->toApiArray()], 'Journal updated.');
    }

    public function destroy(Request $request, Journal $journal)
    {
        $this->authorizeJournal($request, $journal);
        $journal->delete();

        return $this->respond(null, 'Journal deleted.');
    }

    private function validateJournal(Request $request): array
    {
        $data = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'emoji' => ['nullable', 'string', 'max:16'],
            'tag' => ['nullable', 'string'],
            'promt' => ['nullable', 'array'],
            'promt.*' => ['string'],
            'date' => ['nullable', 'date'],
        ]);

        return $data;
    }

    private function authorizeJournal(Request $request, Journal $journal): void
    {
        abort_unless($journal->user_id === $request->user()->id, 403, 'Not allowed.');
    }
}
