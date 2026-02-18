<?php

namespace App\Actions\Dashboard;

use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

class GetDashboardDataAction
{
    public function execute(User $user, string $period = 'monthly'): array
    {
        $today = CarbonImmutable::today();
        $nearExpiryLimit = $today->addDays(4);

        $clientsBaseQuery = $user->clients();
        $total = (clone $clientsBaseQuery)->count();
        $active = (clone $clientsBaseQuery)->whereDate('next_payment_date', '>', $nearExpiryLimit->toDateString())->count();
        $nearExpiry = (clone $clientsBaseQuery)
            ->whereDate('next_payment_date', '>=', $today->toDateString())
            ->whereDate('next_payment_date', '<=', $nearExpiryLimit->toDateString())
            ->count();
        $expired = (clone $clientsBaseQuery)->whereDate('next_payment_date', '<', $today->toDateString())->count();

        $clients = $user->clients()
            ->latest('id')
            ->get();
        $payments = $user->payments()->latest('payment_date')->get();
        $notes = $user->notes()->latest('note_date')->get();

        $statusMap = $clients->map(function ($client) use ($today) {
            $daysUntilDue = $today->diffInDays($client->next_payment_date, false);
            $status = $daysUntilDue < 0 ? 'expired' : ($daysUntilDue <= 4 ? 'near_expiry' : 'active');

            return [
                'id' => $client->id,
                'status' => $status,
                'days_until_due' => $daysUntilDue,
            ];
        })->keyBy('id');

        $income = $this->buildIncomeData($user, $period, $today);

        $alertsCollection = $clients->map(function ($client) use ($statusMap) {
            $status = $statusMap->get($client->id);

            return [
                'id' => (string) $client->id,
                'name' => $client->name,
                'phone' => $client->phone,
                'plan' => $client->plan,
                'speed' => $client->speed,
                'monthlyAmount' => (float) $client->monthly_amount,
                'nextPaymentDate' => $client->next_payment_date->toDateString(),
                'status' => $status['status'],
                'daysUntilDue' => $status['days_until_due'],
            ];
        })
            ->where('status', '!=', 'active')
            ->sortBy('daysUntilDue')
            ->values();
        $alertsTotal = $alertsCollection->count();
        $alerts = $alertsCollection->take(20)->values();

        return [
            'stats' => [
                'total' => $total,
                'active' => $active,
                'near_expiry' => $nearExpiry,
                'expired' => $expired,
            ],
            'income' => [
                'period' => $income['period'],
                'total' => $income['total'],
                'chart' => $income['chart'],
            ],
            'alerts_total' => $alertsTotal,
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

    private function buildIncomeData(User $user, string $period, CarbonImmutable $today): array
    {
        return match ($period) {
            'weekly' => $this->buildDailyIncomeData($user, $today->subDays(6), $today, 'weekly'),
            'annual' => $this->buildMonthlyIncomeData($user, $today, 'annual'),
            default => $this->buildDailyIncomeData($user, $today->subDays(29), $today, 'monthly'),
        };
    }

    private function buildDailyIncomeData(User $user, CarbonImmutable $from, CarbonImmutable $to, string $period): array
    {
        $raw = $user->payments()
            ->whereBetween('payment_date', [$from->toDateString(), $to->toDateString()])
            ->get(['amount', 'payment_date'])
            ->groupBy(fn ($payment) => $payment->payment_date->format('Y-m-d'))
            ->map(fn (Collection $group): float => (float) $group->sum('amount'));

        $chart = [];
        $cursor = $from;
        $total = 0.0;

        while ($cursor->lessThanOrEqualTo($to)) {
            $key = $cursor->toDateString();
            $amount = (float) ($raw[$key] ?? 0);
            $total += $amount;

            $chart[] = [
                'date' => $cursor->format('d/m'),
                'amount' => $amount,
            ];

            $cursor = $cursor->addDay();
        }

        return [
            'period' => $period,
            'total' => round($total, 2),
            'chart' => $chart,
        ];
    }

    private function buildMonthlyIncomeData(User $user, CarbonImmutable $today, string $period): array
    {
        $startMonth = $today->startOfMonth()->subMonths(11);
        $endMonth = $today->endOfMonth();

        $raw = $user->payments()
            ->whereBetween('payment_date', [$startMonth->toDateString(), $endMonth->toDateString()])
            ->get(['amount', 'payment_date'])
            ->groupBy(fn ($payment) => $payment->payment_date->format('Y-m'))
            ->map(fn (Collection $group): float => (float) $group->sum('amount'));

        $chart = [];
        $cursor = $startMonth;
        $total = 0.0;

        for ($i = 0; $i < 12; $i += 1) {
            $key = $cursor->format('Y-m');
            $amount = (float) ($raw[$key] ?? 0);
            $total += $amount;

            $chart[] = [
                'date' => ucfirst($cursor->locale('es')->translatedFormat('M')),
                'amount' => $amount,
            ];

            $cursor = $cursor->addMonth();
        }

        return [
            'period' => $period,
            'total' => round($total, 2),
            'chart' => $chart,
        ];
    }
}
