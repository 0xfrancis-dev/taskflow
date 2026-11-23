<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Withdrawal;
use App\Services\PayoutService;
use Illuminate\Http\Request;

class PayoutController extends Controller
{
    public function send(Withdrawal $withdrawal, PayoutService $payouts)
    {
        return response()->json($payouts->send($withdrawal));
    }

    public function check(Withdrawal $withdrawal, PayoutService $payouts)
    {
        return response()->json($payouts->refresh($withdrawal));
    }

    public function otp(Request $request, Withdrawal $withdrawal, PayoutService $payouts)
    {
        $data = $request->validate(['otp' => 'required|string|max:12']);

        return response()->json($payouts->authorize($withdrawal, $data['otp']));
    }
}
