# Staging production-readiness work

This feature branch replaces the demo checkout with an authenticated, server-validated manual UPI workflow. It adds email/Google sign-in, catalog draft/publication forms, order retention and analytics/export, admin verification of bank credits, manual courier fulfillment and an animated delivery estimate. About Us lists founder G Ram Mohan Reddy and the supplied Q Fashion support contacts.

**Not yet ready for live orders.** Firebase reauthentication/new staging provisioning, Vercel team access, Google Routes configuration and service zones, emulator/cloud end-to-end tests, payment/fee policy and remaining dependency review are release gates. No production deployment is authorized. The legacy documentation below describes the original demo and must not be used as setup instructions for the new checkout. Follow [the staging guide](docs/STAGING.md).

Local frontend: Node 24, `npm ci`, `npm run dev`. Validation: `npm test`, `npm run build`. The API runs as a Vercel function and fails closed without separate staging credentials. Sample products cannot be purchased. Real WhatsApp catalog import is deferred.
