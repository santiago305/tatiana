<?php

namespace App\Actions\Dashboard;

use App\Models\User;
use Carbon\CarbonImmutable;

class GetDashboardDataAction
{
    public function execute(User $user, string $period = 'monthly'): array
    {
        $clients = $user->clients()
            ->latest('id')
            ->get();
        $payments = $user->payments()->latest('payment_date')->get();
        $notes = $user->notes()->latest('note_date')->get();

        $today = CarbonImmutable::today();

        $statusMap = $clients->map(function ($client) use ($today) {
            $daysUntilDue = $today->diffInDays($client->next_payment_date, false);
            $status = $daysUntilDue < 0 ? 'expired' : ($daysUntilDue <= 4 ? 'near_expiry' : 'active');

            return [
                'id' => $client->id,
                'status' => $status,
                'days_until_due' => $daysUntilDue,
            ];
        })->keyBy('id');

        $total = $clients->count();
        $active = $statusMap->where('status', 'active')->count();
        $nearExpiry = $statusMap->where('status', 'near_expiry')->count();
        $expired = $statusMap->where('status', 'expired')->count();

        $start = match ($period) {
            'weekly' => $today->startOfWeek(),
            'annual' => $today->startOfYear(),
            default => $today->startOfMonth(),
        };

        $periodPayments = $payments->filter(fn ($payment) => $payment->payment_date->greaterThan($start));
        $incomeTotal = $periodPayments->sum('amount');

        $chart = $periodPayments
            ->groupBy(fn ($payment) => $payment->payment_date->format('d/m'))
            ->map(fn ($group, $date) => ['date' => $date, 'amount' => $group->sum('amount')])
            ->values();

        $alerts = $clients->map(function ($client) use ($statusMap) {
            $status = $statusMap->get($client->id);

            return [
                'id' => $client->id,
                'name' => $client->name,
                'phone' => $client->phone,
                'plan' => $client->plan,
                'speed' => $client->speed,
                'monthly_amount' => (float) $client->monthly_amount,
                'next_payment_date' => $client->next_payment_date->toDateString(),
                'status' => $status['status'],
                'days_until_due' => $status['days_until_due'],
            ];
        })
            ->where('status', '!=', 'active')
            ->sortBy('days_until_due')
            ->values();

        return [
            'stats' => [
                'total' => $total,
                'active' => $active,
                'near_expiry' => $nearExpiry,
                'expired' => $expired,
            ],
            'income' => [
                'period' => $period,
                'total' => (float) $incomeTotal,
                'chart' => $chart,
            ],
            'alerts' => $alerts,
            'clients_recent' => $clients->take(5)->map(function ($client) use ($statusMap) {
                $status = $statusMap->get($client->id);

                return [
                    'id' => $client->id,
                    'name' => $client->name,
                    'phone' => $client->phone,
                    'plan' => $client->plan,
                    'monthly_amount' => (float) $client->monthly_amount,
                    'status' => $status['status'],
                ];
            })->values(),
            'notes' => $notes->map(fn ($note) => [
                'id' => $note->id,
                'content' => $note->content,
                'date' => $note->note_date->format('Y-m-d H:i'),
            ])->values(),
        ];
    }
}
