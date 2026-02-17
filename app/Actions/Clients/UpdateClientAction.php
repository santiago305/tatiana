<?php

namespace App\Actions\Clients;

use App\Models\Client;

class UpdateClientAction
{
    public function execute(Client $client, array $data): Client
    {
        $client->update($data);

        return $client->refresh();
    }
}
