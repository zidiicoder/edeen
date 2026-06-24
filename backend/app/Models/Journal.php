<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Journal extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'description',
        'emoji',
        'tag',
        'promt',
        'date',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'promt' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Shape consumed by JournalScreen.hydrateEntry().
     */
    public function toApiArray(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'body' => $this->description,
            'emoji' => $this->emoji,
            'mood' => $this->emoji,
            'tag' => $this->tag,
            'promt' => $this->promt ?? [],
            'date' => optional($this->date)->toDateString(),
        ];
    }
}
