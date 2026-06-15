<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('journals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title')->nullable();
            $table->longText('description')->nullable();
            $table->string('emoji')->nullable();   // mood emoji
            $table->text('tag')->nullable();        // comma-separated feeling tags
            $table->json('promt')->nullable();      // gratitude items (app spelling: "promt")
            $table->date('date');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('journals');
    }
};
