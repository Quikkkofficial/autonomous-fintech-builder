# Deploying to Vercel

This repo is configured for Vercel (`vercel.json` at the repo root):

- **Frontend** — `artifacts/loan-marketplace` (Vite SPA) is built with
  `pnpm --filter @workspace/loan-marketplace build` and served from
  `artifacts/loan-marketplace/dist/public`. `PORT`/`BASE_PATH` default to
  `3000`/`/` when not provided (Replit still injects its own values).
- **API** — `api/index.mjs` is a serverless function that wraps the Express
  app. The app is bundled to `artifacts/api-server/dist/app.mjs` during the
  build (`pnpm --filter @workspace/api-server build`); the function just
  imports that self-contained bundle. All `/api/*` requests are rewritten to
  it; everything else falls back to the SPA (`/index.html`, client routing).

## Required environment variables (Vercel project settings)

| Variable                | Required | Notes                                                              |
| ----------------------- | -------- | ------------------------------------------------------------------ |
| `DATABASE_URL`          | Yes      | Postgres connection string. The API throws on boot without it.     |
| `CLERK_SECRET_KEY`      | Yes*     | Clerk secret key — the API uses Clerk for authentication.           |
| `CLERK_PUBLISHABLE_KEY` | Yes*     | Clerk publishable key — needed by the frontend login flow.          |
| `CASHFREE_APP_ID`       | For UPI  | Cashfree PG "App ID" (dashboard.cashfree.com → Developers → API Keys) |
| `CASHFREE_SECRET_KEY`   | For UPI  | Cashfree PG "Secret Key"                                            |
| `CASHFREE_ENV`          | For UPI  | `sandbox` (default) or `production`                                |
| `CASHFREE_WEBHOOK_SECRET` | For UPI | Webhook signing secret (defaults to `CASHFREE_SECRET_KEY`)         |
| `CASHFREE_MERCHANT_VPA` | For UPI  | Merchant VPA shown in QR strings (e.g. `quikkk@cashfree`)           |
| `PUBLIC_BASE_URL`       | For UPI  | Public site URL for return/notify URLs (default `https://quikkk.com`) |

\* Being replaced by free Firebase OTP + Brevo email auth (see AUTH_REDESIGN.md).
UPI payments return `503 payments_unavailable` until the Cashfree keys are set.

Set them in the Vercel dashboard under Project → Settings → Environment
Variables (all environments). After setting `DATABASE_URL`, run the schema
push from a machine with DB access:

```sh
cd lib/db
DATABASE_URL="<same value>" pnpm run push
```

No other env vars are required. `NODE_ENV=production` is set automatically
by Vercel (this also switches the API logger off the pretty transport).
