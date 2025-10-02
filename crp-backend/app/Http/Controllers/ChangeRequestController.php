<?php

namespace App\Http\Controllers;

use App\Models\UserRequest;
use App\Models\Project;
use App\Models\Query;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ChangeRequestController extends Controller
{
    /**
     * Store a new change request from the user.
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        // Check if user already has 3 or more pending requests
        $pendingCount = UserRequest::where('user_id', $user->id)
            ->where('status', 'pending')
            ->count();

        if ($pendingCount >= 3) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot submit more than 3 pending requests at a time.'
            ], 422);
        }

        $validated = $request->validate([
            'query_id'        => 'nullable|exists:queries,id',
            'project_id'      => 'required|exists:projects,id',
            'priority'        => 'required|string|in:high,normal,anytime',
            'request_details' => 'required|string',
        ]);

        $newRequest = UserRequest::create([
            'user_id'        => $user->id,
            'query_id'       => $validated['query_id'] ?? null,
            'project_id'     => $validated['project_id'],
            'priority'       => $validated['priority'],
            'request_details'=> $validated['request_details'],
            'status'         => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Your request has been submitted successfully!',
            'data' => $newRequest
        ]);
    }

    /**
     * Show user completed requests history.
     */
    public function history()
    {
        $user = Auth::user();

        $completedRequests = UserRequest::with(['project'])
            ->where('user_id', $user->id)
            ->where('status', 'completed')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $completedRequests
        ]);
    }
}