<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class Assigner
{
    public function handle(Request $request, Closure $next)
    {
        if (Auth::check() && Auth::user()->role == 4) {
            return $next($request);
        }

        return response()->json(['success' => false, 'message' => 'Unauthorized. Assigner access required.'], 403);
    }
}
