<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalahRecord extends Model
{
    protected $fillable = [
        'user_id',
        'date',
        'fajr_performed',
        'dhuhr_performed',
        'asr_performed',
        'maghrib_performed',
        'isha_performed',
        'tahajud_performed',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'fajr_performed' => 'boolean',
            'dhuhr_performed' => 'boolean',
            'asr_performed' => 'boolean',
            'maghrib_performed' => 'boolean',
            'isha_performed' => 'boolean',
            'tahajud_performed' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function toApiArray(): array
    {
        return [
            'id' => $this->id,
            'date' => optional($this->date)->toDateString(),
            'fajr_performed' => (bool) $this->fajr_performed,
            'dhuhr_performed' => (bool) $this->dhuhr_performed,
            'asr_performed' => (bool) $this->asr_performed,
            'maghrib_performed' => (bool) $this->maghrib_performed,
            'isha_performed' => (bool) $this->isha_performed,
            'tahajud_performed' => (bool) $this->tahajud_performed,
        ];
    }
}
