<?php

namespace App\Http\Controllers;

use App\Models\Deposit;
use App\Models\Withdrawal;
use App\Services\PayoutService;
use App\Services\MonnifyService;
use App\Services\Notifier;
use App\Services\WalletService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MonnifyController extends Controller
{
    /** Step 1: create a pending deposit and send the user to Monnify's checkout page. */
    public function initialize(Request $request, MonnifyService $monnify)
    {
        if (! $monnify->enabled()) {
            return response()->json(['message' => 'Online payment is not available yet. Please use manual transfer.'], 503);
        }

        $data = $request->validate([
            'amount' => 'required|numeric|min:'.config('taskflow.min_deposit').'|max:5000000',
        ]);

        $deposit = Deposit::create([
            'user_id' => $request->user()->id,
            'amount' => $data['amount'],
            'reference' => 'TF'.strtoupper(Str::random(16)),
            'note' => 'monnify:pending',
        ]);

        try {
            $url = $monnify->initialize($request->user(), (float) $data['amount'], $deposit->reference, url('/app/wallet'));
        } catch (\Throwable $e) {
            report($e);
            $deposit->update(['status' => 'rejected', 'note' => 'Could not start payment']);

            return response()->json(['message' => 'Could not start the payment. Please try again.'], 502);
        }

        return response()->json(['checkout_url' => $url, 'reference' => $deposit->reference]);
    }

    /** Step 2a: user returns from checkout; confirm the payment with Monnify and credit the wallet. */
    public function verify(Request $request, MonnifyService $monnify)
    {
        $data = $request->validate(['reference' => 'required|string|max:80']);
        $deposit = Deposit::where('reference', $data['reference'])->where('user_id', $request->user()->id)->firstOrFail();

        return response()->json(['status' => $this->settle($deposit, $monnify)]);
    }

    /** Step 2b: Monnify calls us directly (works even if the user closes the tab). */
    public function webhook(Request $request, MonnifyService $monnify, PayoutService $payouts)
    {
        if (! $monnify->validSignature($request->getContent(), $request->header('monnify-signature'))) {
            return response()->json(['message' => 'Invalid signature'], 401);
        }

        if ($request->input('eventType') === 'SUCCESSFUL_TRANSACTION') {
            $deposit = Deposit::where('reference', (string) $request->input('eventData.paymentReference'))->first();
            if ($deposit) {
                $this->settle($deposit, $monnify);
            }
        }

        if (in_array($request->input('eventType'), ['SUCCESSFUL_DISBURSEMENT', 'FAILED_DISBURSEMENT', 'REVERSED_DISBURSEMENT'])) {
            $w = Withdrawal::where('payout_reference', (string) $request->input('eventData.reference'))->first();
            if ($w) {
                $payouts->refresh($w); // re-checks the real status with Monnify instead of trusting the payload
            }
        }

        return response()->json(['received' => true]);
    }

    /**
     * Never trusts the browser or the webhook body for the amount: always re-checks with Monnify.
     * Idempotent: a row lock guarantees a payment is credited exactly once.
     */
    private function settle(Deposit $deposit, MonnifyService $monnify): string
    {
        if ($deposit->status !== 'pending') {
            return $deposit->status;
        }

        $info = $monnify->verify($deposit->reference);
        if (! $info) {
            return 'pending';
        }

        $status = $info['paymentStatus'] ?? '';

        if (in_array($status, ['PAID', 'OVERPAID'])) {
            $paid = (float) ($info['amountPaid'] ?? 0);
            if ($paid <= 0) {
                return 'pending';
            }
            $credited = false;
            DB::transaction(function () use ($deposit, $info, $paid, &$credited) {
                $d = Deposit::whereKey($deposit->id)->lockForUpdate()->first();
                if ($d->status !== 'pending') {
                    return;
                }
                $d->update(['status' => 'approved', 'amount' => $paid, 'note' => 'Monnify '.($info['transactionReference'] ?? '')]);
                WalletService::credit($d->user, $paid, 'deposit', 'Wallet funded online (ref '.$d->reference.')');
                $credited = true;
            });
            if ($credited) {
                Notifier::walletFunded($deposit->user, $paid);
            }

            return 'approved';
        }

        if (in_array($status, ['FAILED', 'CANCELLED', 'EXPIRED', 'REVERSED'])) {
            $deposit->update(['status' => 'rejected', 'note' => 'Monnify: '.$status]);

            return 'rejected';
        }

        return 'pending';
    }
}
