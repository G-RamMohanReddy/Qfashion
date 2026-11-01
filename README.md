# Q Fashion

The Guwahati storefront at https://qfashion.shop has an empty collection layout ready for the owner's catalog. Account, vendor/admin operations, order retention, manual UPI verification and Q Fashion-managed delivery run through an authenticated Vercel API and private Firestore database.

Live Firebase project: `qfashion-live-20261101`. Staging: `qfashion-staging-20261101`. Both use Standard Firestore in Delhi (`asia-south2`). Browser database access is denied; server APIs enforce identity, roles and ownership. Vercel uses Google Workload Identity Federation with short-lived credentials, scoped to this Vercel project and the correct environment. No service-account private key is required.

See [live operations](docs/LIVE.md), [staging history](docs/STAGING.md), and [security model](docs/security-model.md). The staging guide records the earlier setup; LIVE.md supersedes its staging-only restrictions for the user-authorized live release.

Development: Node 24, `npm ci`, `npm run dev`. Checks: `npm test`, `npm run build`. The local Vite server does not run the API. Vercel environment variables must be configured separately for Preview and Production.

Real products remain unpublished. Google Routes billing must be enabled and its connection tested before checkout opens. Manual UPI references are claims, not proof: Q Fashion must confirm the actual bank credit before fulfillment. There are no card simulations, cash on delivery, automated money transfers, or rider GPS tracking.
