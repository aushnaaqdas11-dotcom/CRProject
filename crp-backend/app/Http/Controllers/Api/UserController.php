<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserRequest;
use App\Models\Project;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{
    public function dashboard()
    {
        $user = Auth::user();

        // Projects assigned to this user
        $projects = Project::where('user_id', $user->id)->get();

        $recentRequests = UserRequest::with(['project'])
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        $stats = [
            'total' => UserRequest::where('user_id', $user->id)->count(),
            'pending' => UserRequest::where('user_id', $user->id)->where('status', 'pending')->count(),
            'in_progress' => UserRequest::where('user_id', $user->id)->where('status', 'inprogress')->count(),
            'completed' => UserRequest::where('user_id', $user->id)->where('status', 'completed')->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $user,
                'projects' => $projects,
                'recent_requests' => $recentRequests,
                'stats' => $stats
            ]
        ]);
    }
}
