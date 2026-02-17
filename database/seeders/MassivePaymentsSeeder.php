<?php

namespace Database\Seeders;

use App\Models\Client;
use App\Models\Payment;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;

class MassivePaymentsSeeder extends Seeder
{
    /**
     * Seed a coherent volume of payments linked to the seeded clients.
     */
    public function run(): void
    {
        $count = max(1000, (int) env('MASSIVE_PAYMENTS_COUNT', 10000));
        $user = User::query()->where('email', 'minecratf633@gmail.com')->first();

        if (! $user) {
            return;
        }

        $clients = Client::query()
            ->where('user_id', $user->id)
            ->get(['id', 'name', 'monthly_amount', 'install_date']);

        if ($clients->isEmpty()) {
            return;
        }

        Payment::query()->where('user_id', $user->id)->delete();

        $rows = [];
        $now = CarbonImmutable::now();

        for ($i = 0; $i < $count; $i += 1) {
            $client = $clients->random();
            $installDate = CarbonImmutable::parse($client->install_date);
            $baseDate = $now->subDays(random_int(0, 540));
            $paymentDate = $baseDate->lessThan($installDate) ? $installDate : $baseDate;

            $baseAmount = (float) $client->monthly_amount;
            $variation = random_int(-500, 500) / 100;
            $amount = max(1, round($baseAmount + $variation, 2));

            $rows[] = [
                'user_id' => $user->id,
                'client_id' => $client->id,
                'amount' => $amount,
                'payment_date' => $paymentDate->toDateString(),
                'period_label' => $paymentDate->locale('es')->translatedFormat('F Y'),
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        foreach (array_chunk($rows, 500) as $chunk) {
            Payment::query()->insert($chunk);
        }
    }
}
