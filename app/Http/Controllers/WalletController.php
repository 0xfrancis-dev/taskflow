<?php

namespace App\Http\Controllers;

use App\Models\Deposit;
use App\Models\Transaction;
use App\Models\Withdrawal;
use App\Services\MonnifyService;
use App\Services\Notifier;
use App\Services\WalletService;
use Illuminate\Validation\ValidationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WalletController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $tx = Transaction::where('user_id', $user->id)->latest('id');
        if ($t = $request->query('type')) {
            $tx->where('type', $t);
        }

        return response()->json([
            'balance' => (float) $user->balance,
            'transactions' => $tx->paginate(15),
            'deposits' => Deposit::where('user_id', $user->id)->latest()->limit(8)->get(),
            'withdrawals' => Withdrawal::where('user_id', $user->id)->latest()->limit(8)->get(),
        ]);
    }

    /** Manual funding: user transfers to the account in settings, then submits the reference; an admin approves it. */
    public function deposit(Request $request)
    {
        abort_unless(config('taskflow.manual_funding'), 403, 'Manual funding is disabled. Please pay online.');

        $data = $request->validate([
            'amount' => 'required|numeric|min:'.config('taskflow.min_deposit').'|max:5000000',
            'reference' => 'required|string|max:80|unique:deposits,reference',
        ]);

        return response()->json(Deposit::create([
            'user_id' => $request->user()->id,
            'amount' => $data['amount'],
            'reference' => $data['reference'],
        ]), 201);
    }

    public function banks(MonnifyService $monnify)
    {
        abort_unless($monnify->payoutsEnabled(), 404);

        return response()->json($monnify->banks());
    }

    public function resolveAccount(Request $request, MonnifyService $monnify)
    {
        abort_unless($monnify->payoutsEnabled(), 404);
        $data = $request->validate(['bank_code' => 'required|string|max:10', 'account_number' => 'required|digits:10']);
        $name = $monnify->resolveAccount($data['bank_code'], $data['account_number']);
        if (! $name) {
            throw ValidationException::withMessages(['account_number' => 'Could not verify this account. Check the bank and number.']);
        }

        return response()->json(['account_name' => $name]);
    }

    public function withdraw(Request $request, MonnifyService $monnify)
    {
        $auto = $monnify->payoutsEnabled();
        $rules = ['amount' => 'required|numeric|min:'.config('taskflow.min_withdrawal').'|max:5000000', 'account_number' => 'required|digits:10'];
        $rules += $auto
            ? ['bank_code' => 'required|string|max:10']
            : ['bank_name' => 'required|string|max:80', 'account_name' => 'required|string|max:100'];
        $data = $request->validate($rules);
        $user = $request->user();

        $today = (float) Withdrawal::where('user_id', $user->id)->where('status', '!=', 'rejected')->where('created_at', '>=', now()->startOfDay())->sum('amount');
        $limit = (float) config('taskflow.withdrawal_daily_limit');
        if ($today + (float) $data['amount'] > $limit) {
            throw ValidationException::withMessages(['amount' => 'Daily withdrawal limit is ₦'.number_format($limit).'. You can still withdraw ₦'.number_format(max(0, $limit - $today)).' today.']);
        }

        if ($auto) {
            $bank = collect($monnify->banks())->firstWhere('code', $data['bank_code']);
            $name = $bank ? $monnify->resolveAccount($data['bank_code'], $data['account_number']) : null;
            if (! $bank || ! $name) {
                throw ValidationException::withMessages(['account_number' => 'Could not verify this bank account.']);
            }
            $data['bank_name'] = $bank['name'];
            $data['account_name'] = $name; // always the bank's name, never what the browser sent
        }

        $w = DB::transaction(function () use ($user, $data) {
            WalletService::debit($user, (float) $data['amount'], 'withdrawal', 'Withdrawal request to '.$data['bank_name']);

            return Withdrawal::create($data + ['user_id' => $user->id]);
        });

        Notifier::withdrawalRequested($w->load('user'));

        return response()->json($w, 201);
    }
}
