<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\ResolverController;
use App\Http\Controllers\Api\AssignerController;

// Public
Route::post('/login', [AuthController::class, 'login']);

// Protected (requires Sanctum token)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    

    Route::get('/user/dashboard', [UserController::class, 'dashboard'])->middleware('user');
    Route::get('/admin/dashboard', [AdminController::class, 'dashboard'])->middleware('admin');
    Route::get('/resolver/dashboard', [ResolverController::class, 'dashboard'])->middleware('resolver');
    Route::get('/assigner/dashboard', [AssignerController::class, 'dashboard'])->middleware('assigner');
});
Route::get('/', function () {
    return response()->json(['message' => 'CRP API is working']);
});
