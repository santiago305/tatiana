<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePaymentRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'client_id' => $this->input('client_id', $this->input('clientId')),
            'payment_date' => $this->input('payment_date', $this->input('paymentDate')),
            'period_label' => $this->input('period_label', $this->input('period')),
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
            'client_id' => [
                'required',
                'integer',
                Rule::exists('clients', 'id')->where(fn ($query) => $query->where('user_id', $this->user()->id)),
            ],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'payment_date' => ['nullable', 'date'],
            'period_label' => ['nullable', 'string', 'max:30'],
        ];
    }

    public function messages(): array
    {
        return [
            'client_id.exists' => 'El cliente seleccionado no es válido.',
            'amount.min' => 'El monto debe ser mayor a 0.',
        ];
    }
}
