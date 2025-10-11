<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    protected $fillable = ['name', 'type','assigner_id'];

    public function requests()
    {
        return $this->hasMany(UserRequest::class);
    }

    // Scope for Web
    public function scopeWeb($query)
    {
        return $query->where('type', 'web');
    }

    // Scope for App
    public function scopeApp($query)
    {
        return $query->where('type', 'app');
    }
}

