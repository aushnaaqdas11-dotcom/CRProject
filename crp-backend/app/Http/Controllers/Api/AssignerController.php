<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserRequest;
use App\Models\Project;
use App\Models\Developer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AssignerController extends Controller
{
    public function dashboard()
    {
        try {
            $currentAssignerId = Auth::id();
            
            $projectIds = Project::where('assigner_id', $currentAssignerId)->pluck('id');

            $requests = collect();
            if ($projectIds->isNotEmpty()) {
                $requests = UserRequest::with(['user', 'project'])
                    ->whereIn('project_id', $projectIds)
                    ->orderByDesc('id')
                    ->get();
            }

            $stats = [
                'total' => $requests->count(),
                'pending' => $requests->where('status', 'pending')->count(),
                'in_progress' => $requests->where('status', 'inprogress')->count(),
                'completed' => $requests->where('status', 'completed')->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'requests' => $requests,
                    'stats' => $stats
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
            $request = UserRequest::with(['user', 'project'])->findOrFail($id);
            $developers = Developer::all();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'request' => $request,
                    'developers' => $developers
                ]
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
            $developers = Developer::all();
            
            return response()->json([
                'success' => true,
                'data' => $developers
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch developers',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function assign(Request $request, $id)
    {
        try {
            $validatedData = $request->validate([
                'developer_id' => 'required|exists:developers,id',
                'assigner_comments' => 'nullable|string|max:1000',
            ]);

            $userRequest = UserRequest::findOrFail($id);
            $userRequest->update([
                'assigned_to' => $validatedData['developer_id'],
                'assigner_comment' => $validatedData['assigner_comments'],
                'status' => 'inprogress'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Developer assigned successfully!',
                'data' => $userRequest
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