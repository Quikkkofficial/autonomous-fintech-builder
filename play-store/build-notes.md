# Quikkk Android — Build & Upload Notes

App: Quikkk (React Native / Expo)
Package name: `com.quikkk.app`
Backend: https://quikkk.com/api
Target: Google Play (AAB)

## 1. Prerequisites

```bash
cd /tmp/afb/mobile-app
npm install -g eas-cli
eas login            # Expo account (create at expo.dev)
```

Set env vars used by the app before building:
- `EXPO_PUBLIC_API_URL=https://quikkk.com/api`
- `EXPO_PUBLIC_FIREBASE_*` — Firebase web config values (from Firebase console)

## 2. Create the Android keystore (first time only)

Option A — let EAS manage it (recommended):
```bash
eas build --platform android
# when prompted: "Generate a new Android keystore?" → Yes
```
EAS stores the keystore securely; download a backup from
expo.dev → Project → Credentials.

Option B — manual keystore:
```bash
keytool -genkeypair -v -storetype PKCS12 \
  -keystore quikkk-release.keystore -alias quikkk \
  -keyalg RSA -keysize 2048 -validity 9125
# store the passwords safely — losing the keystore = cannot update the app, ever
```

## 3. Configure EAS (first time)

```bash
eas build:configure
```
This creates `eas.json`. Ensure the production profile:
```json
{
  "build": {
    "production": { "android": { "buildType": "app-bundle" } }
  },
  "submit": {
    "production": { "android": { "track": "internal" } }
  }
}
```

Bump version in `app.json` before each release:
- `expo.version` (e.g. "1.0.0" → "1.0.1")
- `expo.android.versionCode` (integer, must increase every upload)

## 4. Build the AAB

```bash
eas build --platform android --profile production
```
Download the `.aab` when the build finishes (link in terminal / expo.dev dashboard).

Local sanity check (optional):
```bash
npx expo prebuild --platform android
cd android && ./gradlew bundleRelease
```

## 5. Upload to Play Console

1. Go to [play.google.com/console](https://play.google.com/console) → Quikkk app
2. **Testing → Internal testing** → "Create new release" → upload the `.aab`
3. Add release notes, Save → "Review release" → "Start rollout to Internal testing"
4. Test on real devices via the internal-testing opt-in link
5. Promote: Internal → Closed → **Production** (staged rollout recommended: 10% → 50% → 100%)

## 6. First-release extras

- Complete the **Financial Services declaration** (Play Console → App content) — mandatory for fintech apps in India; declare the app is an aggregator, not a lender, and list RBI-compliant partners
- Fill the **Data safety** section to match the privacy policy
- Complete the **Content rating** questionnaire (expect "Everyone")
- Set **Target audience** (18+ — financial product)
- Publish the privacy policy at https://quikkk.com/privacy and paste the URL in the store listing
