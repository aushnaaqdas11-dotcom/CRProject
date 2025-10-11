<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Table ka naam 'user_requests' se badalkar 'requests' kar diya gaya hai
        Schema::table('requests', function (Blueprint $table) {
            // NAYA COLUMN: 'app_id' joda ja raha hai
            $table->foreignId('app_id')->nullable()->constrained()->after('project_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Table ka naam 'user_requests' se badalkar 'requests' kar diya gaya hai
        Schema::table('requests', function (Blueprint $table) {
            // Foreign key constraint ko hatata hai.
            $table->dropConstrainedForeignId('app_id');
            // 'app_id' column ko table se hata deta hai.
            $table->dropColumn('app_id');
        });
    }
};