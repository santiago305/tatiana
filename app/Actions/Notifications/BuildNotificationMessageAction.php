<?php

namespace App\Actions\Notifications;

use App\Models\Client;

class BuildNotificationMessageAction
{
    public function forWhatsApp(Client $client, string $status): string
    {
        if ($status === 'expired') {
            return sprintf(
                'Hola %s, le informamos que su servicio de internet (%s) ha vencido. Su pago de S/ %.2f está pendiente. Por favor regularice su situación. - GESEM',
                $client->name,
                $client->plan,
                $client->monthly_amount
            );
        }

        return sprintf(
            'Hola %s, le recordamos que su servicio de internet (%s - %s) vence el %s. Monto: S/ %.2f. Gracias - GESEM',
            $client->name,
            $client->plan,
            $client->speed,
            $client->next_payment_date->format('d/m/Y'),
            $client->monthly_amount
        );
    }

    public function forSms(Client $client): string
    {
        return sprintf(
            'GESEM: Su servicio %s vence pronto. Monto: S/%.2f',
            $client->plan,
            $client->monthly_amount
        );
    }
}
