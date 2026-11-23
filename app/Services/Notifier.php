<?php

namespace App\Services;

use App\Mail\NotificationMail;
use App\Models\Submission;
use App\Models\Task;
use App\Models\User;
use App\Models\Withdrawal;
use Illuminate\Support\Facades\Mail;

/**
 * All transactional emails live here. Sending happens AFTER the HTTP response,
 * and a mail failure is only logged: it can never break a payment or an approval.
 */
class Notifier
{
    private static function naira(float|string $n): string
    {
        return '₦'.number_format((float) $n, 2);
    }

    private static function send(string $to, string $subject, string $heading, array $lines, ?string $button = null, ?string $path = null): void
    {
        $url = $path ? url($path) : null;
        dispatch(function () use ($to, $subject, $heading, $lines, $button, $url) {
            try {
                Mail::to($to)->send(new NotificationMail($subject, $heading, $lines, $button, $url));
            } catch (\Throwable $e) {
                report($e);
            }
        })->afterResponse();
    }

    public static function welcome(User $user): void
    {
        self::send($user->email, 'Welcome to TaskFlow', 'Welcome, '.explode(' ', $user->name)[0].'!', [
            'Your account is ready. Complete simple tasks to earn rewards, or launch your own campaign to grow your reach.',
            'Your referral code is '.$user->referral_code.'. Share it and earn a bonus when friends complete their first task.',
        ], 'Browse tasks', '/app/tasks');
    }

    public static function newSubmission(User $owner, Task $task, User $by): void
    {
        self::send($owner->email, 'New submission on your campaign', 'Someone completed your task', [
            $by->name.' submitted proof for "'.$task->title.'".',
            'Review it to approve the reward or reject it with a reason.',
        ], 'Review submission', '/app/campaigns/'.$task->id);
    }

    public static function submissionReviewed(Submission $s): void
    {
        $user = $s->user;
        $task = $s->task;
        if ($s->status === 'approved') {
            self::send($user->email, 'Reward received: '.self::naira($task->reward), 'Your submission was approved', [
                'Great work! '.self::naira($task->reward).' has been added to your wallet for "'.$task->title.'".',
            ], 'Open wallet', '/app/wallet');
        } elseif ($s->status === 'rejected') {
            self::send($user->email, 'Your submission was not approved', 'Submission not approved', [
                'Your proof for "'.$task->title.'" was not approved.',
                'Reason: '.($s->note ?: 'It did not meet the task requirements.'),
                'You can try other tasks in the marketplace.',
            ], 'Find more tasks', '/app/tasks');
        }
    }

    public static function walletFunded(User $user, float $amount): void
    {
        self::send($user->email, 'Wallet funded: '.self::naira($amount), 'Payment received', [
            'We received your payment. '.self::naira($amount).' has been added to your wallet.',
        ], 'Create a campaign', '/app/campaigns/new');
    }

    public static function withdrawalRequested(Withdrawal $w): void
    {
        self::send($w->user->email, 'Withdrawal request received', 'We received your withdrawal request', [
            self::naira($w->amount).' will be sent to '.$w->account_name.' ('.$w->bank_name.' '.$w->account_number.') after review.',
            'You will get another email as soon as the payment is sent.',
        ], 'View wallet', '/app/wallet');

        self::send(config('taskflow.support_email'), 'New withdrawal request: '.self::naira($w->amount), 'Withdrawal waiting for approval', [
            $w->user->name.' ('.$w->user->email.') requested '.self::naira($w->amount).'.',
            $w->bank_name.' '.$w->account_number.' - '.$w->account_name,
        ], 'Open withdrawals', '/admin/withdrawals');
    }

    public static function withdrawalPaid(Withdrawal $w): void
    {
        self::send($w->user->email, 'Withdrawal sent: '.self::naira($w->amount), 'Your money is on the way', [
            self::naira($w->amount).' has been sent to '.$w->account_name.' ('.$w->bank_name.' '.$w->account_number.').',
            'Bank transfers usually arrive within minutes.',
        ], 'View wallet', '/app/wallet');
    }

    public static function withdrawalFailed(Withdrawal $w, string $reason): void
    {
        self::send($w->user->email, 'Withdrawal could not be completed', 'Your withdrawal was not completed', [
            $reason,
            self::naira($w->amount).' has been returned to your TaskFlow wallet.',
        ], 'View wallet', '/app/wallet');
    }
}
