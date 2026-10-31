# Staging setup and launch gates

Work only on feature/production-readiness. Production API access is intentionally disabled by server/admin.js. The browser also refuses to initialize Firebase unless VITE_FIREBASE_PROJECT_ID equals VITE_QF_STAGING_PROJECT_ID. Never set that guard to the existing production project.

## Current state

Firebase account access and Vercel team access are verified. The new qfashion-staging-20261101 project and web app exist, with email/password and Google sign-in enabled. The default Standard Firestore database was verified in Delhi (asia-south2), freeTier=true. A CLI default initially created an empty US database; it was deleted and recreated in Delhi after explicit user approval. No existing Firebase project or production deployment was changed.

The source includes email/password + Google login, email verification/reset/logout, a separate published-variant catalog, vendor draft/admin publication forms, transactional manual UPI ordering, bank-credit verification, manual courier assignment, fulfillment/delivery proof, full order export and aggregate order analysis. The sample catalog is explicitly preview-only and cannot enter the new checkout. WhatsApp catalog import is deferred. Initial checkout is one vendor at a time until commission/payout policy is decided.

## Configure the new Firebase project

1. The separate staging project/web app and Standard native database are created. Keep billing disabled. firebase.json pins the approved Delhi region to prevent implicit CLI defaults. This implementation uses the native Firestore document/transaction Admin SDK.
2. Enable email/password and Google sign-in. Set the authorized preview hostname and localhost; use the owner's chosen support email. Do not enable anonymous checkout.
3. Add a `.firebaserc` staging alias locally, based on `.firebaserc.example`. Deploy only these rules/indexes to the verified staging project, never to an implicit/default target.
4. Prototype rules deny all browser CRUD because the API performs validated, role-scoped reads and writes with Firebase Admin. Validate this with emulator tests before sharing broadly. Restrictive rules were compiled and released only to the new staging project. Existing production rules were not inspected or changed.
5. Configure a narrowly scoped staging service identity and its credentials directly in Vercel Preview variables (or replace the cert adapter with workload identity). Never commit the private key or paste it in chat. Bootstrap an administrator with a server-set custom claim `role: admin`. Vendors receive `role: vendor, vendorId: <id>`. Customers cannot assign roles.

## Preview environment variables

Copy public web config names from `.env.example`, including VITE_QF_STAGING_PROJECT_ID. Add server-only variables from `server/.env.example` to Vercel Preview only. GOOGLE_MAPS_SERVER_KEY must be restricted to Google Routes API and kept server-side. Enable the Routes API/billing yourself after reviewing its costs; this work does not enable billing.

Manual UPI uses `9177595164@ybl`. MANUAL_UPI_ENABLED defaults to false. Set MANUAL_UPI_UNTIL to an explicit ISO timestamp for the end of the temporary period, for example `2026-12-01T00:00:00+05:30`. Both new and resumed payments fail closed after it expires. Never enable real transfers merely to test the UI. For UI tests use synthetic order payloads; for staging service tests use disposable, clearly identified test records. Gateway migration must retain pending manual-payment reconciliation.

## Operations

Admin enters a vendor's pickup address, coordinates, service pincodes, maximum road distance, preparation, packaging, rider-arrival estimate and buffer. The server checks both pincode and coordinates and gets road duration from Google Routes. Travel mode is DRIVE; it is an estimate and not a rider-specific GPS measurement. No rider location is collected, stored or displayed. Customer address coordinate entry is a temporary staging interface; an integrated Google address/pin picker remains pending Maps configuration.

Admin publishes variants with size/color, available stock and tax-inclusive prices. This staging implementation adds no delivery or packaging charge. Price/tax/fee policy must be reviewed before launch; it does not issue tax invoices. Variants reserve stock in a transaction; one pending checkout per customer prevents unlimited reservations. Timed-out pending orders remain stored and can be cancelled to release inventory; automated reservation expiry/late-credit reconciliation remains a launch gate.

Customer creates an unpaid order, pays the exact amount once, then submits a 12-digit UPI reference. This is only awaiting_verification. Admin must check the actual bank statement, matching reference and amount, before marking payment verified. A unique credit record prevents reusing one reference for multiple orders. No screenshot or customer callback proves payment.

Admin calls the courier and records name/phone, then updates accept, packed, pickup and delivered stages. Delivery completion requires the customer's server-verified six-digit code. It is private to the customer and hashed for verification; invalid attempts are bounded. No courier account is required for this temporary workflow. Delivery animations indicate order stage only; they do not simulate movement or advance fulfillment automatically.

Orders retain customer/contact/address snapshots, purchased item descriptions/variants/images/quantities/prices, currency, vendor configuration snapshot, exact total, tax-inclusive indicator/fees, submitted reference, verifier/time, ETA components/source, courier record, status history, completion and cancellation timestamps and refund details. The app has no order-delete endpoint. Admin can view a complete JSON record, all-status aggregates and paginated full export. Vendor/customer API responses remove unnecessary private operational fields. Export files contain private customer data and should be stored securely. Aggregates are gross collections/order values, not profit or bank reconciliation.

Cancelled orders with claimed/verified credits enter refund_review. Admin sends any refund separately through the bank, then records its reference/amount/notes. The recordRefund endpoint does not transfer funds. Automated refunds, repeat partial refunds, vendor payouts, backups/retention administration and reconciliation reports remain future work.

## Verification before any release

Run `npm test` and `npm run build`. Current tests include pure domain tests and API tests against a transactional in-memory adapter. They do not replace Firestore emulator concurrency/rules tests or authenticated staging browser tests. Java is not available in this environment for running the Firestore emulator. Validate account isolation, concurrent last-item checkout, duplicate bank references, wrong delivery codes, role restrictions, route failures and account switching in real staging.

The dependency update removes reported high-severity findings; six moderate findings remain in Google SDK filesystem dependencies at the last audit. Review before production. Package versions are locked. Never use `npm audit fix --force` blindly.

The Vite local server serves only the frontend. `/api/marketplace` runs as a Vercel function; use a configured Vercel preview to test the full flow. Production deployment needs a separate approved release after the remaining gates above are resolved.

## Current preview

Draft PR: https://github.com/G-RamMohanReddy/Qfashion/pull/1

Vercel staging target: https://qfashion-2h8rifmv2-gudurirammohanreddy-1608.vercel.app (READY, commit e0ac3484ec737aa673917d9fa99213ef622a6ac4). Branch-specific Preview configuration points only to the new Firebase project. Manual UPI is disabled. Firebase Admin service credentials and Google Routes key/service zones remain unconfigured. Existing preview protection is retained.
