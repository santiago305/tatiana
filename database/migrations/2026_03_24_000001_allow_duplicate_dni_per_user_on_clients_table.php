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
        Schema::table('clients', function (Blueprint $table) {
            $table->dropUnique('clients_user_id_dni_unique');
            $table->index(['user_id', 'dni'], 'clients_user_id_dni_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->dropIndex('clients_user_id_dni_index');
            $table->unique(['user_id', 'dni']);
        });
    }
};
