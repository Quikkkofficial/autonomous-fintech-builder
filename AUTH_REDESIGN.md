# Auth Redesign: Replace Clerk with Free OTP + Email Verification

**Status:** Design only — not implemented.
**Date:** 2026-10-12
**Context:** Clerk keys were never configured, so `/sign-in` renders blank and every
auth-gated surface (login, signup, customer dashboard, partner portal, admin dashboard)
is dead. User requested a **₹0** replacement: free phone OTP + free email verification.

---

## 1. Current state (what Clerk touches)

| Layer | File | Clerk usage |
|---|---|---|
| Frontend root | `artifacts/loan-marketplace/src/App.tsx` | `ClerkProvider`, `<SignIn routing="path">`, `<SignUp routing="path">`, `useClerk` (cache invalidator), `clerkAppearance` theme blob |
| Auth context | `artifacts/loan-marketplace/src/lib/auth.tsx` | `useAuth` from `@clerk/react` gates the `/api/me` fetch |
| Route guard | `artifacts/loan-marketplace/src/components/protected-route.tsx` | `isSignedIn`/`isLoaded` from Clerk |
| Layout | `artifacts/loan-marketplace/src/components/panel-layout.tsx` | `useClerk().signOut` |
| Profile | `artifacts/loan-marketplace/src/pages/profile.tsx` | `useClerk().signOut` |
| Backend | `artifacts/api-server/src/app.ts` | `clerkMiddleware`, `publishableKeyFromHost` |
| Backend | `artifacts/api-server/src/middlewares/clerkProxyMiddleware.ts` | Proxies Clerk Frontend API (`/api/__clerk`) |
| Backend | `artifacts/api-server/src/lib/session.ts` | `getAuth` + `createClerkClient` map `clerkId` → DB user; `requireAuth`/`requireRole` |
| Deps | `artifacts/loan-marketplace/package.json` | `@clerk/react`, `@clerk/themes` |
| Deps | `artifacts/api-server/package.json` | `@clerk/express`, `@clerk/shared` |
| DB | `lib/db/src/schema/index.ts` | `users.clerk_id` (unique); `otps` table exists but is unused (`phone`, `code`, `expires_at`) |
| API client | `lib/api-client-react` | `customFetch` already sends `credentials: "include"` (cookie-ready) |

Key observation: **there are no live Clerk users** (keys were never set), so a clean
cutover is safe — no live-session migration needed. Keep `clerk_id` column for safety.

---

## 2. Recommended stack (₹0/month)

### Phone OTP → Firebase Authentication (Phone provider)
- **Why:** 10,000 phone verifications/month free on the Spark (free) plan. Google handles
  India SMS delivery and DLT compliance — no DLT registration, no per-SMS cost for us.
- **Flow:** Firebase JS SDK on the client sends + verifies the OTP (with invisible
  reCAPTCHA). On success the client POSTs the Firebase ID token to our backend, which
  verifies it with `firebase-admin` and mints its **own** session. We never touch SMS.
- **Rejected alternative:** self-managed SMS OTP via MSG91/Fast2SMS — India requires DLT
  registration and ~₹0.15–0.25/SMS. Not free.

### Email verification → Brevo (ex-Sendinblue) free tier
- **Why:** 300 emails/day free **forever**, no credit card. Simple REST API (no extra dep —
  plain `fetch`).
- **Fallback:** Gmail SMTP (500/day) if Brevo is ever unavailable.
- **Rejected alternative:** SendGrid free (100/day — too small), Resend free (100/day).

### Sessions → DB-backed, httpOnly cookies (own code)
- **Why:** works on Vercel serverless (Neon Postgres is already there), no vendor, ₹0.
  `customFetch` already uses `credentials: "include"`.

### Total cost at current scale: **₹0**

---

## 3. Database schema changes (`lib/db/src/schema/index.ts`)

