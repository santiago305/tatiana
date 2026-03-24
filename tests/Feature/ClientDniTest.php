<?php

use App\Models\Client;
use App\Models\User;

test('an authenticated user can register multiple clients with the same dni', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    Client::factory()->create([
        'user_id' => $user->id,
        'dni' => '12345678',
    ]);

    $payload = Client::factory()->make([
        'user_id' => $user->id,
        'dni' => '12345678',
    ])->toArray();

    unset($payload['user_id']);

    $response = $this->postJson(route('api.clients.store'), $payload);

    $response->assertCreated()
        ->assertJsonPath('data.dni', '12345678');

    expect(
        Client::query()
            ->where('user_id', $user->id)
            ->where('dni', '12345678')
            ->count()
    )->toBe(2);
});
