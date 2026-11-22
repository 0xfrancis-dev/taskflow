<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Services\WalletService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class TaskController extends Controller
{
    /** Marketplace: open tasks the user can still do. */
    public function index(Request $request)
    {
        $me = $request->user()->id;

        $q = Task::with('user:id,name')->withPending()
            ->where('status', 'active')
            ->where('user_id', '!=', $me)
            ->whereDoesntHave('submissions', fn ($s) => $s->where('user_id', $me))
            ->whereRaw("slots > approved_count + (select count(*) from submissions where submissions.task_id = tasks.id and submissions.status = 'pending')");

        if ($p = $request->query('platform')) {
            $q->where('platform', $p);
        }
        if ($s = trim((string) $request->query('q'))) {
            $q->where(fn ($w) => $w->where('title', 'like', "%{$s}%")->orWhere('description', 'like', "%{$s}%"));
        }
        $request->query('sort') === 'reward' ? $q->orderByDesc('reward') : $q->latest();

        return response()->json($q->paginate(12));
    }

    public function show(Request $request, Task $task)
    {
        $task->load('user:id,name');
        $task->loadCount(['submissions as pending_count' => fn ($q) => $q->where('status', 'pending')]);
        $mine = $task->submissions()->where('user_id', $request->user()->id)->first();

        return response()->json(['task' => $task, 'my_submission' => $mine, 'is_owner' => $task->user_id === $request->user()->id]);
    }

    public function store(Request $request)
    {
        $c = config('taskflow');
        $data = $request->validate([
            'title' => 'required|string|max:120',
            'description' => 'required|string|min:20|max:2000',
            'platform' => ['required', Rule::in($c['platforms'])],
            'link' => 'required|url|max:500',
            'reward' => 'required|numeric|min:'.$c['min_reward'].'|max:100000',
            'slots' => 'required|integer|min:1|max:10000',
        ]);

        $reward = round((float) $data['reward'], 2);
        $cost = round($reward * $data['slots'], 2);
        $fee = round($cost * $c['fee_percent'] / 100, 2);

        $task = DB::transaction(function () use ($request, $data, $reward, $cost, $fee) {
            WalletService::debit($request->user(), $cost + $fee, 'campaign', 'Campaign: '.$data['title'].' (incl. fee)');

            return Task::create([
                'user_id' => $request->user()->id,
                'title' => $data['title'],
                'description' => $data['description'],
                'platform' => $data['platform'],
                'link' => $data['link'],
                'reward' => $reward,
                'slots' => $data['slots'],
                'fee' => $fee,
            ]);
        });

        return response()->json($task, 201);
    }

    public function mine(Request $request)
    {
        return response()->json(
            Task::withPending()->where('user_id', $request->user()->id)->latest()->paginate(15)
        );
    }

    public function updateStatus(Request $request, Task $task)
    {
        abort_unless($task->user_id === $request->user()->id, 403);
        $data = $request->validate(['status' => ['required', Rule::in(['active', 'paused'])]]);
        if (! in_array($task->status, ['active', 'paused'])) {
            throw ValidationException::withMessages(['status' => 'This campaign is already '.$task->status.'.']);
        }
        $task->update($data);

        return response()->json($task);
    }

    /** Close the campaign and refund unused slots. */
    public function close(Request $request, Task $task)
    {
        abort_unless($task->user_id === $request->user()->id, 403);
        if (! in_array($task->status, ['active', 'paused', 'completed'])) {
            throw ValidationException::withMessages(['status' => 'Campaign is already closed.']);
        }
        if ($task->submissions()->where('status', 'pending')->exists()) {
            throw ValidationException::withMessages(['status' => 'Review pending submissions before closing this campaign.']);
        }
        $refund = DB::transaction(fn () => $task->closeAndRefund());

        return response()->json(['refund' => $refund]);
    }

    public function submissions(Request $request, Task $task)
    {
        abort_unless($task->user_id === $request->user()->id || $request->user()->isAdmin(), 403);

        return response()->json([
            'task' => $task->loadCount(['submissions as pending_count' => fn ($q) => $q->where('status', 'pending')]),
            'submissions' => $task->submissions()->with('user:id,name,email')->latest()->get(),
        ]);
    }
}
