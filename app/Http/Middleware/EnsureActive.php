<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureActive
{
    public function handle(Request $request, Closure $next)
    {
        if ($request->user() && $request->user()->status !== 'active') {
            return response()->json(['message' => 'Your account is suspended. Contact '.config('taskflow.support_email').'.'], 403);
        }

        return $next($request);
    }
}
