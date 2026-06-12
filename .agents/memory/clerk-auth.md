---
name: Clerk auth integration
description: How Clerk replaced the custom OTP session auth, DB user provisioning, and what changed across server/client.
---

## Auth model
- Custom OTP + `cb_session` cookie **replaced** by Replit-managed Clerk (email/password + Google SSO).
- `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY` — auto-provisioned by `setupClerkWhitelabelAuth()`.

## DB changes
- `usersTable.clerkId` (varchar 256, unique nullable) added — the bridge between Clerk and DB.
- `usersTable.phone` made **nullable** (was NOT NULL). Existing demo users still have phone values.
- Demo seed users (9000000001 admin, 9000000002 sales_partner, 9000000003 collection_partner) remain in DB but are **not linked to Clerk accounts** — must re-register via Clerk sign-up and then have role set via admin panel.

## JIT provisioning
- `artifacts/api-server/src/lib/session.ts` `requireAuth` now calls `getOrProvisionDbUser(req)` which:
  1. Reads Clerk `userId` via `getAuth(req)` from `@clerk/express`
  2. Looks up DB user by `clerkId`
  3. If not found: fetches Clerk user profile and inserts a new DB row with name/email/phone
- `requireRole` does the same JIT flow then checks the DB role.

## Server wiring
- `app.ts` mounts `clerkProxyMiddleware()` before body parsers, then `clerkMiddleware()` after CORS.
- Proxy middleware is no-op in development; auto-activates in production.
- Old `setSession`/`clearSession`/`getUserId` functions removed from session.ts.
- OTP auth routes (`/auth/otp/send`, `/auth/otp/verify`, `/auth/logout`) removed.

## Frontend wiring
- `App.tsx`: `WouterRouter` → `ClerkProvider` → `QueryClientProvider` → `AuthProvider`.
- Routes `/sign-in/*?` and `/sign-up/*?` render Clerk's `<SignIn>` / `<SignUp>` with `routing="path"`.
- Old `/login`, `/admin/login`, `/partner/login` pages are now redirect stubs → `/sign-in`.
- `auth.tsx`: `useGetMe` is only enabled when `clerkLoaded && isSignedIn`.
- `protected-route.tsx`: uses `useAuth()` from `@clerk/react` for `isSignedIn`; role check still from DB via `useAuth()` from `@/lib/auth`.
- Logout: `useClerk().signOut({ redirectUrl: basePath || "/" })` — no API call needed.
- `panel-layout.tsx` and `profile.tsx` both use Clerk `signOut`.

## Appearance
- Theme: `shadcn` from `@clerk/themes`, `cssLayerName: "clerk"`.
- `index.css` has `@layer theme, base, clerk, components, utilities;` before `@import "tailwindcss"`.
- `vite.config.ts` has `tailwindcss({ optimize: false })` to prevent prod layer reordering.
- Logo: `quikkk-mark.png` from `/public/`.
- Primary: `#EB1414`, foreground: `#141414`.

**Why:** The OTP-only flow was blocking Clerk migration. Clerk provides email/password + Google SSO without SMS, which matches Replit's supported auth methods.
