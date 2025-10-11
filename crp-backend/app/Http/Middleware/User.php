<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class User
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user(); // uses Sanctum to get authenticated user

        if ($user && $user->role == 2) {
            return $next($request);
        }

        return response()->json([
            'success' => false,
            'message' => 'Unauthorized. User access required.'
        ], 401);
    }
}
