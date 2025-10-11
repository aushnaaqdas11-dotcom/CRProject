<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SubQuery extends Model
{
    use HasFactory;

    protected $table = 'sub_queries'; // table name

    protected $fillable = [
        'query_id',
        'name',
    ];

    /**
     * Each sub query belongs to one main query
     */
    public function queries()
    {
        return $this->belongsTo(Query::class, 'query_id');
    }
}
