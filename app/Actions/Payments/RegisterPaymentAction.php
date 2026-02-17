<?php

namespace App\Actions\Payments;

use App\Models\Client;
use App\Models\Payment;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

class RegisterPaymentAction
{
    public function execute(User $user, Client $client, array $data): Payment
    {
        return DB::transaction(function () use ($user, $client, $data): Payment {
            $paymentDate = isset($data['payment_date'])
                ? CarbonImmutable::parse($data['payment_date'])
                : CarbonImmutable::today();

            $payment = $user->payments()->create([
                'client_id' => $client->id,
                'amount' => $data['amount'],
                'payment_date' => $paymentDate,
                'period_label' => $data['period_label'] ?? $paymentDate->locale('es')->translatedFormat('F Y'),
            ]);

            $nextPaymentDate = CarbonImmutable::parse($client->next_payment_date)->addMonth();
            $client->update(['next_payment_date' => $nextPaymentDate->toDateString()]);

            return $payment;
        });
    }
}
