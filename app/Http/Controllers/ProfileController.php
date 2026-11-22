<?php

namespace App\Http\Controllers;

use App\Models\Submission;
use App\Models\Task;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ProfileController extends Controller
{
    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    public function update(Request $request)
    {
        $user = $request->user();
        $data = $request->validate([
            'name' => 'required|string|max:80',
            'phone' => 'nullable|string|max:20',
            'current_password' => 'nullable|string',
            'password' => 'nullable|string|min:8|confirmed',
        ]);

        if (! empty($data['password'])) {
            if (! Hash::check($data['current_password'] ?? '', $user->password)) {
                throw ValidationException::withMessages(['current_password' => 'Current password is incorrect.']);
            }
            $user->password = $data['password'];
        }
        $user->name = $data['name'];
        $user->phone = $data['phone'] ?? null;
        $user->save();

        return response()->json($user);
    }

    public function dashboard(Request $request)
    {
        $user = $request->user();
        $since = now()->subDays(13)->startOfDay();

        $series = Transaction::where('user_id', $user->id)
            ->whereIn('type', ['reward', 'referral'])
            ->where('created_at', '>=', $since)
            ->select(DB::raw('DATE(created_at) as day'), DB::raw('SUM(amount) as total'))
            ->groupBy('day')->pluck('total', 'day');

        $days = collect(range(0, 13))->map(function ($i) use ($since, $series) {
            $d = $since->copy()->addDays($i)->toDateString();

            return ['day' => $d, 'total' => (float) ($series[$d] ?? 0)];
        });

        return response()->json([
            'balance' => (float) $user->balance,
            'total_earned' => (float) Transaction::where('user_id', $user->id)->whereIn('type', ['reward', 'referral'])->sum('amount'),
            'total_spent' => (float) abs(Transaction::where('user_id', $user->id)->where('type', 'campaign')->sum('amount')),
            'submissions' => [
                'pending' => Submission::where('user_id', $user->id)->where('status', 'pending')->count(),
                'approved' => Submission::where('user_id', $user->id)->where('status', 'approved')->count(),
                'rejected' => Submission::where('user_id', $user->id)->where('status', 'rejected')->count(),
            ],
            'campaigns' => [
                'active' => Task::where('user_id', $user->id)->where('status', 'active')->count(),
                'total' => Task::where('user_id', $user->id)->count(),
                'awaiting_review' => Submission::whereHas('task', fn ($q) => $q->where('user_id', $user->id))->where('status', 'pending')->count(),
            ],
            'series' => $days,
            'recent' => Transaction::where('user_id', $user->id)->latest()->limit(6)->get(),
        ]);
    }

    public function referrals(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'code' => $user->referral_code,
            'bonus' => config('taskflow.referral_bonus'),
            'earned' => (float) Transaction::where('user_id', $user->id)->where('type', 'referral')->sum('amount'),
            'people' => $user->referrals()->latest()->get(['id', 'name', 'created_at', 'referral_rewarded']),
        ]);
    }
}
