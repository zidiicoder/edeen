<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\QuranRead;
use Illuminate\Http\Request;

class QuranController extends Controller
{
    public function index(Request $request)
    {
        $reads = $request->user()->quranReads()
            ->orderBy('date')
            ->get()
            ->map(fn (QuranRead $r) => $r->toApiArray());

        return $this->respond(['quran_reads' => $reads], 'Quran reads fetched.');
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'date' => ['required', 'date'],
            'read' => ['required', 'boolean'],
        ]);

        $record = $request->user()->quranReads()->updateOrCreate(
            ['date' => $data['date']],
            ['read' => $data['read']]
        );

        return $this->respond(['quran_read' => $record->toApiArray()], 'Quran read saved.', 201);
    }

    public function update(Request $request, QuranRead $quran)
    {
        abort_unless($quran->user_id === $request->user()->id, 403, 'Not allowed.');

        $data = $request->validate([
            'date' => ['sometimes', 'date'],
            'read' => ['required', 'boolean'],
        ]);

        $quran->update($data);

        return $this->respond(['quran_read' => $quran->fresh()->toApiArray()], 'Quran read updated.');
    }
}
