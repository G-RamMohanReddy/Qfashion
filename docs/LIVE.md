# Live Q Fashion operations

## Accounts and identity

The live project is qfashion-live-20261101 (214256423899), web app 1:214256423899:web:6aa8380b61a89b4199cdfe. Standard native Firestore is in asia-south2, free tier. Production customer data is separate from qfashion-staging-20261101.

Firebase email/password and Google sign-in are enabled. Email verification is required before private APIs are available. Signup, password reset, verification refresh, login and logout use Firebase rather than local simulated accounts. Profile names/phones and up to five delivery addresses are private to the authenticated user. Coordinates and pincode are checked for ordering.

The verified founder email qfashion.shop1@gmail.com is the administrator identified by a protected server environment setting. A request body or profile edit cannot choose this role. Other users receive customer access by default. Admin can assign existing verified users to customer/vendor/rider roles, requiring an existing vendor for vendor access. Role changes revoke old sessions and are audited. The founder account cannot be altered through that form.

## Keyless backend

Production environment requires FIREBASE_PROJECT_ID and QF_ALLOWED_PROJECT_ID = qfashion-live-20261101, QF_DEPLOYMENT_ENV=production. Client VITE_QF_FIREBASE_PROJECT_ID must match its public Firebase project ID. Preview retains its own staging configuration.

The Vercel OIDC issuer is https://oidc.vercel.com/gudurirammohanreddy-1608, audience https://vercel.com/gudurirammohanreddy-1608. The identity provider condition and service-account binding restrict the subject to owner:gudurirammohanreddy-1608:project:qfashion:environment:production. Staging uses an independent provider and the preview subject. The service identities are qfashion-web@PROJECT_ID.iam.gserviceaccount.com. Permissions cover Firestore user operations, reading Firebase users, and a custom role that permits updating existing user claims. They do not manage auth configuration or delete accounts. No private key or refresh token is deployed.

GCP_WORKLOAD_IDENTITY_PROVIDER is the full projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/qfashion-vercel/providers/vercel resource. GCP_SERVICE_ACCOUNT_EMAIL supplies the matching service account. Google libraries exchange the deployment identity for short-lived access tokens. Identity-token verification checks revocation and verified email.

## Delivery and payments

Google billing has not been enabled by the agent. Owner chose Google Routes after activating billing. Link: https://console.cloud.google.com/billing/linkedaccount?project=qfashion-live-20261101. After that, enable routes.googleapis.com, grant the backend service identity the serviceUsageConsumer permission as needed, test a real allowed route, and set GOOGLE_ROUTES_ENABLED=true. The code supports OAuth authentication using the existing short-lived backend identity, avoiding a new Maps key. A restricted GOOGLE_MAPS_SERVER_KEY is also supported when needed.

Configure pickup address/coordinates, service pincodes and road radius through vendor operations. Estimated delivery = preparation + packaging + courier arrival + Google Routes travel/delivery + buffer. Every component is validated and snapshotted with the order. Buffer is editable in Store setup. The estimate starts after bank credit verification. Fulfillment stages require confirmed operations; countdown animations do not advance order status. No rider GPS is collected or displayed. Q Fashion may call a courier and record their name/phone without creating a courier account.

Manual UPI uses the owner-supplied recipient. MANUAL_UPI_ENABLED and MANUAL_UPI_UNTIL are independent server gates; real catalog publication and a successful route are still required before payment instructions appear. Customer-submitted references never mark an order paid. Admin must match the actual bank credit, amount and unique reference. Refund records describe transfers made externally; they do not send money. Multivendor carts remain one vendor per checkout pending settlement policy. Billing and catalog readiness must be checked before accepting real orders.

## Records and stock

Orders retain customer/address, variant/price and vendor snapshots, payment/verification metadata, ETA components including buffer, courier assignment, status history, refunds and timestamps. Admin can aggregate and export full paginated records. Normal customer and vendor responses omit unnecessary private operational information. No order-delete endpoint exists.

Unpaid reservations expire after 30 minutes. Before catalog reads, order reads or checkout, a bounded transaction sweep returns expired stock and marks the retained order cancelled/expired. It is idempotent and does not release stock after a payment reference is submitted. Expiry does not delete order history. Late transfers require support/bank review; do not pay an expired order. Timed-out claimed payments stay reserved until an administrator reviews or cancels them.

## Verification

Run npm test and npm run build. Real staging integration uses synthetic users/products/orders with no money transfers. Verified behavior includes identity checks, private profiles/addresses, last-item concurrency, reservation release without double restoration, bank verification state changes, manual courier stages, delivery proof, retained history, analytics and browser-rule denial. Browser checks cover actual signup, email action verification, password reset, login/logout, profile save, account/order navigation, admin buffer editing and narrow layouts. Synthetic order routes are injected only into the local test harness; deployed handlers always use Google Routes.

Six moderate dependency findings remain in Google SDK filesystem dependencies; no high/critical findings at this change's audit. Review these before accepting live orders. The site release does not claim payment, tax or vendor settlement policies have been approved. Configure the actual commercial terms with the owner before publishing purchasable products.
