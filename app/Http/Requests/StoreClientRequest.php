<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreClientRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'install_date' => $this->input('install_date', $this->input('installDate')),
            'network_name' => $this->input('network_name', $this->input('networkName')),
            'network_password' => $this->input('network_password', $this->input('networkPassword')),
            'upload_speed' => $this->input('upload_speed', $this->input('upload')),
            'download_speed' => $this->input('download_speed', $this->input('download')),
            'charge_speed' => $this->input('charge_speed', $this->input('charge')),
            'discharge_speed' => $this->input('discharge_speed', $this->input('discharge')),
            'monthly_amount' => $this->input('monthly_amount', $this->input('monthlyAmount')),
            'next_payment_date' => $this->input('next_payment_date', $this->input('nextPaymentDate')),
            'is_service_active' => $this->input('is_service_active', $this->input('isServiceActive')),
        ]);
    }

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'dni' => [
                'required',
                'string',
                'max:20',
                Rule::unique('clients', 'dni')->where(fn ($query) => $query->where('user_id', $this->user()->id)),
            ],
            'phone' => ['required', 'string', 'max:20'],
            'ip' => ['required', 'string', 'max:50'],
            'install_date' => ['required', 'date'],
            'installer' => ['required', 'string', 'max:100'],
            'network_name' => ['required', 'string', 'max:50'],
            'network_password' => ['required', 'string', 'max:100'],
            'plan' => ['required', 'string', 'max:100'],
            'department' => ['nullable', 'string', 'max:100'],
            'province' => ['nullable', 'string', 'max:100'],
            'district' => ['nullable', 'string', 'max:100'],
            'speed' => ['required', 'string', 'max:50'],
            'upload_speed' => ['nullable', 'string', 'max:50'],
            'download_speed' => ['nullable', 'string', 'max:50'],
            'charge_speed' => ['nullable', 'string', 'max:50'],
            'discharge_speed' => ['nullable', 'string', 'max:50'],
            'monthly_amount' => ['required', 'numeric', 'min:0.01'],
            'address' => ['nullable', 'string', 'max:200'],
            'coordinates' => ['nullable', 'string', 'max:100'],
            'reference' => ['nullable', 'string', 'max:200'],
            'next_payment_date' => ['required', 'date'],
            'is_service_active' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'El nombre es obligatorio.',
            'dni.required' => 'El DNI es obligatorio.',
            'dni.unique' => 'Este DNI ya existe para tu cuenta.',
            'monthly_amount.min' => 'El monto debe ser mayor a 0.',
            'install_date.required' => 'La fecha de instalación es obligatoria.',
            'next_payment_date.required' => 'La fecha de próximo pago es obligatoria.',
        ];
    }

    public function validated($key = null, $default = null): mixed
    {
        $validated = parent::validated();

        $validated['is_service_active'] = $validated['is_service_active'] ?? true;

        return data_get($validated, $key, $default);
    }
}
