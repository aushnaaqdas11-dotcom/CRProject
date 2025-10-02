<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'type', 'assigner_id', 'user_id']; // add user_id for filtering projects to user

    public function requests()
    {
        return $this->hasMany(UserRequest::class);
    }
}
