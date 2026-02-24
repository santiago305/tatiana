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
            ['email' => 'administracion@gesemperu.com'],
            [
                'name' => 'Tatiana',
                'password' => Hash::make('12345678'),
            ]
        );

        // $this->call(MassiveClientsSeeder::class);
        // $this->call(MassivePaymentsSeeder::class);
    }
}
