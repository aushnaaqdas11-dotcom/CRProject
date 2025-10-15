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
            'status' => 'nullable|in:pending,inprogress,completed'
        ]);

        DB::transaction(function() use ($validated) {
            $requestRecord = UserRequest::findOrFail($validated['request_id']);

            Assigner::updateOrCreate(
                ['request_id' => $validated['request_id']],
                [
                    'assigner_id' => Auth::id(),
                    'developer_id' => $validated['developer_id'],
                    'assigner_comment' => $validated['assigner_comment'] ?? null,
                ]
            );

            $requestRecord->status = $validated['status'] ?? 'inprogress';
            $requestRecord->save();
        });

        return response()->json([
            'success' => true,
            'message' => 'Request assigned successfully'
        ]);
    }
}
