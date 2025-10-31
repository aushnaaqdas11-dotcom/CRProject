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
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

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
            'attachment' => 'nullable|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:5120', // 5MB max
        ]);

        $assigner = Auth::user();
        
        $userRequest = UserRequest::findOrFail($id);

        // Check if assigner has access
        $hasAccess = Project::where('id', $userRequest->project_id)
            ->where('assigner_id', $assigner->id)
            ->exists();

        if (!$hasAccess) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access'
            ], 403);
        }

        DB::transaction(function() use ($userRequest, $validated, $request) {
            $attachmentPath = $userRequest->attachment;

            // Handle file upload
            if ($request->hasFile('attachment')) {
                Log::info('File upload started', [
                    'request_id' => $userRequest->id,
                    'file_name' => $request->file('attachment')->getClientOriginalName()
                ]);

                // Delete old attachment if exists
                if ($attachmentPath && Storage::exists($attachmentPath)) {
                    Storage::delete($attachmentPath);
                    Log::info('Old attachment deleted', ['path' => $attachmentPath]);
                }

                // Store new attachment
                $file = $request->file('attachment');
                $fileName = 'request_' . $userRequest->id . '_' . time() . '.' . $file->getClientOriginalExtension();
                $attachmentPath = $file->storeAs('attachments', $fileName, 'public');
                
                Log::info('File stored', [
                    'original_name' => $file->getClientOriginalName(),
                    'stored_path' => $attachmentPath,
                    'file_size' => $file->getSize()
                ]);
            }

            // Update request
            $userRequest->update([
                'pricing' => $validated['pricing'] ?? $userRequest->pricing,
                'attachment' => $attachmentPath,
            ]);

            Log::info('Request updated', [
                'new_attachment_path' => $attachmentPath,
                'pricing' => $validated['pricing'] ?? $userRequest->pricing
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Pricing and attachment updated successfully',
            'request' => $userRequest->fresh()
        ]);
    }

    // Method to serve attachments
    public function getAttachment($id)
    {
        $assigner = Auth::user();
        $userRequest = UserRequest::findOrFail($id);

        // Check if assigner has access
        $hasAccess = Project::where('id', $userRequest->project_id)
            ->where('assigner_id', $assigner->id)
            ->exists();

        if (!$hasAccess) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access'
            ], 403);
        }

        if (!$userRequest->attachment) {
            return response()->json([
                'success' => false,
                'message' => 'Attachment not found in database'
            ], 404);
        }

        // Handle different attachment path formats
        $attachmentPath = $userRequest->attachment;
        
        // Case 1: If it's just a filename (old web attachments)
        if (!str_contains($attachmentPath, '/') && !str_contains($attachmentPath, '\\')) {
            $attachmentPath = 'attachments/' . $attachmentPath;
        }
        
        Log::info('Attachment access attempt', [
            'request_id' => $id,
            'original_path' => $userRequest->attachment,
            'resolved_path' => $attachmentPath
        ]);

        // Check if file exists in storage
        if (!Storage::exists($attachmentPath)) {
            // Try to find in public directory
            $publicPath = public_path('storage/' . $attachmentPath);
            if (file_exists($publicPath)) {
                Log::info('File found in public directory', ['path' => $publicPath]);
                return response()->file($publicPath);
            }
            
            Log::error('Attachment file not found', [
                'storage_path' => $attachmentPath,
                'public_path' => $publicPath,
                'all_attachments' => Storage::files('attachments')
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Attachment file not found in storage',
                'debug' => 'Looking for file at: ' . $attachmentPath
            ], 404);
        }

        Log::info('Serving attachment file', ['path' => $attachmentPath]);
        return Storage::response($attachmentPath);
    }

    // Temporary debug method - remove after testing
    public function debugAttachments()
    {
        $requests = UserRequest::whereNotNull('attachment')->get();
        
        $results = [];
        foreach ($requests as $request) {
            $attachmentPath = $request->attachment;
            if (!str_contains($attachmentPath, '/') && !str_contains($attachmentPath, '\\')) {
                $attachmentPath = 'attachments/' . $attachmentPath;
            }
            
            $results[] = [
                'id' => $request->id,
                'attachment_field' => $request->attachment,
                'resolved_path' => $attachmentPath,
                'file_exists_storage' => Storage::exists($attachmentPath),
                'file_exists_public' => file_exists(public_path('storage/' . $attachmentPath)),
                'storage_files' => Storage::files('attachments'),
            ];
        }
        
        return $results;
    }
}