import { randomInt, createHash, timingSafeEqual } from 'node:crypto';
import { AggregateField, FieldPath } from 'firebase-admin/firestore';
import { services, authenticate } from '../server/admin.js';
import { UPI_ID, requireValue, text, integer, eta, upiLink, paymentReference, canTransition, validateAddress, quoteLines, withinDeliveryArea } from '../server/domain.js';

const id = value => { requireValue(typeof value === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(value), 'Invalid identifier'); return value; };
const hash = value => createHash('sha256').update(value).digest('hex');
const now = () => Date.now();
const admin = actor => requireValue(actor.role === 'admin', 'Administrator access required', 403);
const manualEnabled = () => requireValue(process.env.MANUAL_UPI_ENABLED === 'true' && Date.parse(process.env.MANUAL_UPI_UNTIL) > now(), 'Manual UPI checkout is paused or has expired', 503);
// All operations are authenticated and all money/stock/state writes run here.
export function createHandler({ getServices = services, authenticateUser = authenticate, estimateRoute = routeEstimate } = {}) {
return async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
  try {
    requireValue(JSON.stringify(req.body || {}).length <= 60000, 'Request too large', 413);
    const { db, auth } = getServices();
    const actor = await authenticateUser(req, auth);
    const { action, ...input } = req.body || {};
    // Fixed-window per-user rate limit, independent of browser controls.
    await db.runTransaction(async tx => {
      const ref = db.doc(`rateLimits/${actor.uid}`), snap = await tx.get(ref), old = snap.data() || {};
      const fresh = now() - (old.startedAt || 0) >= 60000;
      requireValue(fresh || old.count < 60, 'Please try again in a minute', 429);
      tx.set(ref, { startedAt: fresh ? now() : old.startedAt, count: fresh ? 1 : old.count + 1 });
    });
    if (action === 'catalog') {
      const snap = await db.collection('variants').where('published', '==', true).limit(200).get();
      // Explicit public projection: do not leak inventory or settlement metadata.
      return res.json({ variants: snap.docs.map(d => { const v = d.data(); return { id: d.id, name: v.name, vendorId: v.vendorId, size: v.size, color: v.color, pricePaise: v.pricePaise, image: v.image || null, available: v.stock > 0 }; }) });
    }
    if (action === 'catalogDrafts') {
      requireValue(['admin', 'vendor'].includes(actor.role), 'Catalog access required', 403);
      let query = db.collection('variants');
      if (actor.role === 'vendor') query = query.where('vendorId', '==', actor.vendorId || '__none__');
      const snap = await query.limit(200).get();
      return res.json({ variants: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
    }
    if (action === 'analytics') {
      admin(actor);
      const all = db.collection('orders');
      const statuses = ['awaiting_payment', 'awaiting_verification', 'paid', 'accepted', 'packed', 'dispatched', 'delivered', 'cancelled'];
      const results = await Promise.all(statuses.map(status => all.where('status', '==', status).aggregate({ count: AggregateField.count(), valuePaise: AggregateField.sum('totalPaise') }).get()));
      const paid = await all.where('paymentStatus', '==', 'verified').aggregate({ count: AggregateField.count(), valuePaise: AggregateField.sum('totalPaise') }).get();
      return res.json({ byStatus: Object.fromEntries(statuses.map((s, i) => [s, results[i].data()])), verifiedPayments: paid.data(), generatedAt: now() });
    }
    if (action === 'exportOrders') {
      admin(actor);
      let query = db.collection('orders').orderBy(FieldPath.documentId()).limit(100);
      if (input.after) query = query.startAfter(id(input.after));
      const snap = await query.get();
      return res.json({ orders: snap.docs.map(d => ({ id: d.id, ...d.data() })), after: snap.size === 100 ? snap.docs.at(-1).id : null });
    }
    if (action === 'orders') {
      let query = db.collection('orders');
      if (actor.role === 'vendor') query = query.where('vendorId', '==', actor.vendorId || '__none__');
      else if (actor.role === 'rider') query = query.where('riderId', '==', actor.uid);
      else if (actor.role !== 'admin') query = query.where('uid', '==', actor.uid);
      const snap = await query.limit(100).get();
      return res.json({ orders: snap.docs.map(d => {
        const order = { id: d.id, ...d.data() };
        if (actor.role !== 'admin') { delete order.vendorSnapshot; delete order.courier; delete order.verifiedBy; }
        if (actor.role !== 'admin' && order.uid !== actor.uid) {
          delete order.submittedReference; delete order.payee; delete order.customer;
          if (actor.role === 'vendor') delete order.address;
        }
        return order;
      }).sort((a, b) => b.createdAt - a.createdAt) });
    }
    if (action === 'resumePayment') {
      const ref = db.doc(`orders/${id(input.orderId)}`), order = (await ref.get()).data();
      requireValue(order?.uid === actor.uid, 'Order not found', 404);
      requireValue(order.status === 'awaiting_payment' && order.expiresAt > now(), 'Payment window closed; do not pay again', 409);
      manualEnabled();
      return res.json({ order: { id: ref.id, ...order }, upiUri: upiLink({ amountPaise: order.totalPaise, reference: ref.id }) });
    }
    if (action === 'checkout') {
      manualEnabled();
      const address = validateAddress(input.address), checkoutId = id(input.checkoutId);
      const lines = input.lines;
      requireValue(Array.isArray(lines) && lines.length > 0 && lines.length <= 30, 'Invalid bag');
      const refs = lines.map(l => db.doc(`variants/${id(l.variantId)}`));
      const snaps = await db.getAll(...refs);
      const items = quoteLines(lines, snaps.map(s => s.data()));
      // Mixed-vendor payment collection remains disabled until payout policy is agreed.
      const vendorIds = [...new Set(items.map(i => i.vendorId))];
      requireValue(vendorIds.length === 1, 'Please check out one vendor at a time');
      const vendor = (await db.doc(`vendors/${id(vendorIds[0])}`).get()).data();
      requireValue(vendor?.active === true && vendor.pincodes?.includes(address.pincode), 'This vendor does not deliver to that pincode');
      requireValue(withinDeliveryArea(vendor.pickup, address, vendor.radiusKm), 'Delivery pin is outside the vendor’s local delivery area');
      const timings = await estimateRoute(vendor, address);
      const result = await db.runTransaction(async tx => {
        const orderRef = db.doc(`orders/${checkoutId}`), existing = await tx.get(orderRef);
        if (existing.exists) {
          requireValue(existing.data().uid === actor.uid, 'Checkout conflict', 409);
          return { id: checkoutId, ...existing.data() };
        }
        const activeRef = db.doc(`activeCheckouts/${actor.uid}`), active = (await tx.get(activeRef)).data();
        requireValue(!active?.orderId, 'You have an open order. Resume or cancel it in My orders', 409);
        // Re-read all authoritative prices, stock and vendor config in transaction.
        const currentVendor = await tx.get(db.doc(`vendors/${vendorIds[0]}`));
        requireValue(JSON.stringify(currentVendor.data()) === JSON.stringify(vendor), 'Delivery settings changed. Try again', 409);
        const fresh = await tx.getAll(...refs), current = quoteLines(lines, fresh.map(s => s.data()));
        requireValue(JSON.stringify(current) === JSON.stringify(items), 'Prices changed. Review your bag', 409);
        const totalPaise = current.reduce((s, i) => s + i.pricePaise * i.qty, 0);
        requireValue(totalPaise <= 10000000, 'Order exceeds limit');
        const order = { uid: actor.uid, customer: { uid: actor.uid, email: actor.email || null, name: address.name, phone: address.phone }, vendorId: vendorIds[0], vendorName: text(vendor.name, 100), vendorSnapshot: vendor, items: current, address,
          totalPaise, currency: 'INR', payee: UPI_ID, paymentMethod: 'manual_upi', priceIncludesTax: true, deliveryFeePaise: 0, packagingFeePaise: 0, status: 'awaiting_payment', paymentStatus: 'pending',
          riderId: null, eta: timings, createdAt: now(), updatedAt: now(), expiresAt: now() + 30 * 60000,
          history: [{ status: 'awaiting_payment', ts: now(), actor: actor.uid }] };
        current.forEach((line, i) => tx.update(refs[i], { stock: fresh[i].data().stock - line.qty }));
        tx.create(orderRef, order);
        tx.set(activeRef, { orderId: checkoutId });
        return { id: checkoutId, ...order };
      });
      requireValue(result.status === 'awaiting_payment' && result.expiresAt > now(), 'Checkout is no longer payable', 409);
      return res.json({ order: result, upiUri: upiLink({ amountPaise: result.totalPaise, reference: checkoutId }) });
    }
    if (action === 'submitPayment') {
      const reference = paymentReference(input.reference), ref = db.doc(`orders/${id(input.orderId)}`);
      await db.runTransaction(async tx => {
        const order = (await tx.get(ref)).data();
        requireValue(order?.uid === actor.uid, 'Order not found', 404);
        requireValue(order.status === 'awaiting_payment' && order.expiresAt > now(), 'Payment window closed; contact support if you paid', 409);
        tx.update(ref, { paymentStatus: 'awaiting_verification', status: 'awaiting_verification', submittedReference: reference, submittedAt: now(), updatedAt: now(), history: [...order.history, { status: 'awaiting_verification', ts: now(), actor: actor.uid }] });
      });
      return res.json({ status: 'awaiting_verification' });
    }
    if (action === 'verifyPayment') {
      admin(actor);
      const reference = paymentReference(input.bankReference), ref = db.doc(`orders/${id(input.orderId)}`);
      requireValue(input.bankCreditConfirmed === true, 'Confirm the actual bank credit');
      const credit = db.doc(`verifiedCredits/${hash(reference)}`);
      await db.runTransaction(async tx => {
        const orderSnap = await tx.get(ref), creditSnap = await tx.get(credit), order = orderSnap.data();
        requireValue(order?.status === 'awaiting_verification', 'Order is not awaiting verification', 409);
        requireValue(reference === order.submittedReference && input.amountPaise === order.totalPaise, 'Bank amount or reference does not match', 409);
        requireValue(!creditSnap.exists, 'This bank reference has already been used', 409);
        const otp = String(randomInt(100000, 1000000));
        tx.create(credit, { orderId: ref.id, amountPaise: order.totalPaise, verifiedBy: actor.uid, verifiedAt: now() });
        tx.create(db.doc(`deliverySecrets/${ref.id}`), { otpHash: hash(otp), attempts: 0 });
        tx.create(db.doc(`customerProofs/${ref.id}`), { uid: order.uid, otp });
        tx.update(ref, { status: 'paid', paymentStatus: 'verified', verifiedBy: actor.uid, verifiedAt: now(), updatedAt: now(), history: [...order.history, { status: 'paid', ts: now(), actor: actor.uid }] });
        tx.delete(db.doc(`activeCheckouts/${order.uid}`));
      });
      return res.json({ status: 'paid' });
    }
    if (action === 'proof') {
      const proof = (await db.doc(`customerProofs/${id(input.orderId)}`).get()).data();
      requireValue(proof?.uid === actor.uid, 'Delivery code unavailable', 404);
      return res.json({ otp: proof.otp });
    }
    if (action === 'assignRider') {
      admin(actor);
      const courier = { name: text(input.name, 80), phone: text(input.phone, 20), assignedAt: now() };
      requireValue(/^[6-9][0-9]{9}$/.test(courier.phone), 'Valid courier mobile required');
      await db.runTransaction(async tx => {
        const ref = db.doc(`orders/${id(input.orderId)}`), order = (await tx.get(ref)).data();
        requireValue(order && ['paid', 'accepted', 'packed'].includes(order.status), 'Order cannot be assigned', 409);
        tx.update(ref, { riderId: 'manual_' + ref.id, courier, updatedAt: now(), history: [...order.history, { status: 'courier_called', ts: now(), actor: actor.uid }] });
      }); return res.json({ status: 'assigned' });
    }
    if (action === 'transition') {
      let failedProof = false;
      await db.runTransaction(async tx => {
        failedProof = false;
        const ref = db.doc(`orders/${id(input.orderId)}`), order = (await tx.get(ref)).data();
        requireValue(order, 'Order not found', 404);
        const status = canTransition(order, input.step, actor);
        if (input.step === 'deliver') {
          const secretRef = db.doc(`deliverySecrets/${ref.id}`), secret = (await tx.get(secretRef)).data();
          requireValue(secret && secret.attempts < 5, 'Delivery code locked; contact admin', 409);
          const actual = hash(String(input.otp || ''));
          if (!timingSafeEqual(Buffer.from(actual), Buffer.from(secret.otpHash))) {
            tx.update(secretRef, { attempts: secret.attempts + 1 }); failedProof = true; return;
          }
          tx.delete(secretRef); tx.delete(db.doc(`customerProofs/${ref.id}`));
        }
        tx.update(ref, { status, updatedAt: now(), [status + 'At']: now(), history: [...order.history, { status, ts: now(), actor: actor.uid }] });
      });
      requireValue(!failedProof, 'Incorrect delivery code', 409);
      return res.json({ status: 'updated' });
    }
    if (action === 'cancel') {
      await db.runTransaction(async tx => {
        const ref = db.doc(`orders/${id(input.orderId)}`), order = (await tx.get(ref)).data();
        requireValue(order && (order.uid === actor.uid || actor.role === 'admin'), 'Order not found', 404);
        const unpaid = ['awaiting_payment', 'awaiting_verification'].includes(order.status);
        requireValue(unpaid || (actor.role === 'admin' && ['paid', 'accepted', 'packed'].includes(order.status)), 'Contact admin to cancel this order', 409);
        const refs = order.items.map(i => db.doc(`variants/${i.variantId}`)), snaps = await tx.getAll(...refs);
        requireValue(snaps.every(s => s.exists), 'Inventory needs administrator review', 409);
        order.items.forEach((i, n) => tx.update(refs[n], { stock: snaps[n].data().stock + i.qty }));
        tx.update(ref, { status: 'cancelled', paymentStatus: order.paymentStatus !== 'pending' ? 'refund_review' : 'cancelled', cancelledAt: now(), updatedAt: now(), history: [...order.history, { status: 'cancelled', ts: now(), actor: actor.uid }] });
        if (unpaid) tx.delete(db.doc(`activeCheckouts/${order.uid}`));
        tx.delete(db.doc(`deliverySecrets/${ref.id}`));
        tx.delete(db.doc(`customerProofs/${ref.id}`));
      }); return res.json({ status: 'cancelled' });
    }
    if (action === 'saveVendor') {
      admin(actor); const v = input.vendor;
      requireValue(v && Array.isArray(v.pincodes) && v.pincodes.length <= 50 && v.pincodes.every(p => /^[1-9][0-9]{5}$/.test(p)), 'Invalid service pincodes');
      const pickup = validateAddress(v.pickup);
      const timings = { prep: integer(v.prep, 0, 120), packaging: integer(v.packaging, 0, 120), riderArrival: integer(v.riderArrival, 0, 120), buffer: integer(v.buffer, 0, 120) };
      await db.doc(`vendors/${id(v.id)}`).set({ name: text(v.name, 100), active: v.active === true, pincodes: v.pincodes, radiusKm: integer(v.radiusKm, 1, 50), pickup, ...timings, updatedAt: now() });
      return res.json({ status: 'saved' });
    }
    if (action === 'recordRefund') {
      admin(actor);
      const ref = db.doc(`orders/${id(input.orderId)}`), amountPaise = integer(input.amountPaise, 1, 10000000);
      const reference = paymentReference(input.bankReference), note = text(input.note, 500);
      await db.runTransaction(async tx => {
        const order = (await tx.get(ref)).data();
        requireValue(order, 'Order not found', 404);
        requireValue(order.paymentStatus === 'refund_review', 'Cancel the order and review payment before recording a refund', 409);
        requireValue(amountPaise <= order.totalPaise && !order.refund, 'Refund needs review', 409);
        tx.update(ref, { refund: { amountPaise, bankReference: reference, note, recordedBy: actor.uid, recordedAt: now() }, paymentStatus: amountPaise === order.totalPaise ? 'refunded' : 'partially_refunded', updatedAt: now(), history: [...order.history, { status: 'refund_recorded', ts: now(), actor: actor.uid }] });
      }); return res.json({ status: 'refund_recorded' });
    }
    if (action === 'saveVariant') {
      const v = input.variant, vendorId = id(v?.vendorId);
      requireValue(actor.role === 'admin' || (actor.role === 'vendor' && actor.vendorId === vendorId), 'Vendor access required', 403);
      const ref = db.doc(`variants/${id(v.id)}`);
      const image = v.image || '';
      requireValue(image === '' || /^https:\/\//.test(image), 'Use an HTTPS image URL'); text(image || 'none', 2000);
      await db.runTransaction(async tx => {
        const old = (await tx.get(ref)).data();
        requireValue(!old || old.vendorId === vendorId, 'Cannot move another vendor’s variant', 403);
        // Vendors submit drafts; only admin can publish or change authoritative stock.
        const record = { vendorId, name: text(v.name), size: text(v.size, 30), color: text(v.color, 30), pricePaise: integer(v.pricePaise, 100, 10000000), image,
          published: actor.role === 'admin' && v.published === true, stock: actor.role === 'admin' ? integer(v.stock, 0, 100000) : (old?.stock || 0), updatedAt: now() };
        tx.set(ref, record);
      }); return res.json({ status: 'saved' });
    }
    requireValue(false, 'Unknown action');
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ error: status === 500 ? 'The service is unavailable. Please try again.' : error.message });
  }
}
}
export default createHandler();

