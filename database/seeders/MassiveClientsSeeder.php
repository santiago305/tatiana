<?php

namespace Database\Seeders;

use App\Models\Client;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class MassiveClientsSeeder extends Seeder
{
    /**
     * Seed a large volume of clients for performance testing.
     */
    public function run(): void
    {
        $count = (int) env('MASSIVE_CLIENTS_COUNT', 1000);
        $mainEmail = 'minecratf633@gmail.com';

        $user = User::query()->firstOrCreate(
            ['email' => $mainEmail],
            [
                'name' => 'santiago',
                'password' => Hash::make('123123123'),
            ]
        );

        // Limpia clientes previos (incluyendo los de usuarios demo) para un seed consistente.
        Client::query()->delete();

        // Elimina usuarios demo antiguos si existen.
        User::query()
            ->where('email', '!=', $mainEmail)
            ->delete();

        Client::factory()
            ->count(max(500, $count))
            ->create([
                'user_id' => $user->id,
            ]);
    }
}
