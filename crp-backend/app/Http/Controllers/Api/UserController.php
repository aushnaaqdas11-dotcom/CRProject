<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserRequest;
use App\Models\Project;
use App\Models\Query;
use App\Models\SubQuery;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

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
        Log::info('Change request submission started', ['user_id' => Auth::id()]);

        $validated = $request->validate([
            'query_id' => 'required|integer',
            'project_id' => 'required|integer',
            'priority' => 'required|in:high,normal,low',
            'request_details' => 'required|string',
            'sub_query' => 'nullable|integer',
            // 'source' => 'required|in:web,app', // Remove this line temporarily
        ]);

        Log::info('Validation passed', $validated);

        // Check if records exist before creating
        $queryExists = Query::find($validated['query_id']);
        $projectExists = Project::find($validated['project_id']);
        
        if (!$queryExists) {
            Log::error('Query not found', ['query_id' => $validated['query_id']]);
            return response()->json([
                'success' => false,
                'message' => 'Selected service does not exist',
            ], 422);
        }

        if (!$projectExists) {
            Log::error('Project not found', ['project_id' => $validated['project_id']]);
            return response()->json([
                'success' => false,
                'message' => 'Selected project does not exist',
            ], 422);
        }

        // Check sub_query if provided
        if (!empty($validated['sub_query'])) {
            $subQueryExists = SubQuery::find($validated['sub_query']);
            if (!$subQueryExists) {
                Log::error('SubQuery not found', ['sub_query' => $validated['sub_query']]);
                return response()->json([
                    'success' => false,
                    'message' => 'Selected sub query does not exist',
                ], 422);
            }
        }

        $userRequestData = [
            'user_id' => Auth::id(),
            'query_id' => $validated['query_id'],
            'project_id' => $validated['project_id'],
            'priority' => $validated['priority'],
            'request_details' => $validated['request_details'],
            'status' => 'pending',
            // 'source' => $validated['source'], // Remove this line temporarily
        ];

        // Only add sub_query if it's provided and not empty
        if (!empty($validated['sub_query'])) {
            $userRequestData['sub_query'] = $validated['sub_query'];
        }

        Log::info('Creating user request with data:', $userRequestData);

        $userRequest = UserRequest::create($userRequestData);

        Log::info('Change request created successfully', ['request_id' => $userRequest->id]);

        return response()->json([
            'success' => true,
            'message' => 'Request submitted successfully!',
            'data' => $userRequest,
        ]);

    } catch (\Illuminate\Validation\ValidationException $e) {
        Log::error('Validation failed', ['errors' => $e->errors()]);
        return response()->json([
            'success' => false,
            'message' => 'Validation failed',
            'errors' => $e->errors(),
        ], 422);
        
    } catch (\Exception $e) {
        Log::error('Change request submission error', [
            'error' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine()
        ]);
        
        return response()->json([
            'success' => false,
            'message' => 'Failed to submit request. Please try again.',
        ], 500);
    }
}

    /**
     * ---------------------
     * Fetch Sub Queries
     * ---------------------
     */
    public function getSubQueries($queryId)
    {
        try {
            $subQueries = SubQuery::where('query_id', $queryId)->get();
            return response()->json([
                'success' => true,
                'sub_queries' => $subQueries,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch subqueries',
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
            $user = Auth::user();
            
            $query = UserRequest::with(['project', 'service'])
                ->where('status', 'completed');

            // Check if user is admin (adjust the email as per your admin email)
            $isAdmin = $user->email === 'admin@example.com' || $user->email === 'superadmin@example.com';
            
            if (!$isAdmin) {
                // Regular user: show only their completed requests
                $query->where('user_id', $user->id);
            }
            // Admin: shows all completed requests (no user filter)

            $requests = $query->orderBy('created_at', 'desc')->get();

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