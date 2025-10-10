<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ResolverController extends Controller
{
    public function dashboard()
    {
        try {
            $requests = UserRequest::with(['user', 'project'])
                ->where('assigned_to', Auth::id())
                ->latest()
                ->get();

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
                'message' => 'Failed to load resolver dashboard',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $request = UserRequest::with(['user', 'project'])
                ->where('assigned_to', Auth::id())
                ->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $request
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Request not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    public function updateStatus(Request $request, $id)
    {
        try {
            $userRequest = UserRequest::where('assigned_to', Auth::id())
                ->findOrFail($id);

            $validated = $request->validate([
                'status' => 'required|in:pending,inprogress,completed',
                'hours_worked' => 'nullable|numeric|min:0',
                'resolver_comment' => 'nullable|string|max:1000'
            ]);

            $userRequest->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Status updated successfully',
                'data' => $userRequest
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update request',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}