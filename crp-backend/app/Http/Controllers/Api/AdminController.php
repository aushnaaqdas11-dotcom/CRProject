<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use App\Models\Project;
use App\Models\UserRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Auth;

class AdminController extends Controller
{
    /**
     * ---------------------
     * Admin Dashboard Data
     * ---------------------
     */
    public function dashboard()
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthenticated.'
                ], 401);
            }

            // Check if user is admin (role ID 1)
            if ($user->role != 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. Admin privileges required.'
                ], 403);
            }

            $totalUsers = User::count();
            $totalRoles = Role::count();
            $totalProjects = Project::count();
            $assignersCount = User::where('role', 4)->count(); // Role ID 4 = Assigner
            $totalRequests = UserRequest::count();
            $pendingRequests = UserRequest::where('status', 'pending')->count();

            $stats = [
                'total_users' => $totalUsers,
                'total_roles' => $totalRoles,
                'total_projects' => $totalProjects,
                'assigners_count' => $assignersCount,
                'total_requests' => $totalRequests,
                'pending_requests' => $pendingRequests,
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'stats' => $stats,
                    'modules' => [
                        [
                            'id' => 1,
                            'title' => 'Manage Users',
                            'description' => 'View, add, and manage user accounts',
                            'route' => 'AdminUsers',
                            'icon' => 'users',
                            'color' => '#667eea'
                        ],
                        [
                            'id' => 2,
                            'title' => 'Roles & Permissions',
                            'description' => 'Configure user roles and access levels',
                            'route' => 'AdminRoles',
                            'icon' => 'id-badge',
                            'color' => '#4ECDC4'
                        ],
                        [
                            'id' => 3,
                            'title' => 'Edit Users',
                            'description' => 'Modify user details and settings',
                            'route' => 'AdminUsers',
                            'icon' => 'edit',
                            'color' => '#f5576c'
                        ],
                        [
                            'id' => 4,
                            'title' => 'Assign Projects',
                            'description' => 'Manage and assign projects to users',
                            'route' => 'AdminAssignProjects',
                            'icon' => 'tasks',
                            'color' => '#ff6b6b'
                        ]
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load admin dashboard',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * ---------------------
     * Get All Users (Manage Users)
     * ---------------------
     */
    public function getUsers(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user || $user->role != 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. Admin privileges required.'
                ], 403);
            }

            $perPage = $request->get('per_page', 10);
            $page = $request->get('page', 1);
            $search = $request->get('search', '');
            
            $usersQuery = User::with(['roleData'])
                ->when($search, function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                          ->orWhere('email', 'like', "%{$search}%")
                          ->orWhere('cnic', 'like', "%{$search}%")
                          ->orWhere('phone', 'like', "%{$search}%");
                })
                ->orderBy('id', 'desc');

            $users = $usersQuery->paginate($perPage, ['*'], 'page', $page);

            return response()->json([
                'success' => true,
                'data' => [
                    'users' => $users->items(),
                    'pagination' => [
                        'current_page' => $users->currentPage(),
                        'last_page' => $users->lastPage(),
                        'per_page' => $users->perPage(),
                        'total' => $users->total(),
                        'from' => $users->firstItem(),
                        'to' => $users->lastItem(),
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch users',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * ---------------------
     * Get User by ID
     * ---------------------
     */
    public function getUser($id)
    {
        try {
            $user = Auth::user();
            if (!$user || $user->role != 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. Admin privileges required.'
                ], 403);
            }

            $userData = User::with(['roleData'])->find($id);

            if (!$userData) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'user' => $userData
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch user',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * ---------------------
     * Create New User
     * ---------------------
     */
    public function createUser(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user || $user->role != 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. Admin privileges required.'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'cnic' => 'required|string|unique:users,cnic',
                'phone' => 'required|string',
                'role' => 'required|integer|exists:roles,id',
                'password' => 'required|string|min:6',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $newUser = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'cnic' => $request->cnic,
                'phone' => $request->phone,
                'role' => $request->role,
                'password' => Hash::make($request->password),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'User created successfully',
                'data' => $newUser
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create user',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * ---------------------
     * Update User (Edit Users)
     * ---------------------
     */
    public function updateUser(Request $request, $id)
    {
        try {
            $adminUser = Auth::user();
            if (!$adminUser || $adminUser->role != 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. Admin privileges required.'
                ], 403);
            }

            $user = User::find($id);
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'email' => ['required', 'email', Rule::unique('users')->ignore($user->id)],
                'cnic' => ['required', 'string', Rule::unique('users')->ignore($user->id)],
                'phone' => 'required|string',
                'role' => 'required|integer|exists:roles,id',
                'password' => 'nullable|string|min:6',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $updateData = [
                'name' => $request->name,
                'email' => $request->email,
                'cnic' => $request->cnic,
                'phone' => $request->phone,
                'role' => $request->role,
            ];

            if ($request->filled('password')) {
                $updateData['password'] = Hash::make($request->password);
            }

            $user->update($updateData);

            return response()->json([
                'success' => true,
                'message' => 'User updated successfully',
                'data' => $user
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update user',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * ---------------------
     * Delete User
     * ---------------------
     */
    public function deleteUser($id)
    {
        try {
            $user = Auth::user();
            if (!$user || $user->role != 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. Admin privileges required.'
                ], 403);
            }

            $userToDelete = User::find($id);
            
            if (!$userToDelete) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            // Prevent deletion of admin user
            if ($userToDelete->id === 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete super admin user'
                ], 403);
            }

            // Prevent self-deletion
            if ($userToDelete->id === $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete your own account'
                ], 403);
            }

            $userToDelete->delete();

            return response()->json([
                'success' => true,
                'message' => 'User deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete user',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * ---------------------
     * Get All Roles (Roles & Permissions)
     * ---------------------
     */
    public function getRoles(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user || $user->role != 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. Admin privileges required.'
                ], 403);
            }

            $search = $request->get('search', '');
            
            $roles = Role::when($search, function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%");
                })
                ->orderBy('id', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'roles' => $roles
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch roles',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * ---------------------
     * Create New Role
     * ---------------------
     */
    public function createRole(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user || $user->role != 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. Admin privileges required.'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:100|unique:roles,name',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $role = Role::create([
                'name' => $request->name,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Role created successfully',
                'data' => $role
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create role',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * ---------------------
     * Update Role
     * ---------------------
     */
    public function updateRole(Request $request, $id)
    {
        try {
            $user = Auth::user();
            if (!$user || $user->role != 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. Admin privileges required.'
                ], 403);
            }

            $role = Role::find($id);
            
            if (!$role) {
                return response()->json([
                    'success' => false,
                    'message' => 'Role not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'name' => ['required', 'string', 'max:100', Rule::unique('roles')->ignore($role->id)],
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $role->update([
                'name' => $request->name,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Role updated successfully',
                'data' => $role
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update role',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * ---------------------
     * Delete Role
     * ---------------------
     */
    public function deleteRole($id)
    {
        try {
            $user = Auth::user();
            if (!$user || $user->role != 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. Admin privileges required.'
                ], 403);
            }

            $role = Role::find($id);
            
            if (!$role) {
                return response()->json([
                    'success' => false,
                    'message' => 'Role not found'
                ], 404);
            }

            // Check if role is being used by any user
            $usersCount = User::where('role', $role->id)->count();
            if ($usersCount > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete role. It is assigned to ' . $usersCount . ' user(s).'
                ], 422);
            }

            $role->delete();

            return response()->json([
                'success' => true,
                'message' => 'Role deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete role',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * ---------------------
     * Get Assignable Users (Assign Projects)
     * ---------------------
     */
    public function getAssignableUsers(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user || $user->role != 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. Admin privileges required.'
                ], 403);
            }

            $search = $request->get('search', '');
            
            $users = User::where('role', 4) // Role ID 4 = Assigner
                ->when($search, function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                          ->orWhere('email', 'like', "%{$search}%")
                          ->orWhere('cnic', 'like', "%{$search}%");
                })
                ->orderBy('name', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'users' => $users
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch assignable users',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * ---------------------
     * Get All Projects for Assignment
     * ---------------------
     */
    public function getProjectsForAssignment()
    {
        try {
            $user = Auth::user();
            if (!$user || $user->role != 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. Admin privileges required.'
                ], 403);
            }

            $projects = Project::orderBy('name', 'asc')->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'projects' => $projects
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch projects',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * ---------------------
     * Assign Projects to User
     * ---------------------
     */
    public function assignProjectsToUser(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user || $user->role != 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. Admin privileges required.'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'user_id' => 'required|integer|exists:users,id',
                'project_ids' => 'required|array',
                'project_ids.*' => 'integer|exists:projects,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $assignerUser = User::find($request->user_id);
            
            // Check if user is an assigner
            if ($assignerUser->role != 4) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only assigner users can be assigned projects'
                ], 422);
            }

            // Update projects with the assigner_id
            Project::whereIn('id', $request->project_ids)
                   ->update(['assigner_id' => $assignerUser->id]);

            // Get updated assigned projects
            $assignedProjects = Project::whereIn('id', $request->project_ids)->get();

            return response()->json([
                'success' => true,
                'message' => 'Projects assigned successfully',
                'data' => [
                    'assigned_projects_count' => count($request->project_ids),
                    'assigned_projects' => $assignedProjects
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to assign projects',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * ---------------------
     * Get User's Assigned Projects
     * ---------------------
     */
    public function getUserAssignedProjects($userId)
    {
        try {
            $user = Auth::user();
            if (!$user || $user->role != 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. Admin privileges required.'
                ], 403);
            }

            $assignerUser = User::find($userId);
            
            if (!$assignerUser) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            $assignedProjects = Project::where('assigner_id', $userId)->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'user' => $assignerUser,
                    'assigned_projects' => $assignedProjects
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch assigned projects',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * ---------------------
     * Remove Project Assignment
     * ---------------------
     */
    public function removeProjectAssignment(Request $request, $userId, $projectId)
    {
        try {
            $user = Auth::user();
            if (!$user || $user->role != 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. Admin privileges required.'
                ], 403);
            }

            $project = Project::where('id', $projectId)
                            ->where('assigner_id', $userId)
                            ->first();

            if (!$project) {
                return response()->json([
                    'success' => false,
                    'message' => 'Project assignment not found'
                ], 404);
            }

            $project->update(['assigner_id' => null]);

            return response()->json([
                'success' => true,
                'message' => 'Project assignment removed successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to remove project assignment',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}