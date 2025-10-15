<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('assigners', function (Blueprint $table) {
            $table->id();

            // Make sure these match the types in their respective tables
            $table->unsignedBigInteger('request_id');
            $table->unsignedBigInteger('assigner_id');
            $table->unsignedBigInteger('developer_id');
            $table->text('assigner_comment')->nullable();
            $table->timestamps();

            // ✅ Foreign key references (ensure table names and types match exactly)
            $table->foreign('request_id')
                ->references('id')
                ->on('user_requests')
                ->onDelete('cascade');

            $table->foreign('assigner_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');

            $table->foreign('developer_id')
                ->references('id')
                ->on('developers')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assigners');
    }
};
