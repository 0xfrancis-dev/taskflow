<?php

namespace App\Services;

use App\Models\Withdrawal;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Sends approved withdrawals to the user's bank through Monnify.
 * Money safety rules:
 *  - the row is claimed (status "processing") BEFORE calling Monnify, so a double click can never send twice;
 *  - the user is refunded only when Monnify itself reports FAILED or REVERSED, exactly once (row lock);
 *  - if the outcome is unknown (timeout), nothing is refunded; the admin checks the status instead.
 */
class PayoutService
{
    public function __construct(private MonnifyService $monnify)
    {
    }

    public function send(Withdrawal $withdrawal): Withdrawal
    {
        if (! $this->monnify->payoutsEnabled()) {
            throw ValidationException::withMessages(['action' => 'Automatic payouts are not configured. Mark it paid after paying manually.']);
        }

        $w = DB::transaction(function () use ($withdrawal) {
            $l = Withdrawal::whereKey($withdrawal->id)->lockForUpdate()->firstOrFail();
            if ($l->status !== 'pending') {
                throw ValidationException::withMessages(['action' => 'This withdrawal was already processed.']);
            }
            if (! $l->bank_code) {
                throw ValidationException::withMessages(['action' => 'No bank code on this request. Pay it manually and click "Mark paid".']);
            }
            $l->update(['status' => 'processing', 'payout_reference' => 'TFW'.$l->id.strtoupper(Str::random(8)), 'note' => 'Sending to Monnify']);

            return $l;
        });

        $res = $this->monnify->transfer($w->payout_reference, (float) $w->amount, 'TaskFlow withdrawal', $w->bank_code, $w->account_number, $w->account_name);

        if (! empty($res['retry'])) {
            // Monnify refused before sending anything: put it back so the admin can fix the cause and retry.
            $w->update(['status' => 'pending', 'payout_reference' => null, 'note' => 'Monnify: '.$res['message']]);
            throw ValidationException::withMessages(['action' => 'Monnify refused the transfer: '.$res['message']]);
        }
        if (! empty($res['unknown'])) {
            $w->update(['note' => 'Unconfirmed: '.$res['message'].'. Click "Check status".']);

            return $w->fresh();
        }

        return $this->settle($w->id, $res['status'] ?? null);
    }

    /** Ask Monnify for the real status and apply it. */
    public function refresh(Withdrawal $withdrawal): Withdrawal
    {
        if (! $withdrawal->payout_reference) {
            return $withdrawal;
        }
        $status = $this->monnify->transferStatus($withdrawal->payout_reference);

        return $status ? $this->settle($withdrawal->id, $status) : $withdrawal->fresh();
    }

    public function authorize(Withdrawal $withdrawal, string $otp): Withdrawal
    {
        if ($withdrawal->status !== 'processing' || ! $withdrawal->payout_reference) {
            throw ValidationException::withMessages(['otp' => 'This withdrawal is not waiting for authorization.']);
        }
        $r = $this->monnify->authorizeTransfer($withdrawal->payout_reference, $otp);
        if (! $r['ok']) {
            throw ValidationException::withMessages(['otp' => $r['message']]);
        }

        return $this->refresh($withdrawal);
    }

    public function settle(int $id, ?string $status): Withdrawal
    {
        $event = null;
        $result = DB::transaction(function () use ($id, $status, &$event) {
            $w = Withdrawal::whereKey($id)->lockForUpdate()->firstOrFail();
            if (! in_array($w->status, ['processing', 'paid'])) {
                return $w;
            }

            if ($status === 'SUCCESS') {
                if ($w->status === 'processing') {
                    $w->update(['status' => 'paid', 'note' => 'Paid via Monnify']);
                    $event = 'paid';
                }
            } elseif (in_array($status, ['FAILED', 'REVERSED'])) {
                WalletService::credit($w->user, (float) $w->amount, 'refund', 'Withdrawal could not be completed, funds returned');
                $w->update(['status' => 'rejected', 'note' => 'Payout '.strtolower($status).' by Monnify. Funds returned to wallet.']);
                $event = 'failed';
            } elseif ($w->status === 'processing') {
                $label = $status === 'PENDING_AUTHORIZATION' || $status === 'OTP_EMAIL_DISPATCH'
                    ? 'Waiting for transfer authorization (OTP)'
                    : 'Monnify status: '.($status ?: 'unknown');
                $w->update(['note' => $label]);
            }

            return $w->fresh();
        });

        if ($event === 'paid') {
            Notifier::withdrawalPaid($result);
        } elseif ($event === 'failed') {
            Notifier::withdrawalFailed($result, 'Monnify could not complete the transfer to your bank.');
        }

        return $result;
    }
}
