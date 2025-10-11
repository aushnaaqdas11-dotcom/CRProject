<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserRequest;
use App\Models\Project;
use App\Models\Query;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * ---------------------
     * Dashboard Data
     * ---------------------
     */
   public function dashboard()
{
    try {
        $user = Auth::user();

        // ✅ Fix: use assigner_id instead of user_id
        $projects = Project::where('assigner_id', $user->id)->get();

        $recentRequests = UserRequest::with(['project', 'service'])
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
                'stats' => $stats,
            ]
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Failed to load dashboard',
            'error' => $e->getMessage(),
        ], 500);
    }
}


    /**
     * ---------------------
     * Fetch All Services (Queries)
     * ---------------------
     */
    public function getServices()
    {
        try {
            $services = Query::all();
            return response()->json([
                'success' => true,
                'services' => $services,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch services',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * ---------------------
     * Fetch Projects by Type (web/app)
     * ---------------------
     */
    public function getProjects($type)
    {
        if (!in_array($type, ['web', 'app'])) {
            return response()->json(['success' => false, 'message' => 'Invalid type'], 400);
        }

        try {
            $projects = Project::where('type', $type)->get();
            return response()->json(['success' => true, 'projects' => $projects]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch projects',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * ---------------------
     * Fetch Recent (Active) Requests
     * ---------------------
     */
    public function getRecentRequests()
    {
        try {
            $requests = UserRequest::with(['project', 'service'])
                ->where('user_id', Auth::id())
                ->where('status', '!=', 'completed')
                ->orderBy('created_at', 'desc')
                ->take(5)
                ->get();

            return response()->json([
                'success' => true,
                'requests' => $requests,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch recent requests',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * ---------------------
     * Submit a New Change Request
     * ---------------------
     */
  public function submitChangeRequest(Request $request)
{
    try {
        $validated = $request->validate([
            'query_id' => 'required|integer',
            'project_id' => 'required|integer',
            'priority' => 'required|in:high,normal,low',
            'request_details' => 'required|string',
            'assigned_to' => 'nullable|string',
            'assigner_comment' => 'nullable|string',
        ]);

        $userRequest = UserRequest::create([
            'user_id' => Auth::id(),
            'query_id' => $validated['query_id'],
            'project_id' => $validated['project_id'],
            'priority' => $validated['priority'],
            'request_details' => $validated['request_details'],
            'status' => 'pending',
            'assigned_to' => $validated['assigned_to'] ?? null,
            'assigner_comment' => $validated['assigner_comment'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Request submitted successfully!',
            'data' => $userRequest,
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Failed to submit request',
            'error' => $e->getMessage(),
        ], 500);
    }
}

    /**
     * ---------------------
     * Fetch Request History
     * ---------------------
     */
    public function getHistory()
    {
        try {
            $requests = UserRequest::with(['project', 'service'])
                ->where('user_id', Auth::id())
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'requests' => $requests,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch history',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
