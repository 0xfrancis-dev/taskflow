<?php

namespace App\Services;

use App\Models\Transaction;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Single place where money moves. Every change locks the user row,
 * updates the balance and writes a ledger line, atomically.
 */
class WalletService
{
    public static function credit(User $user, float $amount, string $type, string $description = ''): Transaction
    {
        return self::move($user, abs($amount), $type, $description);
    }

    public static function debit(User $user, float $amount, string $type, string $description = ''): Transaction
    {
        return self::move($user, -abs($amount), $type, $description);
    }

    private static function move(User $user, float $signed, string $type, string $description): Transaction
    {
        return DB::transaction(function () use ($user, $signed, $type, $description) {
            $locked = User::whereKey($user->id)->lockForUpdate()->firstOrFail();
            $new = round(((float) $locked->balance) + $signed, 2);

            if ($new < 0) {
                throw ValidationException::withMessages(['amount' => 'Insufficient wallet balance.']);
            }

            $locked->update(['balance' => $new]);
            $user->balance = $new;

            return Transaction::create([
                'user_id' => $locked->id,
                'type' => $type,
                'amount' => $signed,
                'balance_after' => $new,
                'description' => $description,
            ]);
        });
    }
}
