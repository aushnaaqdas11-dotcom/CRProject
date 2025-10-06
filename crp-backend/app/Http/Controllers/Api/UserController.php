<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Query;
use App\Models\Project;
use App\Models\UserRequest as RequestModel;
use Illuminate\Http\Request as HttpRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    public function getServices(HttpRequest $request)
    {
        $queries = Query::all();
        return response()->json(['success' => true, 'services' => $queries]);
    }

    public function getWebProjects(HttpRequest $request)
    {
        $projects = Project::where('type', 'web')->get();
        return response()->json(['success' => true, 'projects' => $projects]);
    }

    public function getAppProjects(HttpRequest $request)
    {
        $projects = Project::where('type', 'app')->get();
        return response()->json(['success' => true, 'projects' => $projects]);
    }

    public function getRecentRequests(HttpRequest $request)
    {
        $requests = RequestModel::where('user_id', Auth::id())
            ->where('status', '!=', 'completed')
            ->with(['user', 'relatedQuery', 'project']) // Updated to use relatedQuery
            ->latest()
            ->take(5)
            ->get();

        return response()->json(['success' => true, 'requests' => $requests]);
    }

    public function getRequestHistory(HttpRequest $request)
    {
        $requests = RequestModel::where('user_id', Auth::id())
            ->with(['user', 'relatedQuery', 'project']) // Updated to use relatedQuery
            ->latest()
            ->get();

        return response()->json(['success' => true, 'requests' => $requests]);
    }

    public function storeRequest(HttpRequest $request)
    {
        $validator = Validator::make($request->all(), [
            'query_id' => 'required|exists:queries,id',
            'project_id' => 'required|exists:projects,id',
            'priority' => 'required|in:high,normal,low',
            'request_details' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $data = [
            'user_id' => Auth::id(),
            'query_id' => $request->query_id,
            'project_id' => $request->project_id,
            'priority' => $request->priority,
            'request_details' => $request->request_details,
            'status' => 'pending',
            'assigned_to' => null,
            'assigner_comment' => null,
            'resolver_comment' => null,
            'hours_worked' => null,
        ];

        $req = RequestModel::create($data);

        return response()->json(['success' => true, 'message' => 'Request submitted', 'request' => $req]);
    }
}