<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('requests', function (Blueprint $table) {
            $table->string('assigned_to')->nullable()->after('user_id'); // developer name
            $table->string('assigner_comment')->nullable()->after('assigned_to'); // assigner comment
        });
    }

    public function down(): void
    {
        Schema::table('requests', function (Blueprint $table) {
            $table->dropColumn('assigned_to');
            $table->dropColumn('assigner_comment');
        });
    }
};
