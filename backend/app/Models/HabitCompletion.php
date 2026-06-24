<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HabitCompletion extends Model
{
    protected $fillable = [
        'habit_id',
        'completion_date',
        'is_completed',
    ];

    protected function casts(): array
    {
        return [
            'completion_date' => 'date',
            'is_completed' => 'boolean',
        ];
    }

    public function habit(): BelongsTo
    {
        return $this->belongsTo(Habit::class);
    }
}
