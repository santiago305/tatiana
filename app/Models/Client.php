<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'dni',
        'phone',
        'ip',
        'install_date',
        'installer',
        'network_name',
        'network_password',
        'plan',
        'department',
        'province',
        'district',
        'speed',
        'upload_speed',
        'download_speed',
        'charge_speed',
        'discharge_speed',
        'monthly_amount',
        'address',
        'coordinates',
        'reference',
        'next_payment_date',
        'is_service_active',
    ];

    protected function casts(): array
    {
        return [
            'install_date' => 'date',
            'next_payment_date' => 'date',
            'monthly_amount' => 'decimal:2',
            'is_service_active' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function notificationLogs(): HasMany
    {
        return $this->hasMany(NotificationLog::class);
    }

    public function scopeOwnedBy(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }
}