```ts
// 3a. NEW: sessions table (server-side session store)
export const sessionsTable = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(), // sha256 of opaque token
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  userAgent: varchar("user_agent", { length: 300 }),
  ip: varchar("ip", { length: 45 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 3b. EXTEND: users table
//   + firebaseUid: varchar(128).unique().nullable()   (link Firebase identity)
//   + emailVerifiedAt: timestamp nullable
//   + phoneVerifiedAt: timestamp nullable
//   KEEP clerk_id (legacy, harmless)

// 3c. EXTEND: otps table (currently phone/code/expiresAt only)
export const otpsTable = pgTable("otps", {
  id: serial("id").primaryKey(),
  identifier: varchar("identifier", { length: 200 }).notNull(), // phone or email
  channel: varchar("channel", { length: 10 }).notNull(),        // 'sms' | 'email'
  purpose: varchar("purpose", { length: 20 }).notNull(),        // 'login' | 'signup' | 'email_verify'
  codeHash: varchar("code_hash", { length: 64 }).notNull(),     // sha256, NEVER store plaintext
  attempts: integer("attempts").notNull().default(0),
  usedAt: timestamp("used_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
```

Migration: `drizzle-kit generate` + apply against Neon (same flow as the existing schema).

---

## 4. Backend API (Express, `artifacts/api-server/src`)

### 4a. New endpoints in `routes/auth.ts` (currently an empty router)

| Method & path | Body | Behaviour |
|---|---|---|
| `POST /api/auth/session` | `{ idToken }` | Verify Firebase ID token (`firebase-admin`), extract `phone_number`. Find-or-create user by phone (attach `firebaseUid`, set `phoneVerifiedAt`). Create session row, set `quikkk_session` httpOnly cookie. Return user JSON (same shape as `/api/me`). |
| `POST /api/auth/logout` | — | Delete session row, clear cookie. |
| `POST /api/auth/email/request` | `{ email }` | Rate-limit (below). Generate 6-digit OTP (10-min TTL), store **hash**, send via Brevo. |
| `POST /api/auth/email/verify` | `{ email, code }` | Constant-time compare against hash, check attempts/expiry, set `emailVerifiedAt`, mark OTP used. |
| (keep) `GET /api/me` | — | Unchanged shape; now uses cookie session instead of Clerk. |

### 4b. Rewrite `lib/session.ts`
- `requireAuth`: read `quikkk_session` cookie → `sha256(token)` → lookup in `sessions`
  (join users, check `expiresAt > now()`) → set `req.userId`. 401 otherwise.
- `requireRole(...roles)`: same + role check from `users.role`. 403 otherwise.
- Add `createSession(userId, userAgent, ip)` and `destroySession(tokenHash)` helpers.

### 4c. New lib files
- `lib/otp.ts` — `generateOtp()` (`crypto.randomInt(100000, 999999)`), `hashOtp()`
  (sha256), `timingSafeEqual` compare.
- `lib/mail.ts` — Brevo `POST https://api.brevo.com/v3/smtp/email` via `fetch`
  (API key from env, server-side only).
- `lib/rate-limit.ts` — in-memory sliding window is **not** safe on serverless;
  use a tiny Neon table or Vercel KV. Limits: ≤3 OTP sends / phone / hour,
  ≤5 verify attempts / OTP, ≤10 sends / IP / hour.

### 4d. `app.ts` changes
- **Remove:** `clerkMiddleware`, `publishableKeyFromHost`, `clerkProxyMiddleware` mount.
- **Keep:** `cookieParser`, `cors({ credentials: true })`, JSON parsing.
- **Add:** rate-limit middleware on `/api/auth/*`.

### 4e. Delete
- `middlewares/clerkProxyMiddleware.ts` (Clerk-only).

### 4f. Deps (`artifacts/api-server/package.json`)
- Remove: `@clerk/express`, `@clerk/shared`
- Add: `firebase-admin` (ID-token verification only)

---

## 5. Frontend changes (`artifacts/loan-marketplace/src`)

### 5a. `App.tsx`
- Remove `ClerkProvider`, `SignIn`, `SignUp`, `useClerk`, `clerkAppearance`,
  `ClerkQueryClientCacheInvalidator`.
- New `AuthProvider` (cookie-based, see 5b) wraps the router.
- Replace `SignInPage`/`SignUpPage` with custom components (5d).

