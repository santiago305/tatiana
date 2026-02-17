<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::query()->updateOrCreate(
            ['email' => 'minecratf633@gmail.com'],
            [
                'name' => 'santiago',
                'password' => Hash::make('123123123'),
            ]
        );

        $this->call(MassiveClientsSeeder::class);
        $this->call(MassivePaymentsSeeder::class);
    }
}
