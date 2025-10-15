<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Developer extends Model
{
    protected $table = 'developers';
    protected $fillable = ['name']; // only fields that exist in your DB

    // Relationship with UserRequest (assigned requests)
    // requests assigned to this developer via requests.assigned_to
    public function requests()
    {
        return $this->hasMany(UserRequest::class, 'assigned_to', 'id');
    }

    // Relationship with Assigner assignments (if you have assigners table)
    public function assignments()
    {
        return $this->hasMany(Assigner::class, 'developer_id', 'id');
    }
}
