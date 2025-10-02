<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class Resolver
{
    public function handle(Request $request, Closure $next)
    {
        if (Auth::check() && Auth::user()->role == 3) {
            return $next($request);
        }

        return response()->json(['success' => false, 'message' => 'Unauthorized. Resolver access required.'], 403);
    }
}
