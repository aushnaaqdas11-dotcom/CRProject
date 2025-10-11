<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    
    Route::get('/user/dashboard', [UserController::class, 'dashboard']);
    Route::get('/user/history', [UserController::class, 'getHistory']);
    Route::post('/change-request', [UserController::class, 'submitChangeRequest']);
    Route::get('/projects/{type}', [UserController::class, 'getProjects']);
    Route::get('/services', [UserController::class, 'getServices']);
    Route::get('/user/requests/recent', [UserController::class, 'getRecentRequests'])->middleware('user');
});

Route::get('/', function () {
    return response()->json(['message' => 'CRP API is working']);
});
