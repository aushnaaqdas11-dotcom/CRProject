<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Developer extends Model
{
    protected $fillable = ['name'];

    // Relationship with UserRequest
    public function requests()
    {
        return $this->hasMany(UserRequest::class, 'developer');
    }
}

