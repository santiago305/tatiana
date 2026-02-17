<?php

namespace App\Http\Controllers;

use App\Actions\Dashboard\GetDashboardDataAction;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request, GetDashboardDataAction $action): Response
    {
        $period = $request->string('period')->toString() ?: 'monthly';
        $data = $action->execute($request->user(), $period);

        return Inertia::render('dashboard', [
            'backendData' => $data,
        ]);
    }
}
