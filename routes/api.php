<?php

use App\Http\Controllers\Admin\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PublicController;
use App\Http\Controllers\SubmissionController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\WalletController;
use Illuminate\Support\Facades\Route;

// ---- Public ----
Route::get('/config', [PublicController::class, 'config']);
Route::get('/public/stats', [PublicController::class, 'stats']);
Route::get('/public/featured', [PublicController::class, 'featured']);
Route::post('/contact', [PublicController::class, 'contact'])->middleware('throttle:5,1');
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

// ---- Signed-in users ----
Route::middleware(['auth:sanctum', 'active'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [ProfileController::class, 'me']);
    Route::post('/profile', [ProfileController::class, 'update']);
    Route::get('/dashboard', [ProfileController::class, 'dashboard']);
    Route::get('/referrals', [ProfileController::class, 'referrals']);

    Route::get('/tasks', [TaskController::class, 'index']);
    Route::post('/tasks', [TaskController::class, 'store']);
    Route::get('/my-tasks', [TaskController::class, 'mine']);
    Route::get('/tasks/{task}', [TaskController::class, 'show']);
    Route::patch('/tasks/{task}/status', [TaskController::class, 'updateStatus']);
    Route::delete('/tasks/{task}', [TaskController::class, 'close']);
    Route::get('/tasks/{task}/submissions', [TaskController::class, 'submissions']);
    Route::post('/tasks/{task}/submit', [SubmissionController::class, 'store']);

    Route::get('/my-submissions', [SubmissionController::class, 'mine']);
    Route::post('/submissions/{submission}/review', [SubmissionController::class, 'review']);

    Route::get('/wallet', [WalletController::class, 'index']);
    Route::post('/wallet/deposit', [WalletController::class, 'deposit']);
    Route::post('/wallet/withdraw', [WalletController::class, 'withdraw']);
});

// ---- Admin ----
Route::middleware(['auth:sanctum', 'active', 'admin'])->prefix('admin')->group(function () {
    Route::get('/stats', [AdminController::class, 'stats']);
    Route::get('/users', [AdminController::class, 'users']);
    Route::patch('/users/{user}', [AdminController::class, 'updateUser']);
    Route::post('/users/{user}/adjust', [AdminController::class, 'adjust']);
    Route::get('/tasks', [AdminController::class, 'tasks']);
    Route::patch('/tasks/{task}', [AdminController::class, 'updateTask']);
    Route::get('/withdrawals', [AdminController::class, 'withdrawals']);
    Route::post('/withdrawals/{withdrawal}', [AdminController::class, 'actionWithdrawal']);
    Route::get('/deposits', [AdminController::class, 'deposits']);
    Route::post('/deposits/{deposit}', [AdminController::class, 'actionDeposit']);
    Route::get('/messages', [AdminController::class, 'messages']);
    Route::patch('/messages/{message}', [AdminController::class, 'readMessage']);
    Route::delete('/messages/{message}', [AdminController::class, 'deleteMessage']);
});
