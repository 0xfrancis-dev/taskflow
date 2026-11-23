<?php

namespace App\Http\Controllers;

use App\Models\Submission;
use App\Models\Task;
use App\Models\User;
use App\Services\Notifier;
use App\Services\WalletService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SubmissionController extends Controller
{
    public function store(Request $request, Task $task)
    {
        $data = $request->validate([
            'proof' => 'required|string|min:5|max:1500',
            'proof_image' => 'nullable|image|max:4096',
        ]);
        $user = $request->user();

        $submission = DB::transaction(function () use ($task, $user, $data, $request) {
            $t = Task::whereKey($task->id)->lockForUpdate()->firstOrFail();

            if ($t->user_id === $user->id) {
                throw ValidationException::withMessages(['proof' => 'You cannot complete your own campaign.']);
            }
            if ($t->status !== 'active') {
                throw ValidationException::withMessages(['proof' => 'This task is no longer available.']);
            }
            if ($t->submissions()->where('user_id', $user->id)->exists()) {
                throw ValidationException::withMessages(['proof' => 'You already submitted this task.']);
            }
            $pending = $t->submissions()->where('status', 'pending')->count();
            if ($t->approved_count + $pending >= $t->slots) {
                throw ValidationException::withMessages(['proof' => 'All slots are taken. Try another task.']);
            }

            return Submission::create([
                'task_id' => $t->id,
                'user_id' => $user->id,
                'proof' => $data['proof'],
                'proof_image' => $request->hasFile('proof_image') ? $request->file('proof_image')->store('proofs', 'public') : null,
            ]);
        });

        Notifier::newSubmission($task->user, $task, $user);

        return response()->json($submission, 201);
    }

    public function mine(Request $request)
    {
        $q = Submission::with('task:id,title,platform,reward')->where('user_id', $request->user()->id)->latest();
        if ($s = $request->query('status')) {
            $q->where('status', $s);
        }

        return response()->json($q->paginate(15));
    }

    public function review(Request $request, Submission $submission)
    {
        $data = $request->validate(['action' => 'required|in:approve,reject', 'note' => 'nullable|string|max:200']);
        $reviewer = $request->user();

        DB::transaction(function () use ($submission, $data, $reviewer) {
            $s = Submission::whereKey($submission->id)->lockForUpdate()->firstOrFail();
            $task = Task::whereKey($s->task_id)->lockForUpdate()->firstOrFail();

            if ($task->user_id !== $reviewer->id && ! $reviewer->isAdmin()) {
                abort(403, 'Only the campaign owner can review this.');
            }
            if ($s->status !== 'pending') {
                throw ValidationException::withMessages(['action' => 'This submission was already reviewed.']);
            }

            if ($data['action'] === 'reject') {
                $s->update(['status' => 'rejected', 'note' => $data['note'] ?? 'Proof did not meet the task requirements.', 'reviewed_at' => now()]);

                return;
            }

            $s->update(['status' => 'approved', 'note' => $data['note'] ?? null, 'reviewed_at' => now()]);
            $task->increment('approved_count');
            WalletService::credit($s->user, (float) $task->reward, 'reward', 'Reward: '.$task->title);

            // Referral bonus: paid once, on the referred person's first approved task.
            $earner = User::whereKey($s->user_id)->lockForUpdate()->first();
            if ($earner->referred_by && ! $earner->referral_rewarded) {
                $referrer = User::find($earner->referred_by);
                if ($referrer && $referrer->status === 'active') {
                    WalletService::credit($referrer, (float) config('taskflow.referral_bonus'), 'referral', 'Referral bonus: '.$earner->name.' completed a first task');
                }
                $earner->update(['referral_rewarded' => true]);
            }

            if ($task->fresh()->approved_count >= $task->slots) {
                $task->update(['status' => 'completed']);
            }
        });

        $done = $submission->fresh()->load('task', 'user');
        Notifier::submissionReviewed($done);

        return response()->json($done);
    }
}
