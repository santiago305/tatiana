<?php

namespace App\Providers;

use App\Actions\Clients\CreateClientAction;
use App\Actions\Clients\DeleteClientAction;
use App\Actions\Clients\ToggleClientServiceAction;
use App\Actions\Clients\UpdateClientAction;
use App\Actions\Dashboard\GetDashboardDataAction;
use App\Actions\Notes\CreateNoteAction;
use App\Actions\Notes\DeleteNoteAction;
use App\Actions\Notifications\BuildNotificationMessageAction;
use App\Actions\Payments\RegisterPaymentAction;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(CreateClientAction::class);
        $this->app->singleton(UpdateClientAction::class);
        $this->app->singleton(DeleteClientAction::class);
        $this->app->singleton(ToggleClientServiceAction::class);
        $this->app->singleton(RegisterPaymentAction::class);
        $this->app->singleton(CreateNoteAction::class);
        $this->app->singleton(DeleteNoteAction::class);
        $this->app->singleton(GetDashboardDataAction::class);
        $this->app->singleton(BuildNotificationMessageAction::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null
        );
    }
}
