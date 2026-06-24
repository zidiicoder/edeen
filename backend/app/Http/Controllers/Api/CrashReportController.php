<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CrashReportController extends Controller
{
    /**
     * Receives a JS crash report from the app (ErrorBoundary / global handler)
     * and appends it to storage/app/crash-reports.log so it can be read over SSH.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'error' => ['nullable', 'string'],
            'stack' => ['nullable', 'string'],
            'platform' => ['nullable', 'string', 'max:20'],
            'version' => ['nullable'],
            'screen' => ['nullable', 'string', 'max:120'],
        ]);

        $line = '['.now()->toDateTimeString().'] '
            .'platform='.($data['platform'] ?? '?').' '
            .'version='.($data['version'] ?? '?').' '
            .'screen='.($data['screen'] ?? '?')."\n"
            .'error: '.trim($data['error'] ?? '')."\n"
            .'stack: '.trim($data['stack'] ?? '')."\n"
            .str_repeat('-', 60)."\n";

        Storage::append('crash-reports.log', $line);

        return $this->respond(null, 'Crash report received.');
    }
}
