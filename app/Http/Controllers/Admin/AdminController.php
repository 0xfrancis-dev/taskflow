<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use App\Models\Deposit;
use App\Models\Submission;
use App\Models\Task;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Withdrawal;
use App\Services\WalletService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AdminController extends Controller
{
    public function stats()
    {
        $since = now()->subDays(13)->startOfDay();
        $signups = User::where('created_at', '>=', $since)->select(DB::raw('DATE(created_at) as day'), DB::raw('COUNT(*) as n'))->groupBy('day')->pluck('n', 'day');
        $tasks = Task::where('created_at', '>=', $since)->select(DB::raw('DATE(created_at) as day'), DB::raw('COUNT(*) as n'))->groupBy('day')->pluck('n', 'day');

        $series = collect(range(0, 13))->map(function ($i) use ($since, $signups, $tasks) {
            $d = $since->copy()->addDays($i)->toDateString();

            return ['day' => $d, 'users' => (int) ($signups[$d] ?? 0), 'campaigns' => (int) ($tasks[$d] ?? 0)];
        });

        return response()->json([
            'users' => User::count(),
            'new_users_today' => User::whereDate('created_at', today())->count(),
            'active_campaigns' => Task::where('status', 'active')->count(),
            'pending_submissions' => Submission::where('status', 'pending')->count(),
            'pending_deposits' => Deposit::where('status', 'pending')->count(),
            'pending_withdrawals' => Withdrawal::where('status', 'pending')->count(),
            'pending_withdrawals_amount' => (float) Withdrawal::where('status', 'pending')->sum('amount'),
            'rewards_paid' => (float) Transaction::where('type', 'reward')->sum('amount'),
            'revenue' => (float) Task::sum('fee'),
            'wallet_liability' => (float) User::sum('balance'),
            'unread_messages' => ContactMessage::where('is_read', false)->count(),
            'series' => $series,
            'recent_users' => User::latest()->limit(6)->get(['id', 'name', 'email', 'created_at']),
        ]);
    }

    // ---------- Users ----------
    public function users(Request $request)
    {
        $q = User::withCount(['tasks', 'submissions'])->latest('id');
        if ($s = trim((string) $request->query('q'))) {
            $q->where(fn ($w) => $w->where('name', 'like', "%{$s}%")->orWhere('email', 'like', "%{$s}%"));
        }
        if ($st = $request->query('status')) {
            $q->where('status', $st);
        }

        return response()->json($q->paginate(15));
    }

    public function updateUser(Request $request, User $user)
    {
        $data = $request->validate([
            'status' => ['sometimes', Rule::in(['active', 'suspended'])],
            'role' => ['sometimes', Rule::in(['user', 'admin'])],
        ]);
        if ($user->id === $request->user()->id) {
            throw ValidationException::withMessages(['status' => 'You cannot change your own role or status.']);
        }
        $user->update($data);
        if (($data['status'] ?? null) === 'suspended') {
            $user->tokens()->delete();
        }

        return response()->json($user);
    }

    public function adjust(Request $request, User $user)
    {
        $data = $request->validate(['amount' => 'required|numeric|not_in:0|min:-5000000|max:5000000', 'reason' => 'required|string|max:150']);
        $amount = (float) $data['amount'];
        $amount > 0
            ? WalletService::credit($user, $amount, 'adjustment', 'Admin adjustment: '.$data['reason'])
            : WalletService::debit($user, $amount, 'adjustment', 'Admin adjustment: '.$data['reason']);

        return response()->json($user->fresh());
    }

    // ---------- Campaigns ----------
    public function tasks(Request $request)
    {
        $q = Task::with('user:id,name')->withPending()->latest('id');
        if ($st = $request->query('status')) {
            $q->where('status', $st);
        }
        if ($s = trim((string) $request->query('q'))) {
            $q->where('title', 'like', "%{$s}%");
        }

        return response()->json($q->paginate(15));
    }

    public function updateTask(Request $request, Task $task)
    {
        $data = $request->validate(['status' => ['required', Rule::in(['active', 'paused', 'closed'])]]);

        if ($data['status'] === 'closed') {
            if ($task->status === 'closed') {
                throw ValidationException::withMessages(['status' => 'Already closed.']);
            }
            DB::transaction(fn () => $task->closeAndRefund());
        } elseif (in_array($task->status, ['active', 'paused'])) {
            $task->update($data);
        } else {
            throw ValidationException::withMessages(['status' => 'A '.$task->status.' campaign cannot be changed.']);
        }

        return response()->json($task->fresh());
    }

    // ---------- Withdrawals ----------
    public function withdrawals(Request $request)
    {
        $q = Withdrawal::with('user:id,name,email')->latest('id');
        if ($st = $request->query('status')) {
            $q->where('status', $st);
        }

        return response()->json($q->paginate(15));
    }

    public function actionWithdrawal(Request $request, Withdrawal $withdrawal)
    {
        $data = $request->validate(['action' => 'required|in:pay,reject', 'note' => 'nullable|string|max:200']);

        DB::transaction(function () use ($withdrawal, $data) {
            $w = Withdrawal::whereKey($withdrawal->id)->lockForUpdate()->firstOrFail();
            if ($w->status !== 'pending') {
                throw ValidationException::withMessages(['action' => 'Already processed.']);
            }
            if ($data['action'] === 'pay') {
                $w->update(['status' => 'paid', 'note' => $data['note'] ?? null]);
            } else {
                $w->update(['status' => 'rejected', 'note' => $data['note'] ?? 'Rejected by admin']);
                WalletService::credit($w->user, (float) $w->amount, 'refund', 'Withdrawal rejected, funds returned');
            }
        });

        return response()->json($withdrawal->fresh());
    }

    // ---------- Deposits ----------
    public function deposits(Request $request)
    {
        $q = Deposit::with('user:id,name,email')->latest('id');
        if ($st = $request->query('status')) {
            $q->where('status', $st);
        }

        return response()->json($q->paginate(15));
    }

    public function actionDeposit(Request $request, Deposit $deposit)
    {
        $data = $request->validate(['action' => 'required|in:approve,reject', 'note' => 'nullable|string|max:200']);

        DB::transaction(function () use ($deposit, $data) {
            $d = Deposit::whereKey($deposit->id)->lockForUpdate()->firstOrFail();
            if ($d->status !== 'pending') {
                throw ValidationException::withMessages(['action' => 'Already processed.']);
            }
            if ($data['action'] === 'approve') {
                $d->update(['status' => 'approved', 'note' => $data['note'] ?? null]);
                WalletService::credit($d->user, (float) $d->amount, 'deposit', 'Wallet funded (ref '.$d->reference.')');
            } else {
                $d->update(['status' => 'rejected', 'note' => $data['note'] ?? 'Payment not found']);
            }
        });

        return response()->json($deposit->fresh());
    }

    // ---------- Messages ----------
    public function messages()
    {
        return response()->json(ContactMessage::latest('id')->paginate(15));
    }

    public function readMessage(ContactMessage $message)
    {
        $message->update(['is_read' => true]);

        return response()->json($message);
    }

    public function deleteMessage(ContactMessage $message)
    {
        $message->delete();

        return response()->json(['message' => 'Deleted.']);
    }
}
