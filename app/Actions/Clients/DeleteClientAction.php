<?php

namespace App\Actions\Clients;

use App\Models\Client;

class DeleteClientAction
{
    public function execute(Client $client): void
    {
        $client->delete();
    }
}
