<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\App;
use Illuminate\Http\Request;

class AppController extends Controller
{
    public function index()
    {
        try {
            $apps = App::all();
            return response()->json([
                'success' => true,
                'apps' => $apps
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch apps',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}