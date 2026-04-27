# Quikkk

Customer-facing loan & credit card marketplace web app for the Indian market (aggregator model — not a direct lender). Compares offers from 12+ partner banks/NBFCs.

## Stack

- pnpm monorepo
- **Frontend**: React + Vite + Tailwind v4 + shadcn/ui + Wouter + TanStack Query + Recharts (artifact: `loan-marketplace`, path `/`)
- **Backend**: Express 5 + Drizzle ORM + PostgreSQL (artifact: `api-server`, path `/api`)
- **API contract**: OpenAPI at `lib/api-spec/openapi.yaml`, codegen via Orval into `@workspace/api-client-react` (hooks) and `@workspace/api-zod` (validation)
- **DB schema**: `lib/db/src/schema/index.ts`

## Auth model

- Phone OTP login → signed `cb_session` httpOnly cookie via `SESSION_SECRET`.
- Demo mode: `POST /api/auth/otp/send` returns `devOtp` so users can complete the flow without an SMS provider; the OTP is also displayed in a toast on the login page.
- `useGetMe` returning 401 means logged out (handled by `ProtectedRoute`).
- Cookies are sent cross-route via `credentials: "include"` in the shared `customFetch`.

## Features

- **OTP login** → KYC (PAN/Aadhaar/bank/income) → instant verification + initial CIBIL score generation.
- **Loan marketplace**: 5 loan types (personal, home, auto, business, education), match engine that ranks lenders by user score, income, and product fit.
- **Loan applications**: full lifecycle with status timeline (submitted → under_review → approved → disbursed).
- **Credit cards**: 8 hand-picked cards with apply flow.
- **EMI calculator**: live calc with pie chart, yearly bar chart, and amortization schedule.
- **Notifications**: SMS/email/WhatsApp/app notifications generated server-side on key actions.
- **Dashboard**: aggregated stats (active apps, approved/disbursed amounts, score, EMI due).
- **Profile**: KYC details, credit score with factors, logout.
- **Admin panel** (`/admin`): overview KPIs + 30-day chart, user management with role assignment, application status workflow, lender configuration, partner payout approval, collections oversight.
- **Channel partner panel** (`/partner`): partner dashboard with conversion funnel, lead list, "create new lead" wizard (creates customer + loan app referred to partner), payout/earnings ledger.
- **Collection partner panel** (`/collection`): DPD-bucketed dashboard, case queue (mine / unassigned / all), case detail with follow-up logging (channel, outcome, promise-to-pay) and payment recovery, follow-up history.

## Roles & demo accounts

`usersTable.role` ∈ `customer` | `admin` | `sales_partner` | `collection_partner`. Login with these phone numbers (OTP shown in toast) to land in the matching panel:
- `9000000001` → Admin Demo
- `9000000002` → Sales Partner Demo (`QSP-00001`)
- `9000000003` → Collection Demo (`QCP-00001`)

Sample loans seeded under the demo partner (some marked overdue and assigned to the demo collector) so dashboards have data on first boot.

## Backend role routes

- `/admin/*` (requires `admin`): `stats`, `timeseries`, `users`, `applications`, `lenders`, `payouts`, `collections`, `recent-activity`, `followups`.
- `/partner/*` (requires `sales_partner`): `stats`, `leads` (GET/POST), `payouts`, `lenders`, `timeseries`.
- `/collection/*` (requires `collection_partner`): `stats`, `cases?filter=mine|unassigned|all`, `cases/:id` (with customer & follow-ups), `cases/:id/{assign,followup,payment}`, `followups`.

`requireRole(...)` middleware in `lib/session.ts` enforces this. Frontend `ProtectedRoute` accepts `allowedRoles` and redirects to the user's home panel via `roleHomePath`.

## Important conventions

- INR formatting via `src/lib/format.ts`.
- PAN/Aadhaar/bank account masked at API level — raw values never leave the DB.
- Frontend API client base URL set in `src/main.tsx` via `setBaseUrl("/api")`.
- Codegen runs via `pnpm --filter @workspace/api-spec run codegen` after editing the OpenAPI spec; do NOT edit generated files.
- Lenders + cards are seeded automatically on API startup (`seedIfEmpty`).
