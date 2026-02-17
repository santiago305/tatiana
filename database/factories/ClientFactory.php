<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Client>
 */
class ClientFactory extends Factory
{
    public function definition(): array
    {
        $plan = fake()->randomElement([
            'Plan Hogar 50',
            'Plan Hogar 100',
            'Plan Negocio 200',
            'Plan Pro 300',
        ]);

        $monthlyAmount = match ($plan) {
            'Plan Hogar 50' => 39.90,
            'Plan Hogar 100' => 59.90,
            'Plan Negocio 200' => 89.90,
            default => 129.90,
        };

        $speed = match ($plan) {
            'Plan Hogar 50' => '50 Mbps',
            'Plan Hogar 100' => '100 Mbps',
            'Plan Negocio 200' => '200 Mbps',
            default => '300 Mbps',
        };

        $upload = match ($plan) {
            'Plan Hogar 50' => '25 Mbps',
            'Plan Hogar 100' => '50 Mbps',
            'Plan Negocio 200' => '100 Mbps',
            default => '150 Mbps',
        };

        return [
            'user_id' => User::factory(),
            'name' => fake()->name(),
            'dni' => fake()->unique()->numerify('########'),
            'phone' => '9'.fake()->numerify('########'),
            'ip' => fake()->ipv4(),
            'install_date' => fake()->dateTimeBetween('-2 years', 'now')->format('Y-m-d'),
            'installer' => fake()->randomElement(['Carlos Tecnico', 'Pedro Instalador', 'Maria Soporte']),
            'network_name' => 'GESEM_'.strtoupper(fake()->bothify('??###')),
            'network_password' => fake()->regexify('[A-Za-z0-9]{10}'),
            'plan' => $plan,
            'department' => 'Lima',
            'province' => 'Lima',
            'district' => fake()->randomElement(['SJL', 'Ate', 'Surco', 'Los Olivos', 'VMT', 'VES', 'Comas']),
            'speed' => $speed,
            'upload_speed' => $upload,
            'download_speed' => $speed,
            'charge_speed' => $upload,
            'discharge_speed' => $speed,
            'monthly_amount' => $monthlyAmount,
            'address' => fake()->streetAddress(),
            'coordinates' => fake()->latitude(-12.30, -11.80).','.fake()->longitude(-77.20, -76.70),
            'reference' => fake()->optional()->sentence(4),
            'next_payment_date' => fake()->dateTimeBetween('-10 days', '+30 days')->format('Y-m-d'),
            'is_service_active' => fake()->boolean(90),
        ];
    }
}