### 5b. `lib/auth.tsx` (rewrite)
```tsx
// fetch /api/me with credentials on mount; expose { user, isLoading, error, signOut, refresh }
```
`signOut()` → `POST /api/auth/logout` → clear React Query cache → redirect `/`.

### 5c. `components/protected-route.tsx` (rewrite)
- Drop Clerk hooks; rely solely on `useAuth()`: if `!isLoading && !user` → `/sign-in`;
  role mismatch → `roleHomePath(user.role)`.

### 5d. New: phone OTP sign-in (`pages/sign-in.tsx`, replaces inline `SignInPage`)
1. Phone input (+91 default, 10-digit validation).
2. Invisible reCAPTCHA + `signInWithPhoneNumber` (Firebase SDK).
3. 6-digit OTP input → `confirmationResult.confirm(code)`.
4. `POST /api/auth/session { idToken }` → `refresh()` → redirect by role.
- Sign-up = same flow + name field collected before OTP (stored on user create).
- New `lib/firebase.ts` (init app from `VITE_FIREBASE_*` env) and
  `components/otp-input.tsx` (6-box input).

### 5e. `components/panel-layout.tsx`, `pages/profile.tsx`
- Replace `useClerk().signOut` with `useAuth().signOut`.

### 5f. Deps (`artifacts/loan-marketplace/package.json`)
- Remove: `@clerk/react`, `@clerk/themes`
- Add: `firebase` (client SDK)

---

## 6. Migration path from Clerk

1. No live Clerk users exist → **clean cutover**, no session migration.
2. Keep `users.clerk_id` column (harmless; useful if Clerk is ever re-enabled).
3. New users identified by **phone** (Firebase UID linked on first login).
4. Admin/partner/collection roles: unchanged — role lives in `users.role`; existing
   role-gated routes (`/admin`, `/partner`, `/collection`) work identically once
   `requireRole` reads from the cookie session.
5. Deploy order: DB migration → backend → frontend (single Vercel deploy is fine;
   old Clerk frontend can't log anyone in anyway).

---

## 7. Security considerations

- **OTP storage:** only `sha256(code)` in DB; codes never logged.
- **OTP policy:** 6 digits, 10-minute expiry, max 5 attempts then invalidate,
  max 3 sends per phone per hour, per-IP throttling.
- **Sessions:** 256-bit opaque tokens (`crypto.randomBytes`), only the hash stored;
  30-day expiry with sliding refresh; `httpOnly`, `Secure`, `SameSite=Lax` cookies;
  server-side destroy on logout.
- **CSRF:** `SameSite=Lax` + require a custom header (e.g. `x-quikkk-csrf: 1`) on
  mutating `/api/*` calls from the SPA.
- **Firebase:** enable invisible reCAPTCHA, register `quikkk.com` (+ preview domains)
  as authorized domains in the Firebase console, disable unused sign-in providers.
- **Email:** Brevo API key server-side only (Vercel env); no email content injection
  (escape user input in templates).
- **PII:** phone/email already in schema; no new PII classes introduced.
- **Abuse:** Firebase's own anti-abuse + our rate limits; monitor Brevo bounce rate.

---

## 8. Vercel env vars needed

| Var | Where | Source |
|---|---|---|
| `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID` | Frontend (public) | Firebase console → Project settings |
| `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | Backend (secret) | Firebase service account JSON |
| `BREVO_API_KEY` | Backend (secret) | Brevo dashboard → SMTP & API |
| `BREVO_SENDER_EMAIL` (e.g. `noreply@quikkk.com`) | Backend | Brevo verified sender |

All secrets go through the Secure Vault flow — never in chat, code, or logs.

---

## 9. Effort estimate

| Piece | Files | Size |
|---|---|---|
| DB schema + migration | 1 | S |
| Backend: auth routes, session rewrite, otp/mail/rate-limit libs | ~6 | M |
| Frontend: auth context, route guard, sign-in/up pages, firebase init, otp input | ~7 | M |
| Deps + env wiring + QA | — | S |

Recommended order: schema → backend → frontend → env vars → deploy → end-to-end OTP test.
