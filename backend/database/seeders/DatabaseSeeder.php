<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // A ready-to-use demo account so you can log in immediately after deploy.
        User::updateOrCreate(
            ['email' => 'demo@edeenapp.co.uk'],
            [
                'name' => 'Edeen Demo',
                'password' => 'Password@123',
                'email_verified_at' => now(),
            ]
        );
    }
}
