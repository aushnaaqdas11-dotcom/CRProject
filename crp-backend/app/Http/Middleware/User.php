<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class User
{
    public function handle(Request $request, Closure $next)
    {
        if (Auth::check() && in_array(Auth::user()->role, [1, 2, 4])) { // Include role 1 (Super Admin)
            return $next($request);
        }
        return response()->json(['message' => 'Unauthorized'], 403);
    }
}