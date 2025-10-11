<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use App\Models\User;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        // 1️⃣ Validate input
        $validator = Validator::make($request->all(), [
            'login'    => 'required|string',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors'  => $validator->errors()
            ], 422);
        }

        $login    = $request->input('login');
        $password = $request->input('password');

        // 2️⃣ Determine if login is email or CNIC
        $fieldType = filter_var($login, FILTER_VALIDATE_EMAIL) ? 'email' : 'cnic';

        // 3️⃣ Attempt to find the user
        $user = User::where($fieldType, $login)->first();

        if (!$user || !Hash::check($password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials',
            ], 401);
        }

        // 4️⃣ Create Sanctum token
        $token = $user->createToken('CRPApp')->plainTextToken;

        // 5️⃣ Map roles to dashboard
        $dashboardMap = [
            1 => 'admin',
            2 => 'user',
            3 => 'resolver',
            4 => 'assigner',
        ];

        return response()->json([
            'success'     => true,
            'token'       => $token,
            'user'        => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'cnic'  => $user->cnic,
                'phone' => $user->phone,
                'role'  => $user->role,
            ],
            'redirect_to' => $dashboardMap[$user->role] ?? 'home',
        ], 200);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully'
        ]);
    }
}
