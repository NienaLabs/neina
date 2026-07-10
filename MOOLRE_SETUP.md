# Moolre Payments Setup

Niena collects all payments in GHS through [Moolre](https://moolre.com) —
mobile money (MTN MoMo, Telecel Cash, AT Money) with an in-app USSD approval
flow, plus a hosted Moolre Web POS checkout for cards. Built for the
[Moolre Startup Cup](https://startup.moolre.com).

## How it works

```
Pricing page → MoolrePaymentDialog
  ├─ Mobile money: POST /open/transact/payment → USSD prompt on payer's phone
  │    └─ client polls payment.checkTransaction → server verifies via
  │       POST /open/transact/status → fulfillTransaction() grants the purchase
  └─ Card/other: POST /embed/link → redirect to Moolre Web POS
       └─ redirect back to /pricing/verify?reference=... (same polling)

Webhook: POST /api/webhooks/moolre
  └─ payload is treated as a hint only — the server re-verifies with the
     status API before fulfilling (callbacks are not signed)
```

Key files:
- [lib/moolre.ts](lib/moolre.ts) — API client (sandbox/live switch)
- [lib/fulfillment.ts](lib/fulfillment.ts) — idempotent purchase fulfillment
- [trpc/routers/_payment.ts](trpc/routers/_payment.ts) — payment procedures
- [app/api/webhooks/moolre/route.ts](app/api/webhooks/moolre/route.ts) — callback
- [app/pricing/MoolrePaymentDialog.tsx](app/pricing/MoolrePaymentDialog.tsx) — checkout UI

Plans are **30-day passes** — Moolre has no recurring billing, so nothing
auto-renews. `user.planExpiresAt` tracks expiry and the sidebar offers renewal.

## Environment variables

```env
MOOLRE_ENV=sandbox            # "sandbox" or "live"
MOOLRE_API_USER=              # your Moolre username
MOOLRE_ACCOUNT_NUMBER=        # your Moolre wallet/account number
MOOLRE_API_KEY=               # PRIVATE key — live only
MOOLRE_API_PUBKEY=            # PUBLIC key — live only
```

Sandbox (`https://sandbox.moolre.com`) only needs `MOOLRE_API_USER` and
`MOOLRE_ACCOUNT_NUMBER` — no API keys required.

## Getting credentials

1. Register at [app.moolre.com](https://app.moolre.com) (business account).
2. Create a GHS wallet — note the **account number**.
3. Enable API access on the wallet and generate the **private** and **public**
   API keys (Settings → API).
4. Set the wallet's **callback URL** to
   `https://<your-domain>/api/webhooks/moolre`.
5. Fill in the env vars above and set `MOOLRE_ENV=live` when going to production.

## Testing

- With `MOOLRE_ENV=sandbox`, all calls go to the sandbox and no real money moves.
- The webhook can be exercised locally:
  `curl -X POST localhost:3000/api/webhooks/moolre -H "Content-Type: application/json" -d '{"data":{"externalref":"niena_..."}}'`
  — fulfillment only happens if Moolre's status API confirms the payment.
