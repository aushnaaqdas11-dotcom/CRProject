<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\UserRequest;
use App\Models\Assigner;
use App\Models\Developer;
use App\Models\Project;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AssignerController extends Controller
{
    public function getAssignedProjects()
    {
        $assigner = Auth::user();

        $projectIds = Project::where('assigner_id', $assigner->id)->pluck('id');

        $projects = Project::whereIn('id', $projectIds)->get();

        return response()->json([
            'success' => true,
            'projects' => $projects
        ]);
    }

    public function getProjectRequests()
    {
        $assigner = Auth::user();

        $projectIds = Project::where('assigner_id', $assigner->id)->pluck('id');

        $requests = UserRequest::with(['user', 'project', 'service', 'assigner.developer'])
            ->whereIn('project_id', $projectIds)
            ->get();

        return response()->json([
            'success' => true,
            'requests' => $requests
        ]);
    }

    // New method to get requests by status
    public function getRequestsByStatus($status)
    {
        $assigner = Auth::user();

        $projectIds = Project::where('assigner_id', $assigner->id)->pluck('id');

        $requests = UserRequest::with(['user', 'project', 'service', 'assigner.developer'])
            ->whereIn('project_id', $projectIds)
            ->where('status', $status)
            ->get();

        return response()->json([
            'success' => true,
            'requests' => $requests
        ]);
    }

    // New method to get single request details
    public function getRequestDetails($id)
    {
        $assigner = Auth::user();

        $request = UserRequest::with([
            'user', 
            'project', 
            'service', 
            'assigner.developer',
            'resolver'
        ])
        ->where('id', $id)
        ->first();

        if (!$request) {
            return response()->json([
                'success' => false,
                'message' => 'Request not found'
            ], 404);
        }

        // Check if assigner has access to this request's project
        $hasAccess = Project::where('id', $request->project_id)
            ->where('assigner_id', $assigner->id)
            ->exists();

        if (!$hasAccess) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access to this request'
            ], 403);
        }

        return response()->json([
            'success' => true,
            'request' => $request
        ]);
    }

    public function getDevelopers() {
        $developers = Developer::all();
        return response()->json([
            'success' => true,
            'developers' => $developers
        ]);
    }

    public function assignToDeveloper(Request $request)
    {
        $validated = $request->validate([
            'request_id' => 'required|exists:requests,id',
            'developer_id' => 'required|exists:developers,id',
            'assigner_comment' => 'nullable|string|max:2000',
            'status' => 'required|in:pending,inprogress,completed'
        ]);

        DB::transaction(function() use ($validated) {
            $requestRecord = UserRequest::findOrFail($validated['request_id']);

            // For pending requests, don't assign developer
            if ($validated['status'] === 'pending') {
                // Remove assignment if exists
                Assigner::where('request_id', $validated['request_id'])->delete();
                
                $requestRecord->status = 'pending';
                $requestRecord->save();
                return;
            }

            // For inprogress/completed, assign developer
            Assigner::updateOrCreate(
                ['request_id' => $validated['request_id']],
                [
                    'assigner_id' => Auth::id(),
                    'developer_id' => $validated['developer_id'],
                    'assigner_comment' => $validated['assigner_comment'] ?? null,
                ]
            );

            $requestRecord->status = $validated['status'];
            $requestRecord->save();
        });

        return response()->json([
            'success' => true,
            'message' => 'Request assigned successfully'
        ]);
    }

    // New method to update pricing and attachment for completed requests
    public function updatePricingAndAttachment(Request $request, $id)
    {
        $validated = $request->validate([
            'pricing' => 'nullable|numeric|min:0',
            'attachment' => 'nullable|string',
        ]);

        $assigner = Auth::user();
        
        $userRequest = UserRequest::findOrFail($id);

        // Check if assigner has access and request is completed
        $hasAccess = Project::where('id', $userRequest->project_id)
            ->where('assigner_id', $assigner->id)
            ->exists();

        if (!$hasAccess) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access'
            ], 403);
        }

        if ($userRequest->status !== 'completed') {
            return response()->json([
                'success' => false,
                'message' => 'Pricing and attachment can only be updated for completed requests'
            ], 400);
        }

        // Update pricing and attachment
        $userRequest->update([
            'pricing' => $validated['pricing'] ?? null,
            'attachment' => $validated['attachment'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pricing and attachment updated successfully',
            'request' => $userRequest
        ]);
    }
}