<?php

namespace App\Http\Controllers;

use App\Actions\Clients\CreateClientAction;
use App\Actions\Clients\DeleteClientAction;
use App\Actions\Clients\ToggleClientServiceAction;
use App\Actions\Clients\UpdateClientAction;
use App\Http\Requests\StoreClientRequest;
use App\Http\Requests\UpdateClientRequest;
use App\Models\Client;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ClientController extends Controller
{
    public function page(): Response
    {
        return Inertia::render('clients');
    }

    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->integer('per_page', 15);
        $perPage = max(1, min(50, $perPage));
        $search = trim((string) $request->string('search'));

        $query = $request->user()
            ->clients()
            ->latest('id');

        if ($search !== '') {
            $query->where(function ($subQuery) use ($search): void {
                $subQuery->where('name', 'like', "%{$search}%")
                    ->orWhere('dni', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $paginator = $query->paginate($perPage)->withQueryString();

        $clients = collect($paginator->items())->map(function (Client $client): array {
            $statusData = $this->statusForClient($client);

            return $this->serializeClient($client, $statusData['status'], $statusData['days_until_due']);
        });

        return response()->json([
            'data' => $clients,
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function show(Request $request, Client $client): JsonResponse
    {
        abort_if($client->user_id !== $request->user()->id, 403);

        $statusData = $this->statusForClient($client);

        return response()->json([
            'data' => $this->serializeClient($client, $statusData['status'], $statusData['days_until_due']),
        ]);
    }

    public function store(StoreClientRequest $request, CreateClientAction $action): JsonResponse
    {
        $client = $action->execute($request->user(), $request->validated());
        $statusData = $this->statusForClient($client);

        return response()->json([
            'data' => $this->serializeClient($client, $statusData['status'], $statusData['days_until_due']),
        ], 201);
    }

    public function update(UpdateClientRequest $request, Client $client, UpdateClientAction $action): JsonResponse
    {
        abort_if($client->user_id !== $request->user()->id, 403);

        $client = $action->execute($client, $request->validated());
        $statusData = $this->statusForClient($client);

        return response()->json([
            'data' => $this->serializeClient($client, $statusData['status'], $statusData['days_until_due']),
        ]);
    }

    public function destroy(Request $request, Client $client, DeleteClientAction $action): JsonResponse
    {
        abort_if($client->user_id !== $request->user()->id, 403);

        $action->execute($client);

        return response()->json([
            'message' => 'Cliente eliminado correctamente.',
        ]);
    }

    public function toggleService(Request $request, Client $client, ToggleClientServiceAction $action): JsonResponse
    {
        abort_if($client->user_id !== $request->user()->id, 403);

        $client = $action->execute($client);
        $statusData = $this->statusForClient($client);

        return response()->json([
            'data' => $this->serializeClient($client, $statusData['status'], $statusData['days_until_due']),
        ]);
    }

    private function statusForClient(Client $client): array
    {
        $days = CarbonImmutable::today()->diffInDays($client->next_payment_date, false);
        $status = $days < 0 ? 'expired' : ($days <= 4 ? 'near_expiry' : 'active');

        return [
            'status' => $status,
            'days_until_due' => $days,
        ];
    }

    private function serializeClient(Client $client, string $status, int $daysUntilDue): array
    {
        return [
            'id' => (string) $client->id,
            'name' => $client->name,
            'dni' => $client->dni,
            'phone' => $client->phone,
            'ip' => $client->ip,
            'installDate' => $client->install_date->toDateString(),
            'installer' => $client->installer,
            'networkName' => $client->network_name,
            'networkPassword' => $client->network_password,
            'plan' => $client->plan,
            'department' => $client->department ?? '',
            'province' => $client->province ?? '',
            'district' => $client->district ?? '',
            'speed' => $client->speed,
            'upload' => $client->upload_speed ?? '',
            'download' => $client->download_speed ?? '',
            'charge' => $client->charge_speed ?? '',
            'discharge' => $client->discharge_speed ?? '',
            'monthlyAmount' => (float) $client->monthly_amount,
            'address' => $client->address ?? '',
            'coordinates' => $client->coordinates ?? '',
            'reference' => $client->reference ?? '',
            'nextPaymentDate' => $client->next_payment_date->toDateString(),
            'isServiceActive' => $client->is_service_active,
            'status' => $status,
            'daysUntilDue' => $daysUntilDue,
        ];
    }
}