async function routeEstimate(vendor, address) {
  requireValue(process.env.GOOGLE_MAPS_SERVER_KEY, 'Delivery routes are not configured', 503);
  const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
    method: 'POST', signal: AbortSignal.timeout(10000),
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': process.env.GOOGLE_MAPS_SERVER_KEY, 'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters' },
    body: JSON.stringify({ origin: { location: { latLng: { latitude: vendor.pickup.lat, longitude: vendor.pickup.lng } } }, destination: { location: { latLng: { latitude: address.lat, longitude: address.lng } } }, travelMode: 'DRIVE', routingPreference: 'TRAFFIC_AWARE' }),
  });
  requireValue(response.ok, 'Could not estimate the delivery route. Try later', 503);
  const route = (await response.json()).routes?.[0], seconds = Number(route?.duration?.replace(/s$/, ''));
  requireValue(Number.isFinite(seconds) && seconds > 0, 'No delivery route found', 503);
  requireValue(Number.isFinite(route.distanceMeters) && route.distanceMeters <= vendor.radiusKm * 1000, 'Road route is outside the vendor’s delivery range', 409);
  return { ...eta({ prep: vendor.prep, packaging: vendor.packaging, riderArrival: vendor.riderArrival, travelDelivery: Math.ceil(seconds / 60), buffer: vendor.buffer }), source: 'Google Routes; rider arrival is an operations estimate', calculatedAt: now() };
}
