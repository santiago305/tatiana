<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name', 100);
            $table->string('dni', 20);
            $table->string('phone', 20);
            $table->string('ip', 50);
            $table->date('install_date');
            $table->string('installer', 100);
            $table->string('network_name', 50);
            $table->string('network_password', 100);
            $table->string('plan', 100);
            $table->string('department', 100)->nullable();
            $table->string('province', 100)->nullable();
            $table->string('district', 100)->nullable();
            $table->string('speed', 50);
            $table->string('upload_speed', 50)->nullable();
            $table->string('download_speed', 50)->nullable();
            $table->string('charge_speed', 50)->nullable();
            $table->string('discharge_speed', 50)->nullable();
            $table->decimal('monthly_amount', 10, 2);
            $table->string('address', 200)->nullable();
            $table->string('coordinates', 100)->nullable();
            $table->string('reference', 200)->nullable();
            $table->date('next_payment_date');
            $table->boolean('is_service_active')->default(true);
            $table->timestamps();

            $table->unique(['user_id', 'dni']);
            $table->index('next_payment_date');
            $table->index('is_service_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clients');
    }
};
