<?php

namespace App\Http\Controllers;

use App\Actions\Payments\RegisterPaymentAction;
use App\Http\Requests\StorePaymentRequest;
use App\Models\Client;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
    public function page(): Response
    {
        return Inertia::render('Payments');
    }

    public function index(Request $request): JsonResponse
    {
        $payments = $request->user()
            ->payments()
            ->with('client:id,name')
            ->latest('payment_date')
            ->latest('id')
            ->get()
            ->map(fn (Payment $payment): array => [
                'id' => (string) $payment->id,
                'clientId' => (string) $payment->client_id,
                'clientName' => $payment->client?->name ?? '',
                'amount' => (float) $payment->amount,
                'date' => $payment->payment_date->toDateString(),
                'period' => $payment->period_label ?? '',
            ]);

        return response()->json(['data' => $payments]);
    }

    public function store(StorePaymentRequest $request, RegisterPaymentAction $action): JsonResponse
    {
        $client = Client::query()
            ->whereKey($request->integer('client_id'))
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $payment = $action->execute($request->user(), $client, $request->validated());

        return response()->json([
            'data' => [
                'id' => (string) $payment->id,
                'clientId' => (string) $payment->client_id,
                'clientName' => $client->name,
                'amount' => (float) $payment->amount,
                'date' => $payment->payment_date->toDateString(),
                'period' => $payment->period_label ?? '',
            ],
        ], 201);
    }
}
