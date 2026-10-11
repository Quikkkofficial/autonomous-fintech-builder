# Bharat UPI Integration — Design & Provider Choice

## Provider: Cashfree Payments

Evaluated (Oct 2026 research):

| Criteria | Cashfree | Razorpay | PhonePe PG | Direct NPCI |
|---|---|---|---|---|
| UPI Autopay (e-mandate) | ✅ ₹7.5 creation + ₹5–15/debit | ✅ ₹10 + ₹10/debit | ✅ custom pricing | N/A |
| One-time UPI (Collect/QR/Intent) | ✅ | ✅ | ✅ | N/A |
| Payouts (disbursals) | ✅ market leader, instant | ✅ RazorpayX | ❌ limited | N/A |
| Marketplace splits | ✅ Easy Split 0.1%/split | ✅ Route | ❌ | N/A |
| Platform fee | 0% up to ₹20L (till Mar 2027) | 0% up to ₹5L (~3mo) | custom | N/A |
| Settlement | next-day / instant | T+2 | T+1 | N/A |
| Feasibility for startup | ✅ paperless same-day onboarding | ✅ | ✅ | ❌ needs RBI PSO license |

**Why Cashfree wins for Quikkk:**
1. **Cheapest Autopay** — ~40% cheaper per EMI debit than Razorpay. EMI collection is the highest-volume flow.
2. **Payouts leadership** — loan disbursals to customer bank/UPI accounts, instant even on holidays.
3. **Easy Split** — native vendor-commission splits for the marketplace model.
4. **Zero platform fee** up to ₹20L gives runway.
5. **NPCI MDR (Oct 2026)** — 0.4% on P2M >₹2,000; Autopay/SIP debits are exempt from network MDR, which is why the schema tracks `mdr_bucket` per transaction.

## What was built

### Database (lib/db)
- `upi_transactions` — one-time UPI payments (collect/QR/intent), with Cashfree order/payment IDs, purpose, status, MDR bucket, webhook payload
- `upi_autopay_mandates` — e-mandate subscriptions for recurring EMIs (amount, max, frequency, debit counts, auth link, status lifecycle)
- `upi_payouts` — outbound transfers (disbursal / commission / refund) via UPI or bank transfer
- Migration: `lib/db/migrations/0003_upi.sql`

### Backend (artifacts/api-server)
- `src/lib/cashfree.ts` — typed Cashfree PG client: orders, VPA verification, subscriptions (autopay), payouts, webhook HMAC-SHA256 verification, UPI QR string builder, MDR bucket helper
- `src/routes/payments.ts` — REST endpoints (see below)
- `src/app.ts` — raw-body capture for webhook signature verification

### Frontend (artifacts/loan-marketplace)
- `src/components/upi-payment.tsx` — UPI ID collect + QR payment with live status polling
- `src/components/upi-autopay-setup.tsx` — e-mandate setup (frequency, amount, auth redirect)
- `src/pages/payments.tsx` — customer Payments page (transactions + mandates tabs, pause/cancel)
- Route `/payments` wired in `App.tsx`; "Payments" quick action added to dashboard
- `qrcode.react` added for QR rendering

## API surface

| Method & path | Auth | Purpose |
|---|---|---|
| POST /api/payments/order | customer | Create UPI payment order (collect/QR) |
| GET /api/payments/order/:ref | customer | Check + sync order status |
| POST /api/payments/vpa/verify | customer | Verify a UPI ID |
| GET /api/payments/history | customer | Own transactions |
| POST /api/payments/autopay/setup | customer | Create EMI e-mandate |
| GET /api/payments/autopay | customer | Own mandates |
| POST /api/payments/autopay/:ref/cancel | customer | Cancel mandate |
| POST /api/payments/autopay/:ref/pause | customer | Pause mandate |
| POST /api/payments/webhook | HMAC | Cashfree event handler |
| GET /api/admin/payments | admin | All transactions |
| POST /api/admin/payments/order/:ref/refund | admin | Refund |
| GET /api/admin/payments/autopay | admin | All mandates |
| POST /api/admin/payouts | admin | Disbursal / commission payout |
| GET /api/admin/payouts | admin | Payout list |

## Keys the user must provide (Vercel env vars)

1. Sign up at https://www.cashfree.com → complete KYC → go live
2. Developers → API Keys → copy **App ID** and **Secret Key**
3. Set in Vercel (all environments):
   - `CASHFREE_APP_ID`
   - `CASHFREE_SECRET_KEY`
   - `CASHFREE_ENV=production` (keep `sandbox` while testing)
   - `CASHFREE_MERCHANT_VPA` (your business VPA, e.g. `quikkk@okhdfcbank`)
4. In Cashfree dashboard → Webhooks → add `https://quikkk.com/api/payments/webhook`
   for payment + subscription events
5. Run migration: `lib/db/migrations/0003_upi.sql` against the Neon DB

Until keys are set, all UPI endpoints return `503 payments_unavailable`
with a clear message — the rest of the platform is unaffected.
