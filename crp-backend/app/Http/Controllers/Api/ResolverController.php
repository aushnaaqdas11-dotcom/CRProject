<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\UserRequest;
use Illuminate\Support\Facades\Validator;

class ResolverController extends Controller
{
    // GET /api/resolver/dashboard
    public function dashboard(Request $request)
    {
        $user = $request->user();

        $statusFilter = $request->query('status', 'all'); // pending, inprogress, completed, all
        $search = $request->query('search', null);

        // By default show only requests assigned to this resolver
        $query = UserRequest::with(['user', 'project'])
            ->where('assigned_to', $user->id);

        if ($statusFilter !== 'all') {
            $query->where('status', $statusFilter);
        }

        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('request_details', 'like', "%{$search}%")
                  ->orWhereHas('user', fn($r) => $r->where('name', 'like', "%{$search}%"))
                  ->orWhereHas('project', fn($r) => $r->where('name', 'like', "%{$search}%"));
            });
        }

        $requests = $query->orderByDesc('created_at')->paginate(15);

        $stats = [
            'total' => UserRequest::count(),
            'pending' => UserRequest::where('status', 'pending')->count(),
            'inprogress' => UserRequest::where('status', 'inprogress')->count(),
            'completed' => UserRequest::where('status', 'completed')->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'requests' => $requests,
                'stats' => $stats,
                'filters' => ['status' => $statusFilter, 'search' => $search]
            ]
        ]);
    }

    // GET /api/resolver/request/{id}
    public function show($id)
    {
        $req = UserRequest::with(['user', 'project'])->findOrFail($id);

        // ensure resolver owns this request
        if ($req->assigned_to != auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to view this request'
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $req
        ]);
    }

    // PUT /api/resolver/request/{id}
    public function updateStatus(Request $request, $id)
    {
        $val = Validator::make($request->all(), [
            'status' => 'required|in:pending,inprogress,completed',
            'hours_worked' => 'nullable|numeric|min:0',
            'resolver_comment' => 'nullable|string|max:1000'
        ]);

        if ($val->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $val->errors()
            ], 422);
        }

        $req = UserRequest::findOrFail($id);

        if ($req->assigned_to != auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to update this request'
            ], 403);
        }

        $req->update([
            'status' => $request->status,
            'hours_worked' => $request->hours_worked ?? $req->hours_worked,
            'resolver_comment' => $request->resolver_comment ?? $req->resolver_comment,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Request updated',
            'data' => $req
        ]);
    }
}
