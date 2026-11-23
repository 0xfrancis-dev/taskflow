<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/** Thin wrapper around the Monnify collections API (checkout + verification + webhook signature). */
class MonnifyService
{
    private function cfg(string $key): ?string
    {
        return config("services.monnify.$key");
    }

    private function base(): string
    {
        return rtrim((string) $this->cfg('base_url'), '/');
    }

    public function enabled(): bool
    {
        return $this->cfg('api_key') && $this->cfg('secret_key') && $this->cfg('contract_code');
    }

    private function token(): string
    {
        return Cache::remember('monnify_access_token', 3000, function () {
            $res = Http::withBasicAuth((string) $this->cfg('api_key'), (string) $this->cfg('secret_key'))
                ->acceptJson()->timeout(20)->post($this->base().'/api/v1/auth/login');

            if (! $res->successful() || ! $res->json('requestSuccessful')) {
                throw new RuntimeException('Monnify authentication failed: '.$res->json('responseMessage', $res->status()));
            }

            return (string) $res->json('responseBody.accessToken');
        });
    }

    private function call(string $method, string $path, array $data = []): Response
    {
        $res = null;
        for ($i = 0; $i < 2; $i++) {
            $res = Http::withToken($this->token())->acceptJson()->timeout(25)->{$method}($this->base().$path, $data);
            if ($res->status() === 401) {
                Cache::forget('monnify_access_token'); // expired token: fetch a new one and retry once

                continue;
            }
            break;
        }

        return $res;
    }

    /** Returns the hosted checkout URL the user should be redirected to. */
    public function initialize(User $user, float $amount, string $reference, string $redirectUrl): string
    {
        $res = $this->call('post', '/api/v1/merchant/transactions/init-transaction', [
            'amount' => $amount,
            'customerName' => $user->name,
            'customerEmail' => $user->email,
            'paymentReference' => $reference,
            'paymentDescription' => 'TaskFlow wallet funding',
            'currencyCode' => 'NGN',
            'contractCode' => $this->cfg('contract_code'),
            'redirectUrl' => $redirectUrl,
            'paymentMethods' => ['CARD', 'ACCOUNT_TRANSFER'],
        ]);

        $url = $res->json('responseBody.checkoutUrl');
        if (! $res->successful() || ! $url) {
            throw new RuntimeException('Monnify init failed: '.$res->body());
        }

        return $url;
    }

    /** Looks the payment up on Monnify by our own reference. Returns the responseBody array or null. */
    public function verify(string $reference): ?array
    {
        $res = $this->call('get', '/api/v2/merchant/transactions/query', ['paymentReference' => $reference]);

        return $res->successful() && $res->json('requestSuccessful') ? $res->json('responseBody') : null;
    }

    /** Monnify signs the raw webhook body with HMAC-SHA512 using the secret key. */
    public function validSignature(string $rawBody, ?string $header): bool
    {
        if (! $header || ! $this->cfg('secret_key')) {
            return false;
        }

        return hash_equals(hash_hmac('sha512', $rawBody, (string) $this->cfg('secret_key')), strtolower(trim($header)));
    }

    // ---------------- Payouts (disbursements) ----------------

    public function payoutsEnabled(): bool
    {
        return (bool) ($this->enabled() && $this->cfg('wallet_account'));
    }

    /** @return array<int, array{name:string, code:string}> */
    public function banks(): array
    {
        return Cache::remember('monnify_banks', 86400, function () {
            $res = $this->call('get', '/api/v1/banks');
            $list = $res->successful() ? ($res->json('responseBody') ?? []) : [];

            return collect($list)->map(fn ($b) => ['name' => $b['name'], 'code' => (string) $b['code']])->sortBy('name')->values()->all();
        });
    }

    /** Name enquiry: returns the account holder's name or null. */
    public function resolveAccount(string $bankCode, string $accountNumber): ?string
    {
        try {
            $params = ['accountNumber' => $accountNumber, 'bankCode' => $bankCode];
            // v1 of this endpoint was retired by Monnify; v2 is the current one.
            $res = $this->call('get', '/api/v2/disbursements/account/validate', $params);
            if (in_array($res->status(), [404, 405])) {
                $res = $this->call('post', '/api/v2/disbursements/account/validate', $params);
            }
        } catch (\Throwable $e) {
            Log::warning('Monnify name enquiry exception', ['error' => $e->getMessage()]);

            return null;
        }

        if (! $res->successful() || ! $res->json('responseBody.accountName')) {
            // Account number is masked; the body shows Monnify's real reason.
            Log::warning('Monnify name enquiry failed', [
                'http_status' => $res->status(),
                'bank_code' => $bankCode,
                'account' => substr($accountNumber, 0, 3).'*******',
                'base_url' => $this->base(),
                'body' => $res->body(),
            ]);

            return null;
        }

        return $res->json('responseBody.accountName');
    }

    /**
     * Starts a payout. Outcomes:
     *  - ['status' => 'SUCCESS'|'PENDING'|'PENDING_AUTHORIZATION'|'FAILED'|..., 'message' => ...]  Monnify accepted the request
     *  - ['retry' => true, 'message' => ...]  Monnify rejected it before sending (e.g. low wallet balance): safe to try again
     *  - ['unknown' => true]  network/server error: money may or may not have moved, so check status before doing anything
     */
    public function transfer(string $reference, float $amount, string $narration, string $bankCode, string $accountNumber, string $accountName): array
    {
        try {
            $res = $this->call('post', '/api/v2/disbursements/single', [
                'amount' => $amount,
                'reference' => $reference,
                'narration' => $narration,
                'destinationBankCode' => $bankCode,
                'destinationAccountNumber' => $accountNumber,
                'destinationAccountName' => $accountName,
                'currency' => 'NGN',
                'sourceAccountNumber' => $this->cfg('wallet_account'),
                'async' => false,
            ]);
        } catch (\Throwable $e) {
            return ['unknown' => true, 'message' => 'Network error while contacting Monnify'];
        }

        if ($res->successful() && $res->json('requestSuccessful')) {
            return ['status' => $res->json('responseBody.status'), 'message' => $res->json('responseMessage')];
        }
        if ($res->serverError()) {
            return ['unknown' => true, 'message' => 'Monnify server error'];
        }

        return ['retry' => true, 'message' => (string) ($res->json('responseMessage') ?: 'Monnify rejected the transfer')];
    }

    public function transferStatus(string $reference): ?string
    {
        try {
            $res = $this->call('get', '/api/v2/disbursements/single/summary', ['reference' => $reference]);
        } catch (\Throwable $e) {
            return null;
        }

        return $res->successful() ? $res->json('responseBody.status') : null;
    }

    public function authorizeTransfer(string $reference, string $otp): array
    {
        try {
            $res = $this->call('post', '/api/v2/disbursements/single/validate-otp', ['reference' => $reference, 'authorizationCode' => $otp]);
        } catch (\Throwable $e) {
            return ['ok' => false, 'message' => 'Could not reach Monnify. Try again.'];
        }

        return $res->successful() && $res->json('requestSuccessful')
            ? ['ok' => true, 'message' => 'Authorized']
            : ['ok' => false, 'message' => (string) ($res->json('responseMessage') ?: 'OTP was not accepted')];
    }
}
