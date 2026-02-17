<?php

namespace App\Actions\Clients;

use App\Models\Client;

class ToggleClientServiceAction
{
    public function execute(Client $client): Client
    {
        $client->update([
            'is_service_active' => ! $client->is_service_active,
        ]);

        return $client->refresh();
    }
}
