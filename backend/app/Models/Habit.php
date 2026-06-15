<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Habit extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'description',
        'icon',
        'color',
        'frequency',
        'start_date',
        'custom_date',
        'days_of_week',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'custom_date' => 'date',
            'days_of_week' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function completions(): HasMany
    {
        return $this->hasMany(HabitCompletion::class);
    }
}
