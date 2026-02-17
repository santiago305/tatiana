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
