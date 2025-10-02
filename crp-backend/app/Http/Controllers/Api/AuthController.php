<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    public function login(Request $request)
    {
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

        $input = $request->all();
        $fieldType = filter_var($input['login'], FILTER_VALIDATE_EMAIL) ? 'email' : 'cnic';

        if (Auth::attempt([$fieldType => $input['login'], 'password' => $input['password']])) {
            $user = Auth::user();

            // Generate Sanctum token
            $token = $user->createToken('CRPApp')->plainTextToken;

            // Dashboard selection with switch
            switch ($user->role) {
                case 1:
                    $dashboard = 'admin';
                    break;
                case 2:
                    $dashboard = 'user';
                    break;
                case 3:
                    $dashboard = 'resolver';
                    break;
                case 4:
                    $dashboard = 'assigner';
                    break;
                default:
                    $dashboard = 'home';
            }

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
                'redirect_to' => $dashboard
            ], 200);
        }

        return response()->json([
            'success' => false,
            'message' => 'Invalid credentials'
        ], 401);
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
