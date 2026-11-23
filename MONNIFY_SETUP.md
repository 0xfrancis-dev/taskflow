# Monnify online wallet funding

## 1. Add your keys to `.env` (never commit this file, never paste the secret key in chat)
```
MONNIFY_BASE_URL=https://sandbox.monnify.com
MONNIFY_API_KEY=your_api_key
MONNIFY_SECRET_KEY=your_secret_key
MONNIFY_CONTRACT_CODE=your_contract_code
MONNIFY_WALLET_ACCOUNT=your_wallet_account_number
```
The **contract code** is required to take payments. Find it in the Monnify dashboard under Developer > API Keys & Contracts.
The wallet account number is not used yet (it is for automated payouts later).

Then run:  `php artisan config:clear`   and   `npm run build`

## 2. Test locally (sandbox)
Wallet > Fund wallet > "Pay securely online". Pay with Monnify's sandbox test card / transfer simulation. You are redirected back to the wallet page, the payment is verified with Monnify and the wallet is credited. No public URL is needed for this.

## 3. Webhook (when the site is live)
In the Monnify dashboard open Developer > Webhook URLs and set the **transaction completion** URL to:
`https://YOUR-DOMAIN/api/webhooks/monnify`
This credits wallets even if the user closes the tab before returning. Local testing of the webhook needs a tunnel such as ngrok.

## 4. Going live
Use live keys and `MONNIFY_BASE_URL=https://api.monnify.com`, set `APP_URL` to your real https domain.

## Automatic withdrawals (payouts)
Needs `MONNIFY_WALLET_ACCOUNT` (your Monnify disbursement wallet number) in `.env`, and the wallet must hold money to pay out. In the sandbox you can top the wallet up from the dashboard.

1. Run `php artisan migrate` (adds `bank_code` and `payout_reference` to withdrawals).
2. Users pick their bank from Monnify's list and type their account number. The account name is verified automatically.
3. Admin > Withdrawals > "Send via Monnify" pays the user's bank account.
4. If Monnify asks for an OTP, the withdrawal shows "Processing" with a note. Enter the OTP (button "Enter OTP"), or switch off transfer OTP in the Monnify dashboard for the sandbox. "Check status" refreshes the result.
5. If Monnify reports FAILED or REVERSED, the user's money is returned to their wallet automatically, exactly once.
6. Webhook: also enable the **disbursement** webhook URL in Monnify (Developer > Webhook URLs): `https://YOUR-DOMAIN/api/webhooks/monnify`
7. Daily limit per user: `WITHDRAWAL_DAILY_LIMIT` in `.env` (default 200000).
