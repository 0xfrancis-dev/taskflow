<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:80',
            'email' => 'required|email:rfc|max:120|unique:users,email',
            'phone' => 'nullable|string|max:20',
            'password' => 'required|string|min:8|confirmed',
            'referral' => 'nullable|string|max:12',
        ]);

        $referrer = ! empty($data['referral']) ? User::where('referral_code', strtoupper($data['referral']))->first() : null;

        $user = User::create([
            'name' => $data['name'],
            'email' => strtolower($data['email']),
            'phone' => $data['phone'] ?? null,
            'password' => $data['password'],
            'referred_by' => $referrer?->id,
        ]);

        return response()->json([
            'token' => $user->createToken('web')->plainTextToken,
            'user' => $user->fresh(),
        ], 201);
    }

    public function login(Request $request)
    {
        $data = $request->validate(['email' => 'required|email', 'password' => 'required|string']);
        $user = User::where('email', strtolower($data['email']))->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages(['email' => 'Email or password is incorrect.']);
        }
        if ($user->status !== 'active') {
            return response()->json(['message' => 'Your account is suspended. Contact '.config('taskflow.support_email').'.'], 403);
        }

        return response()->json(['token' => $user->createToken('web')->plainTextToken, 'user' => $user]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out.']);
    }
}
