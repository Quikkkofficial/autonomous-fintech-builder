# Quikkk Mobile App (Expo + React Native)

Native iOS/Android app for the Quikkk fintech platform. Shares the same backend
API as the web platform (`https://quikkk.com/api`) and the same design language
(primary red `#EB1414`).

## Screens (Expo Router)

| Route | Screen |
|---|---|
| `/` | Home — hero, stats, 10-product grid |
| `/product/[id]` | Product detail — features, rates, apply CTA |
| `/sign-in` | Phone OTP sign-in (Firebase) |
| `/sign-up` | Phone OTP sign-up (+ name) |
| `/dashboard` | Applications, quick actions, UPI entry |
| `/apply` | Loan application (product, amount, tenure) |
| `/emi-calculator` | EMI calculator + "Pay first EMI via UPI" |
| `/profile` | Account, verification status, sign out |

## Auth — Firebase phone OTP (₹0)

Uses `@react-native-firebase/auth` (native — no reCAPTCHA on device).
Flow: `signInWithPhoneNumber` → user enters 6-digit OTP → `confirm(code)` →
`getIdToken()` → `POST /api/auth/session { idToken }` → backend returns a
Quikkk session token → stored in `expo-secure-store`, sent as
`Authorization: Bearer`.

**Requires a dev build** — Firebase phone auth does NOT work in Expo Go.

## UPI payments — deep linking

`src/upi/upi.ts` builds standard `upi://pay` intents and opens the user's UPI
app (GPay/PhonePe/Paytm/BHIM). The EMI calculator's "Pay first EMI via UPI"
button: creates an order via `POST /api/payments/upi/order`, opens the UPI
intent, and the app's `quikkk://upi-callback` deep link receives the response.

## Backend requirements

The mobile client expects these endpoints on `https://quikkk.com/api`
(see the web repo's `AUTH_REDESIGN.md` + UPI design):

- `POST /api/auth/session` — accepts `{ idToken }` (Firebase) and returns
  `{ token }` usable as a Bearer token (the web flow uses httpOnly cookies;
  mobile needs the token variant).
- `GET /api/auth/me`, `POST /api/auth/logout`
- `POST /api/tools/emi`, `POST /api/applications`, `GET /api/applications`
- `POST /api/payments/upi/order` → `{ orderId, amount, upiId, note }`
- `POST /api/payments/upi/verify`

## Run it

```bash
cd mobile-app
npm install          # or: pnpm install

# Firebase native setup (one time):
#  - Firebase console → enable Phone sign-in
#  - Android: download google-services.json → android/app/
#  - iOS: download GoogleService-Info.plist → ios/ (APNs key for silent push)

npx expo run:android   # dev build on Android
npx expo run:ios       # dev build on iOS
npx expo start         # then press a / i after a dev build exists
```

## Project structure

```
mobile-app/
  app/                    # Expo Router screens
    _layout.tsx           # root: AuthProvider + Stack
    index.tsx             # Home
    product/[id].tsx      # Product detail
    sign-in.tsx / sign-up.tsx
    dashboard.tsx / apply.tsx
    emi-calculator.tsx    # + UPI pay button
    profile.tsx
  src/
    theme.ts              # design tokens (#EB1414 primary)
    components/ui.tsx     # Button, Input, Card, Screen
    data/products.ts      # 10-product catalog (mirrors web)
    api/client.ts         # fetch wrapper + typed endpoints
    auth/firebase.ts      # phone OTP via @react-native-firebase/auth
    auth/AuthContext.tsx  # session state, SecureStore token
    upi/upi.ts            # upi://pay deep links + response parsing
```

## Notes / limitations

- Assets (`assets/icon.png`, `splash.png`, `adaptive-icon.png`) are referenced
  in `app.json` but not bundled — add them before building for the stores.
- `node_modules` is not installed here (no network in this environment).
  Run `npm install` on a machine with network access.
- TypeScript: `npm run typecheck` once deps are installed.
