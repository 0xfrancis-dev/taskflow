<?php

namespace App\Http\Controllers;

use App\Models\Deposit;
use App\Models\Transaction;
use App\Models\Withdrawal;
use App\Services\WalletService;
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

    public function withdraw(Request $request)
    {
        $data = $request->validate([
            'amount' => 'required|numeric|min:'.config('taskflow.min_withdrawal').'|max:5000000',
            'bank_name' => 'required|string|max:80',
            'account_number' => 'required|digits:10',
            'account_name' => 'required|string|max:100',
        ]);

        $w = DB::transaction(function () use ($request, $data) {
            WalletService::debit($request->user(), (float) $data['amount'], 'withdrawal', 'Withdrawal request to '.$data['bank_name']);

            return Withdrawal::create($data + ['user_id' => $request->user()->id]);
        });

        return response()->json($w, 201);
    }
}
