<?php

use App\Http\Controllers\ClientController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\NoteController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PaymentController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return auth()->check()
        ? redirect()->route('dashboard')
        : redirect()->route('login');
})->name('home');

Route::middleware(['auth'])->group(function (): void {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    Route::get('clients', [ClientController::class, 'page'])->name('clients');
    Route::get('api/clients', [ClientController::class, 'index'])->name('api.clients.index');
    Route::get('api/clients/{client}', [ClientController::class, 'show'])->name('api.clients.show');
    Route::post('api/clients', [ClientController::class, 'store'])->name('api.clients.store');
    Route::put('api/clients/{client}', [ClientController::class, 'update'])->name('api.clients.update');
    Route::delete('api/clients/{client}', [ClientController::class, 'destroy'])->name('api.clients.destroy');
    Route::patch('api/clients/{client}/toggle-service', [ClientController::class, 'toggleService'])->name('api.clients.toggle-service');

    Route::get('pagos', [PaymentController::class, 'page'])->name('pagos');
    Route::get('api/payments', [PaymentController::class, 'index'])->name('api.payments.index');
    Route::post('api/payments', [PaymentController::class, 'store'])->name('api.payments.store');

    Route::get('api/notes', [NoteController::class, 'index'])->name('api.notes.index');
    Route::post('api/notes', [NoteController::class, 'store'])->name('api.notes.store');
    Route::delete('api/notes/{note}', [NoteController::class, 'destroy'])->name('api.notes.destroy');

    Route::get('notificaciones', [NotificationController::class, 'page'])->name('notificaciones');
    Route::get('api/notifications/alerts', [NotificationController::class, 'alerts'])->name('api.notifications.alerts');
    Route::post('api/notifications/send', [NotificationController::class, 'send'])->name('api.notifications.send');
});

require __DIR__.'/settings.php';
