<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('salah_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->boolean('fajr_performed')->default(false);
            $table->boolean('dhuhr_performed')->default(false);
            $table->boolean('asr_performed')->default(false);
            $table->boolean('maghrib_performed')->default(false);
            $table->boolean('isha_performed')->default(false);
            $table->boolean('tahajud_performed')->default(false);
            $table->timestamps();

            $table->unique(['user_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('salah_records');
    }
};
