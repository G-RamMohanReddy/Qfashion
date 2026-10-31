import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler } from '../api/marketplace.js';

// Transactional in-memory adapter tests API authorization and persisted effects.
// Firestore emulator tests remain a separate deployment gate.
function harness(seed = {}) {
  const rows = new Map(Object.entries(seed));
  const snapshot = ref => ({ id: ref.id, exists: rows.has(ref.path), data: () => structuredClone(rows.get(ref.path)) });
  const doc = path => ({ path, id: path.split('/').at(-1), get: async () => snapshot(doc(path)) });
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
  const handler = createHandler({ getServices: () => ({ db, auth: {} }), authenticateUser: req => req.actor,
    estimateRoute: async () => ({ total: 45, components: { prep: 10, packaging: 5, riderArrival: 10, travelDelivery: 15, buffer: 5 }, calculatedAt: Date.now() }) });
  const call = async (actor, action, data = {}) => {
    const response = { setHeader() {}, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
    await handler({ method: 'POST', headers: {}, actor, body: { action, ...data } }, response);
    return { code: response.code || 200, ...response.body };
  };
  return { rows, call };
}
const customer = { uid: 'customer1', role: 'customer', email: 'test@example.invalid' };
const administrator = { uid: 'admin1', role: 'admin' };
const address = { name: 'Test Customer', line: 'Test delivery address', phone: '9177595164', pincode: '500001', lat: 17.4, lng: 78.5 };
const vendor = { name: 'Test Vendor', active: true, pincodes: ['500001'], pickup: address, radiusKm: 10 };
const variant = { vendorId: 'vendor1', name: 'Dress', size: 'M', color: 'Green', pricePaise: 99900, stock: 2, published: true };
const data = () => ({ 'vendors/vendor1': vendor, 'variants/sku1': variant });
const order = overrides => ({ uid: customer.uid, vendorId: 'vendor1', vendorName: vendor.name, items: [{ variantId: 'sku1', qty: 1 }], totalPaise: 99900, status: 'awaiting_verification', paymentStatus: 'awaiting_verification', submittedReference: '123456789012', history: [], expiresAt: Date.now() + 60000, ...overrides });

test('checkout snapshots authoritative amounts and reserves once under retry', async () => {
  process.env.MANUAL_UPI_ENABLED = 'true'; process.env.MANUAL_UPI_UNTIL = '2099-01-01T00:00:00Z';
  const { rows, call } = harness(data());
  const payload = { checkoutId: 'checkout1', address, lines: [{ variantId: 'sku1', qty: 1, pricePaise: 1 }] };
  const first = await call(customer, 'checkout', payload), retry = await call(customer, 'checkout', payload);
  assert.equal(first.code, 200); assert.equal(retry.code, 200);
  assert.equal(first.order.totalPaise, 99900); assert.equal(first.order.paymentStatus, 'pending');
  assert.equal(rows.get('variants/sku1').stock, 1); assert.equal(rows.get('orders/checkout1').customer.email, customer.email);
  assert.equal((await call(customer, 'checkout', { ...payload, checkoutId: 'checkout2' })).code, 409);
});
test('reference submission cannot verify payment, including forged extra fields', async () => {
  const { rows, call } = harness({ 'orders/order1': order({ status: 'awaiting_payment', paymentStatus: 'pending' }) });
  assert.equal((await call({ uid: 'intruder', role: 'customer' }, 'submitPayment', { orderId: 'order1', reference: '123456789012' })).code, 404);
  assert.equal((await call(customer, 'submitPayment', { orderId: 'order1', reference: '123456789012', status: 'paid' })).code, 200);
  assert.equal(rows.get('orders/order1').status, 'awaiting_verification');
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
