<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return auth()->check()
        ? redirect()->route('dashboard')
        : redirect()->route('login');
})->name('home');

Route::get('dashboard', function () {
    return Inertia::render('dashboard');
})->middleware(['auth'])->name('dashboard');

Route::get('clients', function () {
    return Inertia::render('clients');
})->middleware(['auth'])->name('clients');

Route::get('pagos', function () {
    return Inertia::render('Payments');
})->middleware(['auth'])->name('pagos');

require __DIR__.'/settings.php';
