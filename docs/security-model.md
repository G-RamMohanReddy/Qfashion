# Staging data and access model

The browser does not write orders, money, roles or stock directly. Every API action verifies a Firebase ID token and email verification; privileged roles come exclusively from server-set custom claims. Roles are customer, vendor (one vendorId), rider and admin. API credentials bypass Firestore rules and therefore all API authorization and validation must also be tested.

Private collections: orders (uid, vendorId, riderId, address map, integer totalPaise, status, paymentStatus, items list, timestamps in epoch milliseconds, history), deliverySecrets (hashed OTP, attempts), customerProofs (uid, plaintext customer delivery code), verifiedCredits (unique bank reference hash), rateLimits and activeCheckouts. Browser access to all is denied. Role-scoped reads go through the API with explicit projections. No legacy query in sync.js remains active.

Catalog: variants/{id} has vendorId, name, size, color, pricePaise, available stock, published, image, updatedAt. vendors/{id} has name, active, pincodes, private pickup contact/coordinates and prep/packaging/riderArrival/buffer minutes. All writes use server validators. Only admin can publish and set stock. Vendor editing unpublishes its draft pending approval. Published catalog endpoint returns only display fields. No WhatsApp records are imported automatically.

Firestore rules intentionally deny all browser reads and writes. Since there are no client create/update permissions, client schema validators are not applicable. This API-only design avoids field-level exposure of mixed private/public records. User identity is managed by Firebase Authentication, not writable profile role fields.

Manual bank verification is an administrator attestation, not an automated bank integration. Reference submission never marks payment received. A unique verified bank reference prevents duplicate fulfillment. Fulfillment requires verified payment, an approved assigned rider for pickup, and a server-verified delivery code for completion.

Review and run emulator/API integration tests before sharing the app. Do not deploy these changes over the existing production Firebase project.
