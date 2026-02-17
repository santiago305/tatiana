<?php

namespace App\Actions\Clients;

use App\Models\Client;
use App\Models\User;

class CreateClientAction
{
    public function execute(User $user, array $data): Client
    {
        return $user->clients()->create($data);
    }
}
