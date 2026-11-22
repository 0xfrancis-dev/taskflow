<?php

namespace Database\Seeders;

use App\Models\Submission;
use App\Models\Task;
use App\Models\User;
use App\Services\WalletService;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::firstOrCreate(['email' => env('ADMIN_EMAIL', 'admin@taskflow.test')], [
            'name' => 'TaskFlow Admin',
            'password' => env('ADMIN_PASSWORD', 'Admin@12345'),
            'role' => 'admin',
        ]);

        if (! filter_var(env('SEED_DEMO_DATA', true), FILTER_VALIDATE_BOOL) || Task::exists()) {
            return;
        }

        $advertiser = User::firstOrCreate(['email' => 'advertiser@taskflow.test'], ['name' => 'Amina Bello', 'password' => 'Password123']);
        $earner = User::firstOrCreate(['email' => 'user@taskflow.test'], ['name' => 'Chidi Okafor', 'password' => 'Password123']);
        WalletService::credit($advertiser, 100000, 'deposit', 'Demo funding');

        $demo = [
            ['Follow our fashion page', 'instagram', 50, 200, 'Follow the page, like the 3 latest posts and send a screenshot of the follow.'],
            ['Watch and like our product video', 'youtube', 80, 150, 'Watch at least 60 seconds, like the video and paste your channel name as proof.'],
            ['Join our Telegram community', 'telegram', 40, 400, 'Join the channel and send your Telegram username as proof.'],
            ['Share our TikTok dance challenge', 'tiktok', 120, 100, 'Repost the video to your story and send the link to your repost.'],
            ['Follow and retweet the launch post', 'x', 60, 250, 'Follow the account and retweet the pinned post. Paste your profile link.'],
            ['Like and share our Facebook page', 'facebook', 45, 300, 'Like the page and share the latest post publicly. Screenshot the share.'],
            ['Sign up on our app landing page', 'website', 150, 80, 'Visit the page, enter a real email and paste the confirmation text you receive.'],
            ['Comment on our giveaway post', 'instagram', 70, 120, 'Comment a genuine reply and tag two friends. Screenshot your comment.'],
        ];
        $fee = (float) config('taskflow.fee_percent');
        foreach ($demo as [$title, $platform, $reward, $slots, $desc]) {
            $cost = $reward * $slots;
            Task::create([
                'user_id' => $advertiser->id, 'title' => $title, 'platform' => $platform, 'reward' => $reward, 'slots' => $slots,
                'description' => $desc, 'link' => 'https://example.com/'.$platform, 'fee' => round($cost * $fee / 100, 2),
            ]);
        }

        $first = Task::first();
        $sub = Submission::create(['task_id' => $first->id, 'user_id' => $earner->id, 'proof' => 'Followed and liked the 3 latest posts. Handle: @chidi.ok']);
        $sub->update(['status' => 'approved', 'reviewed_at' => now()]);
        $first->increment('approved_count');
        WalletService::credit($earner, (float) $first->reward, 'reward', 'Reward: '.$first->title);
    }
}
