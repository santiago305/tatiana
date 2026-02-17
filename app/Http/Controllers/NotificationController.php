<?php

namespace App\Http\Controllers;

use App\Actions\Notifications\BuildNotificationMessageAction;
use App\Models\Client;
use App\Models\NotificationLog;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function page(): Response
    {
        return Inertia::render('Notifications');
    }

    public function alerts(Request $request): JsonResponse
    {
        $today = CarbonImmutable::today();
        $threshold = $today->addDays(4);
        $perPage = (int) $request->integer('per_page', 15);
        $perPage = max(1, min(50, $perPage));

        $query = Client::query()
            ->where('user_id', $request->user()->id)
            ->whereDate('next_payment_date', '<=', $threshold->toDateString())
            ->orderBy('next_payment_date');

        $paginator = $query->paginate($perPage)->withQueryString();

        $alerts = collect($paginator->items())->map(function (Client $client) use ($today): array {
                $days = $today->diffInDays($client->next_payment_date, false);
                $status = $days < 0 ? 'expired' : 'near_expiry';

                return [
                    'id' => (string) $client->id,
                    'name' => $client->name,
                    'phone' => $client->phone,
                    'plan' => $client->plan,
                    'speed' => $client->speed,
                    'monthlyAmount' => (float) $client->monthly_amount,
                    'nextPaymentDate' => $client->next_payment_date->toDateString(),
                    'status' => $status,
                    'daysUntilDue' => $days,
                ];
            })
            ->values();

        return response()->json([
            'data' => $alerts,
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function send(Request $request, BuildNotificationMessageAction $builder): JsonResponse
    {
        $validated = $request->validate([
            'client_id' => ['required', 'integer'],
            'channel' => ['required', 'in:whatsapp,sms'],
            'status' => ['nullable', 'in:active,near_expiry,expired'],
            'message' => ['nullable', 'string'],
        ]);

        $client = Client::query()
            ->whereKey($validated['client_id'])
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $message = $validated['message']
            ?? ($validated['channel'] === 'sms'
                ? $builder->forSms($client)
                : $builder->forWhatsApp($client, $validated['status'] ?? 'near_expiry'));

        $log = NotificationLog::query()->create([
            'user_id' => $request->user()->id,
            'client_id' => $client->id,
            'channel' => $validated['channel'],
            'message' => $message,
            'status' => 'sent',
            'sent_at' => CarbonImmutable::now(),
        ]);

        return response()->json([
            'data' => [
                'id' => (string) $log->id,
                'channel' => $log->channel,
                'message' => $log->message,
                'status' => $log->status,
                'sentAt' => $log->sent_at->toISOString(),
            ],
        ], 201);
    }
}
