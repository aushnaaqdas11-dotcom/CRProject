<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserRequest extends Model
{
    protected $table = 'requests';

      protected $fillable = [
        'user_id',
        'assigned_to',
        'assigner_comment',
        'query_id',
        'project_id',
        'priority',
        'request_details',
        'status',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

   public function project()
{
    return $this->belongsTo(Project::class, 'project_id');
}

    public function service()
    {
        return $this->belongsTo(Query::class, 'query_id');
    }
}