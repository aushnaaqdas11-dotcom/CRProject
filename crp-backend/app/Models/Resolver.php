<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Resolver extends Model
{
    protected $table = 'resolvers';
    
    protected $fillable = [
        'request_id',
        'working_hours',
        'resolver_comment'
    ];

    public function request()
    {
        return $this->belongsTo(UserRequest::class, 'request_id');
    }
}