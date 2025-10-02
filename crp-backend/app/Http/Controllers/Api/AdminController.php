<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AdminController extends Controller
{
    public function dashboard()
    {
        try {
            $stats = [
                'total_users' => User::count(),
                'total_requests' => UserRequest::count(),
                'pending_requests' => UserRequest::where('status', 'pending')->count(),
                'inprogress_requests' => UserRequest::where('status', 'inprogress')->count(),
                'completed_requests' => UserRequest::where('status', 'completed')->count(),
            ];

            $recentRequests = UserRequest::with(['user', 'project'])
                ->latest()
                ->take(10)
                ->get();

            $recentUsers = User::latest()
                ->take(5)
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'stats' => $stats,
                    'recent_requests' => $recentRequests,
                    'recent_users' => $recentUsers
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load admin dashboard',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getUsers(Request $request)
    {
        try {
            $users = User::latest()->paginate(10);

            return response()->json([
                'success' => true,
                'data' => $users
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch users',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}