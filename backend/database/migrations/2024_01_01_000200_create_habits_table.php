<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('habits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('icon')->nullable();
            $table->string('color')->nullable();
            // day | 40_days | custom
            $table->string('frequency')->default('40_days');
            $table->date('start_date');
            $table->date('custom_date')->nullable();
            // For "Specific Days of Week": ["Mon","Tue",...]
            $table->json('days_of_week')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('habits');
    }
};
