<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\ResolverController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AssignerController;

/*
| Public
*/
Route::post('/login', [AuthController::class, 'login']);

/*
| Protected - requires token
*/
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    // User area (updated to point to new controller methods)
    Route::get('/user/dashboard', [UserController::class, 'dashboard'])->middleware('user'); // Fetches services, projects, recent
    Route::post('/change-request', [UserController::class, 'storeRequest'])->middleware('user'); // Submit request
    Route::get('/user/history', [UserController::class, 'getRequestHistory'])->middleware('user'); // Full history

    // Additional user-specific routes if needed (e.g., for separate fetches)
    Route::get('/services', [UserController::class, 'getServices'])->middleware('user');
    Route::get('/projects/web', [UserController::class, 'getWebProjects'])->middleware('user');
    Route::get('/projects/app', [UserController::class, 'getAppProjects'])->middleware('user');
    Route::get('/user/requests/recent', [UserController::class, 'getRecentRequests'])->middleware('user');

    // Resolver area (unchanged)
    Route::get('/resolver/dashboard', [ResolverController::class, 'dashboard'])->middleware('resolver');
    Route::get('/resolver/request/{id}', [ResolverController::class, 'show'])->middleware('resolver');
    Route::put('/resolver/request/{id}', [ResolverController::class, 'updateStatus'])->middleware('resolver');

    // Admin/Assigner routes (unchanged)
    Route::get('/admin/dashboard', [AdminController::class, 'dashboard'])->middleware('admin');
    Route::get('/assigner/dashboard', [AssignerController::class, 'dashboard'])->middleware('assigner');
});