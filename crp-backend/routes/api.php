<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\AssignerController;
use App\Http\Controllers\Api\AdminController;

Route::post('/login', [AuthController::class, 'login']);

// Public routes
Route::get('/', function () {
    return response()->json(['message' => 'CRP API is working']);
});

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    
    // User routes
    Route::get('/user/dashboard', [UserController::class, 'dashboard']);
    Route::get('/user/history', [UserController::class, 'getHistory']);
    Route::post('/change-request', [UserController::class, 'submitChangeRequest']);
    Route::get('/projects/{type}', [UserController::class, 'getProjects']);
    Route::get('/services', [UserController::class, 'getServices']);
    Route::get('/user/requests/recent', [UserController::class, 'getRecentRequests']);
    Route::get('/sub-queries/{queryId}', [UserController::class, 'getSubQueries']);

    // Assigner routes (your existing routes)
    Route::get('/assigner/projects', [AssignerController::class, 'getAssignedProjects']);
    Route::get('/assigner/requests', [AssignerController::class, 'getProjectRequests']);
    Route::post('/assigner/assign', [AssignerController::class, 'assignToDeveloper']);
    Route::get('/developers', [AssignerController::class, 'getDevelopers']);

    // Admin routes
    Route::prefix('admin')->group(function () {
        // Dashboard
        Route::get('/dashboard', [AdminController::class, 'dashboard']);
        
        // Users Management
        Route::get('/users', [AdminController::class, 'getUsers']);
        Route::get('/users/{id}', [AdminController::class, 'getUser']);
        Route::post('/users', [AdminController::class, 'createUser']);
        Route::put('/users/{id}', [AdminController::class, 'updateUser']);
        Route::delete('/users/{id}', [AdminController::class, 'deleteUser']);
        
        // Roles Management
        Route::get('/roles', [AdminController::class, 'getRoles']);
        Route::post('/roles', [AdminController::class, 'createRole']);
        Route::put('/roles/{id}', [AdminController::class, 'updateRole']);
        Route::delete('/roles/{id}', [AdminController::class, 'deleteRole']);
        
        // Projects Assignment
        Route::get('/assignable-users', [AdminController::class, 'getAssignableUsers']);
        Route::get('/projects', [AdminController::class, 'getProjectsForAssignment']);
        Route::post('/assign-projects', [AdminController::class, 'assignProjectsToUser']);
        Route::get('/users/{userId}/assigned-projects', [AdminController::class, 'getUserAssignedProjects']);
        Route::delete('/users/{userId}/projects/{projectId}', [AdminController::class, 'removeProjectAssignment']);
    });
});