<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('habit_completions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('habit_id')->constrained()->cascadeOnDelete();
            $table->date('completion_date');
            $table->boolean('is_completed')->default(true);
            $table->timestamps();

            $table->unique(['habit_id', 'completion_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('habit_completions');
    }
};
