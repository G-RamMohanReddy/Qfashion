import { createHmac } from 'node:crypto';
import webhook from '../api/razorpay-webhook.js';
import { recordCapturedPayment } from '../server/razorpay.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler } from '../api/marketplace.js';

// Transactional in-memory adapter tests API authorization and persisted effects.
// Firestore emulator tests remain a separate deployment gate.
function harness(seed = {}) {
  const rows = new Map(Object.entries(seed));
  const snapshot = ref => ({ id: ref.id, exists: rows.has(ref.path), data: () => structuredClone(rows.get(ref.path)) });
  const doc = path => ({ path, id: path.split('/').at(-1), get: async () => snapshot(doc(path)), set: async (data, options) => rows.set(path, options?.merge ? { ...rows.get(path), ...structuredClone(data) } : structuredClone(data)) });
  const db = {
    doc, getAll: async (...refs) => refs.map(snapshot),
    async runTransaction(fn) {
      const writes = []; let writing = false;
      const tx = { get: async ref => { assert.equal(writing, false, 'Firestore reads must precede all writes'); return snapshot(ref); },
        getAll: async (...refs) => { assert.equal(writing, false); return refs.map(snapshot); },
        set(ref, data) { writing = true; writes.push(() => rows.set(ref.path, structuredClone(data))); },
        create(ref, data) { writing = true; assert.equal(rows.has(ref.path), false); writes.push(() => rows.set(ref.path, structuredClone(data))); },
        update(ref, data) { writing = true; writes.push(() => rows.set(ref.path, { ...rows.get(ref.path), ...structuredClone(data) })); },
        delete(ref) { writing = true; writes.push(() => rows.delete(ref.path)); },
      };
      const result = await fn(tx); writes.forEach(write => write()); return result;
    },
  };
  const handler = createHandler({ expireReservations: async () => {}, getServices: () => ({ db, auth: {} }), authenticateUser: req => req.actor,
    estimateRoute: async () => ({ total: 45, components: { prep: 10, packaging: 5, riderArrival: 10, travelDelivery: 15, buffer: 5 }, calculatedAt: Date.now() }) });
  const call = async (actor, action, data = {}) => {
    const response = { setHeader() {}, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
    await handler({ method: 'POST', headers: {}, actor, body: { action, ...data } }, response);
    return { code: response.code || 200, ...response.body };
  };
  return { rows, call, db };
}
const customer = { uid: 'customer1', role: 'customer', email: 'test@example.invalid' };
const administrator = { uid: 'admin1', role: 'admin' };
const address = { name: 'Test Customer', line: 'Test delivery address', phone: '9177595164', pincode: '500001', lat: 17.4, lng: 78.5 };
const vendor = { name: 'Test Vendor', deliveryFeePaise: 3500, active: true, pincodes: ['500001'], pickup: address, radiusKm: 10 };
const variant = { vendorId: 'vendor1', name: 'Dress', size: 'M', color: 'Green', pricePaise: 99900, stock: 2, published: true };
const data = () => ({ 'vendors/vendor1': vendor, 'variants/sku1': variant });
const order = overrides => ({ uid: customer.uid, vendorId: 'vendor1', vendorName: vendor.name, items: [{ variantId: 'sku1', qty: 1 }], totalPaise: 99900, status: 'awaiting_verification', paymentStatus: 'awaiting_verification', submittedReference: '123456789012', history: [], expiresAt: Date.now() + 60000, ...overrides });

test('checkout snapshots authoritative amounts and reserves once under retry', async () => {
  process.env.MANUAL_UPI_ENABLED = 'true'; process.env.MANUAL_UPI_UNTIL = '2099-01-01T00:00:00Z';
  const { rows, call } = harness(data());
  const payload = { checkoutId: 'checkout1', address, lines: [{ variantId: 'sku1', qty: 1, pricePaise: 1 }] };
  const first = await call(customer, 'checkout', payload), retry = await call(customer, 'checkout', payload);
  assert.equal(first.code, 200); assert.equal(retry.code, 200);
  assert.equal(first.order.deliveryFeePaise, 3500); assert.equal(first.order.totalPaise, 103400); assert.equal(Number(new URL(first.upiUri).searchParams.get('am')), 1034); assert.equal(first.order.paymentStatus, 'pending');
  assert.equal(rows.get('variants/sku1').stock, 1); assert.equal(rows.get('orders/checkout1').customer.email, customer.email);
  assert.equal((await call(customer, 'checkout', { ...payload, checkoutId: 'checkout2' })).code, 409);
});
test('reference submission cannot verify payment, including forged extra fields', async () => {
  const { rows, call } = harness({ 'orders/order1': order({ status: 'awaiting_payment', paymentStatus: 'pending' }) });
  assert.equal((await call({ uid: 'intruder', role: 'customer' }, 'submitPayment', { orderId: 'order1', reference: '123456789012' })).code, 404);
  assert.equal((await call(customer, 'submitPayment', { orderId: 'order1', reference: '123456789012', status: 'paid' })).code, 200);
  assert.equal(rows.get('orders/order1').status, 'awaiting_verification');
  assert.ok(rows.get('orders/order1').submittedAt);
  assert.equal(rows.get('orders/order1').history.at(-1).status, 'awaiting_verification');
  assert.equal((await call(customer, 'verifyPayment', { orderId: 'order1' })).code, 403);
});
test('bank verification requires matching credit, and refuses reference reuse', async () => {
  const { rows, call } = harness({ 'orders/order1': order({}), 'orders/order2': order({ uid: 'customer2' }) });
  const credit = { orderId: 'order1', bankReference: '123456789012', amountPaise: 99900, bankCreditConfirmed: true };
  assert.equal((await call(administrator, 'verifyPayment', { ...credit, amountPaise: 1 })).code, 409);
  assert.equal((await call(administrator, 'verifyPayment', credit)).code, 200);
  assert.equal(rows.get('orders/order1').status, 'paid');
  assert.ok(rows.get('deliverySecrets/order1').otpHash);
  assert.equal(rows.get('orders/order1').otp, undefined);
  assert.equal((await call(administrator, 'verifyPayment', { ...credit, orderId: 'order2' })).code, 409);
});
test('cancellation retains order and restores stock once', async () => {
  const { rows, call } = harness({ ...data(), 'orders/order1': order({}) });
  assert.equal((await call(customer, 'cancel', { orderId: 'order1' })).code, 200);
  assert.equal(rows.get('variants/sku1').stock, 3);
  assert.equal(rows.get('orders/order1').paymentStatus, 'refund_review');
  assert.equal((await call(customer, 'cancel', { orderId: 'order1' })).code, 409);
  assert.equal(rows.get('variants/sku1').stock, 3);
});
test('manual courier needs no app account; delivery still needs correct customer code', async () => {
  const { rows, call } = harness({ 'orders/order1': order({ status: 'paid', paymentStatus: 'verified' }) });
  assert.equal((await call(administrator, 'assignRider', { orderId: 'order1', name: 'Test Courier', phone: '9177595164' })).code, 200);
  assert.equal(rows.get('orders/order1').courier.name, 'Test Courier');
  assert.equal((await call(customer, 'transition', { orderId: 'order1', step: 'accept' })).code, 403);
  assert.equal((await call(administrator, 'transition', { orderId: 'order1', step: 'accept' })).code, 200);
  assert.equal((await call(administrator, 'transition', { orderId: 'order1', step: 'pack' })).code, 200);
  assert.equal((await call(administrator, 'transition', { orderId: 'order1', step: 'pickup' })).code, 200);
  assert.equal(rows.get('orders/order1').status, 'dispatched');
  assert.equal((await call(administrator, 'transition', { orderId: 'order1', step: 'deliver', otp: '000000' })).code, 409);
});
test('vendor cannot publish, adjust stock, or take over another vendor record', async () => {
  const { rows, call } = harness(data());
  const actor = { uid: 'vendor_user', role: 'vendor', vendorId: 'vendor1' };
  const record = { id: 'sku1', ...variant, stock: 100, published: true };
  assert.equal((await call(actor, 'saveVariant', { variant: record })).code, 200);
  assert.equal(rows.get('variants/sku1').stock, 2); assert.equal(rows.get('variants/sku1').published, false);
  assert.equal((await call({ ...actor, vendorId: 'vendor2' }, 'saveVariant', { variant: record })).code, 403);
});
test('delivery proof attempts persist and the valid code completes a retained order', async () => {
  const { rows, call } = harness({ 'orders/order1': order({}) });
  await call(administrator, 'verifyPayment', { orderId: 'order1', bankReference: '123456789012', amountPaise: 99900, bankCreditConfirmed: true });
  await call(administrator, 'assignRider', { orderId: 'order1', name: 'Test Courier', phone: '9177595164' });
  for (const step of ['accept', 'pack', 'pickup']) assert.equal((await call(administrator, 'transition', { orderId: 'order1', step })).code, 200);
  assert.equal((await call({ uid: 'other', role: 'customer' }, 'proof', { orderId: 'order1' })).code, 404);
  const proof = await call(customer, 'proof', { orderId: 'order1' });
  assert.equal((await call(administrator, 'transition', { orderId: 'order1', step: 'deliver', otp: 'wrong' })).code, 409);
  assert.equal(rows.get('deliverySecrets/order1').attempts, 1);
  assert.equal((await call(administrator, 'transition', { orderId: 'order1', step: 'deliver', otp: proof.otp })).code, 200);
  assert.equal(rows.get('orders/order1').status, 'delivered'); assert.ok(rows.get('orders/order1').deliveredAt);
  assert.equal(rows.has('deliverySecrets/order1'), false); assert.equal(rows.has('customerProofs/order1'), false);
});
test('paid cancellation cannot clear a different active checkout and preserves refund review', async () => {
  const { rows, call } = harness({ ...data(), 'orders/order1': order({ status: 'paid', paymentStatus: 'verified' }), 'activeCheckouts/customer1': { orderId: 'new-order' } });
  assert.equal((await call(customer, 'cancel', { orderId: 'order1' })).code, 409);
  assert.equal((await call(administrator, 'cancel', { orderId: 'order1' })).code, 200);
  assert.equal(rows.get('activeCheckouts/customer1').orderId, 'new-order');
  assert.equal(rows.get('orders/order1').paymentStatus, 'refund_review');
});

test('profile writes cannot choose a role or another customer document', async () => {
  const { rows, call } = harness();
  assert.equal((await call(customer, 'profile')).role, 'customer');
  assert.equal((await call(customer, 'saveProfile', { name: 'My name', phone: '9000000000', role: 'admin', uid: 'victim' })).code, 200);
  assert.equal(rows.get('customers/customer1').name, 'My name');
  assert.equal(rows.get('customers/customer1').role, undefined);
  assert.equal(rows.has('customers/victim'), false);
});
test('saved addresses stay scoped to the caller and cannot exceed five', async () => {
  const { rows, call } = harness();
  for (let i = 0; i < 5; i++) assert.equal((await call(customer, 'saveAddress', { addressId: 'address' + i, address })).code, 200);
  assert.equal((await call(customer, 'saveAddress', { addressId: 'address6', address })).code, 400);
  const other = { uid: 'other', role: 'customer', email: 'other@example.invalid' };
  await call(other, 'deleteAddress', { addressId: 'address0', uid: customer.uid });
  assert.equal(rows.get('customers/customer1').addresses.length, 5);
  assert.equal((await call(customer, 'deleteAddress', { addressId: 'address0' })).code, 200);
  assert.equal(rows.get('customers/customer1').addresses.length, 4);
});

test('Razorpay pilot quotes real prices before stock reservation and handles retries and late capture', async t => {
  const config = { QF_PAYMENT_PROVIDER: 'razorpay', RAZORPAY_MODE: 'test', VERCEL_ENV: 'preview',
    FIREBASE_PROJECT_ID: 'qfashion-staging-20261101', RAZORPAY_KEY_ID: 'rzp_test_mock', RAZORPAY_KEY_SECRET: 'mock-secret', RAZORPAY_WEBHOOK_SECRET: 'mock-webhook' };
  for (const [key, value] of Object.entries(config)) {
    const old = process.env[key];
    process.env[key] = value;
    t.after(() => { if (old === undefined) delete process.env[key]; else process.env[key] = old; });
  }
  const { rows, call, db } = harness({ ...data(), 'variants/sku1': { ...variant, productType: 'Oversized tees' },
    'variants/sku2': { ...variant, vendorId: 'vendor2' } });
  const lines = [{ variantId: 'sku1', qty: 2 }];
  const request = { address, lines };
  const quote = await call(customer, 'deliveryQuote', request);
  assert.equal(quote.code, 200);
  assert.equal(quote.deliveryFeePaise, 0);
  assert.equal(quote.apparelTaxPaise, 9990);
  assert.equal(quote.platformFeePaise, 4500);
  assert.equal(quote.eta.components.buffer, 5);
  assert.equal(rows.get('variants/sku1').stock, 2);
  assert.equal((await call(customer, 'deliveryQuote', { address: { ...address, pincode: '781039' }, lines })).code, 400);
  assert.equal((await call(customer, 'deliveryQuote', { address, lines: [...lines, { variantId: 'sku2', qty: 1 }] })).code, 400);
  assert.equal((await call(customer, 'checkout', { ...request, checkoutId: 'pilot1', quoteKey: 'incorrect' })).code, 409);
  let created = 0;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    if (url.endsWith('/orders')) {
      created++;
      return Response.json({ id: 'order_TEST1', amount: JSON.parse(options.body).amount, currency: 'INR' });
    }
    if (url.endsWith('/refunds/rfnd_TEST1')) return Response.json({ id: 'rfnd_TEST1', payment_id: 'pay_LATE',
      amount: quote.totalPaise, currency: 'INR', status: 'processed' });
    assert.match(url, /payments\/pay_TEST1$/);
    return Response.json({ id: 'pay_TEST1', order_id: 'order_TEST1', amount: quote.totalPaise,
      currency: 'INR', status: 'captured', captured: true });
  });
  const checkout = { ...request, checkoutId: 'pilot1', quoteKey: quote.quoteKey };
  assert.equal((await call(customer, 'checkout', checkout)).razorpay.orderId, 'order_TEST1');
  assert.equal((await call(customer, 'checkout', checkout)).razorpay.orderId, 'order_TEST1');
  assert.equal(created, 1);
  assert.equal(rows.get('variants/sku1').stock, 0);
  const proof = { orderId: 'pilot1', razorpay_order_id: 'order_TEST1', razorpay_payment_id: 'pay_TEST1' };
  assert.equal((await call(customer, 'confirmRazorpay', { ...proof, razorpay_signature: '0'.repeat(64) })).code, 400);
  assert.equal(rows.get('orders/pilot1').paymentStatus, 'pending');
  const signature = createHmac('sha256', config.RAZORPAY_KEY_SECRET).update('order_TEST1|pay_TEST1').digest('hex');
  assert.equal((await call(customer, 'confirmRazorpay', { ...proof, razorpay_signature: signature })).status, 'paid');
  assert.equal((await call(customer, 'confirmRazorpay', { ...proof, razorpay_signature: signature })).status, 'paid');
  assert.equal(rows.get('orders/pilot1').history.filter(entry => entry.status === 'paid').length, 1);
  assert.equal(rows.has('activeCheckouts/' + customer.uid), false);
  assert.equal((await webhook.fetch(new Request('https://example.invalid', { method: 'POST', body: '{}',
    headers: { 'x-razorpay-signature': '0'.repeat(64) } }))).status, 400);
  rows.set('orders/late1', { ...rows.get('orders/pilot1'), gatewayOrderId: 'order_LATE',
    gatewayPaymentId: null, status: 'cancelled', paymentStatus: 'expired' });
  rows.set('gatewayOrders/order_LATE', { orderId: 'late1', mode: 'test' });
  await recordCapturedPayment(db, { id: 'pay_LATE', order_id: 'order_LATE', amount: quote.totalPaise,
    currency: 'INR', status: 'captured', captured: true }, 'test');
  assert.equal(rows.get('orders/late1').paymentStatus, 'refund_review');
  assert.equal(rows.get('orders/late1').status, 'cancelled');
  const refund = { orderId: 'late1', refundId: 'rfnd_TEST1', note: 'Late test capture' };
  assert.equal((await call(customer, 'recordGatewayRefund', refund)).code, 403);
  assert.equal((await call(administrator, 'recordGatewayRefund', refund)).status, 'refund_recorded');
  assert.equal(rows.get('orders/late1').paymentStatus, 'refunded');
  assert.equal((await call(administrator, 'recordGatewayRefund', refund)).code, 409);
});
