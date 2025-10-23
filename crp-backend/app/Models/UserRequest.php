<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserRequest extends Model
{
    use HasFactory;

    protected $table = 'requests';

    protected $fillable = [
        'user_id',
        'query_id',
        'project_id',
        'priority',
        'request_details',
        'status',
        'sub_query',
        'source',
        'assigned_to',
        'assigner_comment',
    ];

    // Relations
    public function service()
    {
        return $this->belongsTo(Query::class, 'query_id');
    }

    public function project()
    {
        return $this->belongsTo(Project::class, 'project_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function assigner()
    {
        return $this->hasOne(Assigner::class, 'request_id');
    }

    // Fix the resolver relationship
    public function resolver()
    {
        return $this->hasOne(\App\Models\Resolver::class, 'request_id');
    }

    public function assignedDeveloper()
    {
        return $this->assigner ? $this->assigner->developer : null;
    }

    public function getAssignerCommentAttribute()
    {
        return $this->assigner ? $this->assigner->assigner_comment : null;
    }
}