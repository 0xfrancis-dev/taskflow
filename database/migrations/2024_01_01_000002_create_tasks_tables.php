<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description');
            $table->string('platform')->index();
            $table->string('link', 500);
            $table->decimal('reward', 12, 2);
            $table->unsignedInteger('slots');
            $table->unsignedInteger('approved_count')->default(0);
            $table->decimal('fee', 12, 2)->default(0);
            $table->string('status')->default('active')->index(); // active | paused | completed | closed
            $table->timestamps();
        });

        Schema::create('submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('proof');
            $table->string('proof_image')->nullable();
            $table->string('status')->default('pending')->index(); // pending | approved | rejected
            $table->string('note')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
            $table->unique(['task_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('submissions');
        Schema::dropIfExists('tasks');
    }
};
