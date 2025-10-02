<?php

namespace App\Models;

use Laravel\Sanctum\HasApiTokens;
use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable
{
    use HasApiTokens;

    protected $fillable = [
        'name', 'cnic', 'email', 'phone', 'role', 'password', 'dob', 'appdata'
    ];

    protected $hidden = [
        'password', 'remember_token',
    ];
}
