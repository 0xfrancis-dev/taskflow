<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Submission extends Model
{
    protected $fillable = ['task_id', 'user_id', 'proof', 'proof_image', 'status', 'note', 'reviewed_at'];

    protected $casts = ['reviewed_at' => 'datetime'];

    protected $appends = ['proof_image_url'];

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getProofImageUrlAttribute(): ?string
    {
        return $this->proof_image ? asset('storage/'.$this->proof_image) : null;
    }
}
