<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\AssignerController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\ResolverController;

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

    // Assigner routes
   // Assigner routes
Route::get('/assigner/projects', [AssignerController::class, 'getAssignedProjects']);
Route::get('/assigner/requests', [AssignerController::class, 'getProjectRequests']);
Route::get('/assigner/requests/status/{status}', [AssignerController::class, 'getRequestsByStatus']);
Route::get('/assigner/requests/{id}', [AssignerController::class, 'getRequestDetails']);
Route::post('/assigner/assign', [AssignerController::class, 'assignToDeveloper']);
Route::put('/assigner/requests/{id}/pricing', [AssignerController::class, 'updatePricingAndAttachment']);
Route::get('/developers', [AssignerController::class, 'getDevelopers']);
    // Resolver routes - NEW ADDITION
    Route::prefix('resolver')->group(function () {
        Route::get('/dashboard', [ResolverController::class, 'dashboard']);
        Route::get('/requests', [ResolverController::class, 'getAssignedRequestsList']);
        Route::get('/requests/{requestId}', [ResolverController::class, 'getRequestDetails']);
        Route::put('/requests/{requestId}/status', [ResolverController::class, 'updateRequestStatus']);
        Route::get('/statistics', [ResolverController::class, 'getStatistics']);
    });

    // Admin routes (your existing routes)
    Route::prefix('admin')->group(function () {
        Route::get('/dashboard', [AdminController::class, 'dashboard']);
        Route::get('/users', [AdminController::class, 'getUsers']);
        Route::get('/users/{id}', [AdminController::class, 'getUser']);
        Route::post('/users', [AdminController::class, 'createUser']);
        Route::put('/users/{id}', [AdminController::class, 'updateUser']);
        Route::delete('/users/{id}', [AdminController::class, 'deleteUser']);
        Route::get('/roles', [AdminController::class, 'getRoles']);
        Route::post('/roles', [AdminController::class, 'createRole']);
        Route::put('/roles/{id}', [AdminController::class, 'updateRole']);
        Route::delete('/roles/{id}', [AdminController::class, 'deleteRole']);
        Route::get('/assignable-users', [AdminController::class, 'getAssignableUsers']);
        Route::get('/projects', [AdminController::class, 'getProjectsForAssignment']);
        Route::post('/assign-projects', [AdminController::class, 'assignProjectsToUser']);
        Route::get('/users/{userId}/assigned-projects', [AdminController::class, 'getUserAssignedProjects']);
        Route::delete('/users/{userId}/projects/{projectId}', [AdminController::class, 'removeProjectAssignment']);
    });
});