# Quikkk — Google Play Release Checklist

## Account & access
- [ ] Google Play Developer account created ($25 one-time fee, paid)
- [ ] Organization identity verified (D-U-N-S / business documents for Mekyek Global Services Pvt Ltd)
- [ ] Payment profile set up for the developer account

## App package
- [ ] Package name reserved: `com.quikkk.app`
- [ ] Signed AAB built via EAS (`eas build --platform android --profile production`)
- [ ] `versionCode` incremented for every upload; `versionName` updated
- [ ] Keystore backed up in two safe places (losing it = cannot ever update the app)
- [ ] App tested on internal-testing track on real devices (low-end Android included)

## Store listing assets
- [ ] App icon 512×512 PNG (32-bit, no alpha) — TODO: export from logo
- [ ] Feature graphic 1024×500 PNG/JPG — TODO: design
- [ ] Phone screenshots: 2–8 (min 1080px on one side, 9:16 or 16:9) — TODO: capture from app
  - Suggested: Home/products, loan comparison, EMI calculator, OTP login, dashboard
- [ ] 7-inch & 10-inch tablet screenshots (optional but recommended)
- [ ] Title: "Quikkk - Loans & Credit Cards" (≤30 chars) — see `listing/title.txt`
- [ ] Short description (≤80 chars) — see `listing/short-description.txt`
- [ ] Full description (≤4000 chars) — see `listing/full-description.txt`
- [ ] App category: Finance
- [ ] Contact email: info@quikkk.com; phone: +91 83359 74309; website: https://quikkk.com

## Policy & compliance (critical for fintech in India)
- [ ] **Financial Services declaration** completed (App content → Financial features):
      declare aggregator (not a lender); confirm all lending partners are RBI-registered banks/NBFCs
- [ ] **Privacy policy** published at https://quikkk.com/privacy and URL added to listing — draft in `listing/privacy-policy.md`
- [ ] **Data safety** form completed and consistent with the privacy policy (location: not collected; contacts: not collected; financial info: collected for loan applications)
- [ ] **Content rating** questionnaire completed (IARC)
- [ ] **Target audience**: 18+ only (financial product); no "Designed for Families"
- [ ] **Ads declaration**: state whether the app contains ads
- [ ] **Permissions declarations**: camera (document scan for KYC — in-context, optional); no SMS/call-log permissions
- [ ] News/Data safety: personal loan apps face extra review — keep the "not a lender, aggregator only" disclosure prominent in description AND in-app

## Pre-launch report
- [ ] Run Play Console pre-launch report; fix crashes/ANRs on the tested device matrix
- [ ] Check app size (< 150 MB for the base module)

## Rollout
- [ ] Internal testing → closed testing (≥12 testers, 14 days) → production staged rollout (10% → 50% → 100%)
- [ ] Release notes written for each rollout
- [ ] Crash monitoring wired (Firebase Crashlytics / Sentry) before production
