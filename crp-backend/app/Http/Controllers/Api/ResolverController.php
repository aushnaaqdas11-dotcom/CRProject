<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserRequest;
use App\Models\Assigner;
use App\Models\Resolver;
use App\Models\Developer;
use App\Models\Project;
use App\Models\Query;
use App\Models\SubQuery;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class ResolverController extends Controller
{
    /**
     * ---------------------
     * Resolver Dashboard Data
     * ---------------------
     */
    public function dashboard()
    {
        try {
            $resolver = Auth::user();

            // Check if user has role 3 (resolver)
            if ($resolver->role != 3) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. Resolver privileges required.'
                ], 403);
            }

            // Get assigned requests for this resolver (using same logic as web)
            $assignedRequests = $this->getAssignedRequests($resolver->id);

            // Calculate stats
            $stats = [
                'total' => $assignedRequests->count(),
                'in_progress' => $assignedRequests->where('status', 'inprogress')->count(),
                'completed' => $assignedRequests->where('status', 'completed')->count(),
                'pending' => $assignedRequests->where('status', 'pending')->count(),
            ];

            // Get recent assigned requests (limit to 5)
            $recentRequests = $assignedRequests->take(5);

            return response()->json([
                'success' => true,
                'data' => [
                    'user' => $resolver,
                    'assigned_requests' => $recentRequests,
                    'stats' => $stats,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load resolver dashboard',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * ---------------------
     * Get All Assigned Requests for Resolver
     * ---------------------
     */
    public function getAssignedRequestsList()
    {
        try {
            $resolver = Auth::user();

            if ($resolver->role != 3) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. Resolver privileges required.'
                ], 403);
            }

            $assignedRequests = $this->getAssignedRequests($resolver->id);

            return response()->json([
                'success' => true,
                'data' => [
                    'assigned_requests' => $assignedRequests
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch assigned requests',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * ---------------------
     * Get Request Details for Resolver
     * ---------------------
     */
    public function getRequestDetails($requestId)
    {
        try {
            $resolver = Auth::user();

            if ($resolver->role != 3) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. Resolver privileges required.'
                ], 403);
            }

            // Find the developer record for this resolver (SAME AS WEB)
            $developer = Developer::where('user_id', $resolver->id)->first();
            
            if (!$developer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Developer profile not found for this user'
                ], 404);
            }

            // Get request with all related data (SAME AS WEB)
            $request = UserRequest::with([
                'user',
                'project',
                'service',
                'assigner.developer',
                'resolver'
            ])
            ->whereHas('assigner', function($query) use ($developer) {
                $query->where('developer_id', $developer->id);
            })
            ->find($requestId);

            if (!$request) {
                return response()->json([
                    'success' => false,
                    'message' => 'Request not found or not assigned to you'
                ], 404);
            }

            // Get assigner comment (SAME AS WEB)
            $assignerComment = Assigner::where('developer_id', $developer->id)
                ->where('request_id', $requestId)
                ->value('assigner_comment');

            // Get sub query details if exists
            $subQuery = null;
            if ($request->sub_query) {
                $subQuery = SubQuery::find($request->sub_query);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'request' => $request,
                    'assigner_comment' => $assignerComment,
                    'sub_query' => $subQuery,
                    'resolver_data' => $request->resolver
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch request details',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * ---------------------
     * Update Request Status and Working Hours
     * ---------------------
     */
    public function updateRequestStatus(Request $request, $requestId)
    {
        try {
            $resolver = Auth::user();

            if ($resolver->role != 3) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. Resolver privileges required.'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'status' => 'required|in:pending,inprogress,completed',
                'working_hours' => 'nullable|numeric|min:0',
                'resolver_comment' => 'nullable|string|max:2000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Find the developer record for this resolver (SAME AS WEB)
            $developer = Developer::where('user_id', $resolver->id)->first();
            
            if (!$developer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Developer profile not found for this user'
                ], 404);
            }

            // Check if request is assigned to this resolver (SAME AS WEB)
            $userRequest = UserRequest::whereHas('assigner', function($query) use ($developer) {
                $query->where('developer_id', $developer->id);
            })->find($requestId);

            if (!$userRequest) {
                return response()->json([
                    'success' => false,
                    'message' => 'Request not found or not assigned to you'
                ], 404);
            }

            DB::transaction(function() use ($userRequest, $request, $requestId) {
                // Update request status
                $userRequest->status = $request->status;
                $userRequest->save();

                // Update or create resolver record
                Resolver::updateOrCreate(
                    ['request_id' => $requestId],
                    [
                        'working_hours' => $request->working_hours ?? 0,
                        'resolver_comment' => $request->resolver_comment ?? null,
                    ]
                );
            });

            // Get updated request data
            $updatedRequest = UserRequest::with([
                'user',
                'project',
                'service',
                'assigner.developer',
                'resolver'
            ])->find($requestId);

            return response()->json([
                'success' => true,
                'message' => 'Request updated successfully',
                'data' => [
                    'request' => $updatedRequest,
                    'resolver_data' => $updatedRequest->resolver
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update request',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * ---------------------
     * Get Resolver Statistics
     * ---------------------
     */
    public function getStatistics()
    {
        try {
            $resolver = Auth::user();

            if ($resolver->role != 3) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. Resolver privileges required.'
                ], 403);
            }

            $assignedRequests = $this->getAssignedRequests($resolver->id);

            // Get request IDs properly
            $requestIds = $assignedRequests->pluck('id')->toArray();
            
            $totalWorkingHours = Resolver::whereIn('request_id', $requestIds)
                ->sum('working_hours');

            $completedRequests = $assignedRequests->where('status', 'completed');

            $stats = [
                'total_assigned' => $assignedRequests->count(),
                'in_progress' => $assignedRequests->where('status', 'inprogress')->count(),
                'completed' => $completedRequests->count(),
                'pending' => $assignedRequests->where('status', 'pending')->count(),
                'total_working_hours' => $totalWorkingHours,
                'completion_rate' => $assignedRequests->count() > 0 
                    ? round(($completedRequests->count() / $assignedRequests->count()) * 100, 2)
                    : 0,
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'stats' => $stats
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch statistics',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * ---------------------
     * Helper function to get assigned requests (SAME LOGIC AS WEB)
     * ---------------------
     */
    private function getAssignedRequests($resolverUserId)
    {
        // First, find the developer record for this user (SAME AS WEB)
        $developer = Developer::where('user_id', $resolverUserId)->first();
        
        if (!$developer) {
            return collect();
        }

        return UserRequest::with([
                'user',
                'project', 
                'service',
                'assigner.developer',
                'resolver'
            ])
            ->whereHas('assigner', function($query) use ($developer) {
                $query->where('developer_id', $developer->id);
            })
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function($request) {
                // Format the data for frontend
                return [
                    'id' => $request->id,
                    'user' => [
                        'name' => $request->user->name ?? 'Unknown User',
                        'id' => $request->user->id ?? null
                    ],
                    'service' => [
                        'name' => $request->service->name ?? '---',
                        'id' => $request->service->id ?? null
                    ],
                    'priority' => $request->priority,
                    'status' => $request->status,
                    'created_at' => $request->created_at->format('Y-m-d H:i:s'),
                    'created_formatted' => $request->created_at->format('d M Y'),
                    'project' => $request->project ? [
                        'name' => $request->project->name,
                        'id' => $request->project->id
                    ] : null,
                    'request_details' => $request->request_details,
                    'assigner_comment' => $request->assigner ? $request->assigner->assigner_comment : null,
                    'working_hours' => $request->resolver ? $request->resolver->working_hours : 0,
                    'resolver_comment' => $request->resolver ? $request->resolver->resolver_comment : null,
                ];
            });
    }
}