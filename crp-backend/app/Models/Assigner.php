<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Assigner extends Model
{
    protected $table = 'assigners'; // your table name
    protected $fillable = [
        'request_id',
        'assigner_id',
        'developer_id',
        'assigner_comment',
    ];

    public function request()
    {
        return $this->belongsTo(UserRequest::class, 'request_id');
    }

    public function developer()
    {
        return $this->belongsTo(Developer::class, 'developer_id');
    }

    public function assignerUser()
    {
        return $this->belongsTo(\App\Models\User::class, 'assigner_id');
    }
}
