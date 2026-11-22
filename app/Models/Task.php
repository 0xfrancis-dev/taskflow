<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Task extends Model
{
    protected $fillable = ['user_id', 'title', 'description', 'platform', 'link', 'reward', 'slots', 'approved_count', 'fee', 'status'];

    protected $casts = ['reward' => 'decimal:2', 'fee' => 'decimal:2'];

    protected $appends = ['remaining'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(Submission::class);
    }

    /** Slots still open = total - approved - currently pending. Always load withCount(pending_count) for lists. */
    public function getRemainingAttribute(): int
    {
        $pending = $this->pending_count ?? $this->submissions()->where('status', 'pending')->count();

        return max(0, $this->slots - $this->approved_count - $pending);
    }

    public function scopeWithPending($query)
    {
        return $query->withCount(['submissions as pending_count' => fn ($q) => $q->where('status', 'pending')]);
    }

    /** Close the campaign and refund the reward of every slot that was never approved. Caller must be inside a DB transaction. */
    public function closeAndRefund(): float
    {
        $refund = round(((float) $this->reward) * max(0, $this->slots - $this->approved_count), 2);
        $this->update(['status' => 'closed']);
        $this->submissions()->where('status', 'pending')->update(['status' => 'rejected', 'note' => 'Campaign closed by owner or admin.', 'reviewed_at' => now()]);
        if ($refund > 0) {
            \App\Services\WalletService::credit($this->user, $refund, 'refund', 'Refund for closed campaign: '.$this->title);
        }

        return $refund;
    }
}
