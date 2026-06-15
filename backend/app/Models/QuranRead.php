<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuranRead extends Model
{
    protected $fillable = [
        'user_id',
        'date',
        'read',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'read' => 'boolean',
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
            'read' => (bool) $this->read,
        ];
    }
}
