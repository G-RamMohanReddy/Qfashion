# Q Fashion checkout pilot

Use a separate Vercel Preview branch, the Delhi staging Firebase project, and Razorpay test credentials. Keep the production storefront in browse mode until the launch checks below pass.

## Configure staging

- Set `VITE_QF_PILOT_CHECKOUT=true`, `QF_PAYMENT_PROVIDER=razorpay`, and `RAZORPAY_MODE=test` on the pilot branch only. Add `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` in Vercel Preview. Leave manual UPI off.
- In Razorpay Test Mode, subscribe to `payment.captured` at the preview’s `/api/razorpay-webhook` endpoint. Check delivery in the Razorpay dashboard. If Vercel preview protection rejects Razorpay, use a dedicated staging endpoint with signature verification and access restricted to the webhook route.
- Point both Firebase web and server configuration at `qfashion-staging-20261101`. Authorize the preview hostname in staging Firebase Auth and configure the staging service identity.
- Enable Google Routes and Geocoding on the approved billing project. Set `GOOGLE_MAPS_SERVER_KEY` for Routes or use the existing workload identity setup. Set `GOOGLE_GEOCODING_SERVER_KEY` for address search. Restrict each key to its API.
- For each shop, confirm pickup address and coordinates, eligible PIN codes, maximum road distance, prep, packaging, courier arrival and buffer. Use actual retailer-confirmed stock. The catalog uses size-specific SKU IDs as Firestore variant IDs. Stage the sale price before checkout fees, the product type, size, colour, vendor, and stock for each active variant.
- Pilot checkout accepts one shop per order. A single item is ₹100 delivery and two or more items have free delivery. The app currently estimates 5% apparel GST and uses the storefront platform fees. Confirm the tax treatment, invoice issuer, and fees before enabling live payments.

## Test and launch

1. Reproduce on Android Chrome and iPhone Safari. Sign in, reopen the site, add an item, and check a valid location and an out-of-area location. Exercise denied location permission and address search. Confirm the price and ETA before payment.
2. With disposable staging stock, test successful, failed, abandoned, duplicate, and late payments. Verify stock reservation/release and one order record per payment. Check order details, cancellation and delivery code, and a test refund with reconciliation. Use the provider dashboard to perform the refund, then verify and record its Razorpay refund ID from Fulfillment.
3. Have both retailers confirm stock, pickup hours, payout process and return handling. Check actual courier quotes on single items and low-priced two-item orders. Publish the delivery, refund, privacy and support policies after review.
4. Start with a small invited cohort in approved PIN codes and use manual courier coordination. Track checkout completion, payment failures, stock-outs, delivery against ETA, refunds and contribution per order. Expand coverage or introduce mixed-shop payment after the pilot shows reliable fulfillment and positive margins.
