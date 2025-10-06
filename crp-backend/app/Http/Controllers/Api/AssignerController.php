<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChangeRequest;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class AssignerController extends Controller
{
    public function dashboard(Request $request)
    {
        try {
            $user = Auth::user();
            
            // Get status filter
            $statusFilter = $request->query('status', 'all');
            $search = $request->query('search', '');
            
            // Build query for requests
            $query = ChangeRequest::with(['user', 'project', 'service', 'assignedTo'])
                ->orderBy('created_at', 'desc');
                
            // Apply status filter
            if ($statusFilter !== 'all') {
                $query->where('status', $statusFilter);
            }
            
            // Apply search filter
            if (!empty($search)) {
                $query->where(function($q) use ($search) {
                    $q->where('request_details', 'like', "%{$search}%")
                      ->orWhereHas('user', function($q) use ($search) {
                          $q->where('name', 'like', "%{$search}%");
                      })
                      ->orWhereHas('service', function($q) use ($search) {
                          $q->where('name', 'like', "%{$search}%");
                      });
                });
            }
            
            $requests = $query->paginate(10);
            
            // Get statistics
            $totalRequests = ChangeRequest::count();
            $pendingRequests = ChangeRequest::where('status', 'pending')->count();
            $inProgressRequests = ChangeRequest::where('status', 'inprogress')->count();
            $completedRequests = ChangeRequest::where('status', 'completed')->count();

            return response()->json([
                'success' => true,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email
                ],
                'statistics' => [
                    'total' => $totalRequests,
                    'pending' => $pendingRequests,
                    'in_progress' => $inProgressRequests,
                    'completed' => $completedRequests
                ],
                'requests' => $requests,
                'filters' => [
                    'status' => $statusFilter,
                    'search' => $search
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load assigner dashboard',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $request = ChangeRequest::with(['user', 'project', 'service'])->findOrFail($id);
            $developers = User::where('role', 3)->where('status', 'active')->get(['id', 'name', 'email']);
            
            return response()->json([
                'success' => true,
                'change_request' => $request,
                'developers' => $developers
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Request not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    public function getDevelopers()
    {
        try {
            $developers = User::where('role', 3)
                ->where('status', 'active')
                ->get(['id', 'name', 'email']);

            return response()->json([
                'success' => true,
                'developers' => $developers
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch developers',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function assignDeveloper(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'developer_id' => 'required|exists:users,id',
                'assignment_notes' => 'nullable|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $changeRequest = ChangeRequest::findOrFail($id);
            
            $changeRequest->update([
                'assigned_to' => $request->developer_id,
                'assignment_notes' => $request->assignment_notes,
                'status' => 'assigned'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Developer assigned successfully',
                'change_request' => $changeRequest->load(['service', 'project', 'user', 'assignedTo'])
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to assign developer',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}