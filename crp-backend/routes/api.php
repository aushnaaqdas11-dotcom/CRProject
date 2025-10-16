    <?php

    use Illuminate\Support\Facades\Route;
    use App\Http\Controllers\Api\AuthController;
    use App\Http\Controllers\Api\UserController;
    use App\Http\Controllers\Api\AssignerController;


    Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    
    Route::get('/user/dashboard', [UserController::class, 'dashboard']);
    Route::get('/user/history', [UserController::class, 'getHistory']);
    Route::post('/change-request', [UserController::class, 'submitChangeRequest']);
    Route::get('/projects/{type}', [UserController::class, 'getProjects']);
    Route::get('/services', [UserController::class, 'getServices']);
    Route::get('/subqueries/{queryId}', [UserController::class, 'getSubQueries']); // Add this line
    Route::get('/user/requests/recent', [UserController::class, 'getRecentRequests'])->middleware('user');

    Route::get('/assigner/projects', [AssignerController::class, 'getAssignedProjects']);
    Route::get('/assigner/requests', [AssignerController::class, 'getProjectRequests']);
    Route::post('/assigner/assign', [AssignerController::class, 'assignToDeveloper']);
    Route::get('/developers', [AssignerController::class, 'getDevelopers']);
});

Route::get('/', function () {
    return response()->json(['message' => 'CRP API is working']);
});