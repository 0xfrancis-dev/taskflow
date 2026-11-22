<?php

namespace App\Http\Controllers;

use App\Models\ContactMessage;
use App\Models\Submission;
use App\Models\Task;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;

class PublicController extends Controller
{
    public function config()
    {
        $c = config('taskflow');

        return response()->json([
            'support_email' => $c['support_email'],
            'fee_percent' => $c['fee_percent'],
            'min_reward' => $c['min_reward'],
            'min_deposit' => $c['min_deposit'],
            'min_withdrawal' => $c['min_withdrawal'],
            'referral_bonus' => $c['referral_bonus'],
            'platforms' => $c['platforms'],
            'payment' => $c['payment'],
        ]);
    }

    public function stats()
    {
        return response()->json(Cache::remember('public_stats', 60, fn () => [
            'tasks_completed' => Submission::where('status', 'approved')->count(),
            'rewards_distributed' => (float) Transaction::whereIn('type', ['reward', 'referral'])->sum('amount'),
            'users' => User::count(),
            'campaigns' => Task::count(),
        ]));
    }

    /** A few open tasks for the landing page live feed. */
    public function featured()
    {
        return response()->json(
            Task::where('status', 'active')->latest()->limit(6)->get(['id', 'title', 'platform', 'reward'])
        );
    }

    public function contact(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:80',
            'email' => 'required|email|max:120',
            'subject' => 'required|string|max:120',
            'message' => 'required|string|min:10|max:3000',
        ]);

        ContactMessage::create($data);

        try {
            Mail::raw("From: {$data['name']} <{$data['email']}>\n\n{$data['message']}", function ($m) use ($data) {
                $m->to(config('taskflow.support_email'))->replyTo($data['email'], $data['name'])->subject('[TaskFlow] '.$data['subject']);
            });
        } catch (\Throwable $e) {
            report($e); // message is still saved and visible in the admin dashboard
        }

        return response()->json(['message' => 'Thanks! Your message has been sent. We reply within 24 hours.'], 201);
    }
}
