<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'cnic',
        'phone',
        'role',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the role data
     */
    public function roleData()
    {
        return $this->belongsTo(Role::class, 'role');
    }

    /**
     * Check if user is admin
     */
    public function isAdmin()
    {
        return $this->role === 1; // Assuming 1 is admin role ID
    }

    /**
     * Check if user is assigner
     */
    public function isAssigner()
    {
        return $this->role === 4; // Assuming 4 is assigner role ID
    }

    /**
     * Get assigned projects
     */
    public function assignedProjects()
    {
        return $this->hasMany(Project::class, 'assigner_id');
    }
}