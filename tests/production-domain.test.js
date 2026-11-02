import test from 'node:test';
import assert from 'node:assert/strict';
import { eta, upiLink, UPI_ID, paymentReference, canTransition, quoteLines, validateAddress } from '../server/domain.js';
import handler from '../api/marketplace.js';

test('UPI QR payload uses the configured recipient, exact paise and currency', () => {
  const link = new URL(upiLink({ amountPaise: 123456, reference: 'order_1' }));
  assert.equal(link.protocol, 'upi:'); assert.equal(link.searchParams.get('pa'), UPI_ID);
  assert.equal(link.searchParams.get('am'), '1234.56'); assert.equal(link.searchParams.get('cu'), 'INR');
  assert.throws(() => upiLink({ amountPaise: -1, reference: 'bad' }));
});
test('ETA is the exact sum of all five phases and rejects missing or invalid inputs', () => {
  assert.equal(eta({ prep: 10, packaging: 5, riderArrival: 8, travelDelivery: 14, buffer: 6 }).total, 43);
  assert.throws(() => eta({ prep: 10, packaging: 5, riderArrival: -1, travelDelivery: 14, buffer: 6 }));
  assert.throws(() => eta({ prep: 10, packaging: 5, travelDelivery: 14, buffer: 6 }));
});
test('a user-entered reference is validated but never proves payment', () => {
  assert.equal(paymentReference('123456789012'), '123456789012');
  for (const bad of ['', 'screenshot', '123', '1234567890123']) assert.throws(() => paymentReference(bad));
  assert.throws(() => canTransition({ status: 'paid', paymentStatus: 'awaiting_verification' }, 'accept', { role: 'admin' }));
});
test('fulfillment enforces role, vendor, assignment, payment and state', () => {
  const order = { status: 'paid', paymentStatus: 'verified', vendorId: 'v1', riderId: 'r1' };
  assert.equal(canTransition(order, 'accept', { role: 'vendor', vendorId: 'v1' }), 'accepted');
  assert.throws(() => canTransition(order, 'accept', { role: 'vendor', vendorId: 'v2' }));
  assert.throws(() => canTransition(order, 'accept', { role: 'customer' }));
  assert.throws(() => canTransition(order, 'deliver', { role: 'rider', uid: 'r1' }));
  assert.equal(canTransition({ ...order, status: 'packed' }, 'pickup', { role: 'rider', uid: 'r1' }), 'dispatched');
  assert.throws(() => canTransition({ ...order, status: 'packed' }, 'pickup', { role: 'rider', uid: 'r2' }));
  assert.throws(() => canTransition({ ...order, status: 'packed', riderId: null }, 'pickup', { role: 'admin' }));
});
test('checkout ignores client prices and rejects unavailable, duplicate and excess stock', () => {
  const variant = { vendorId: 'v1', name: 'Dress', size: 'M', color: 'Green', published: true, pricePaise: 150000, stock: 2 };
  const lines = [{ variantId: 'sku1', qty: 2, pricePaise: 1 }];
  assert.equal(quoteLines(lines, [variant])[0].pricePaise, 150000);
  assert.throws(() => quoteLines([{ ...lines[0], qty: 3 }], [variant]));
  assert.throws(() => quoteLines(lines, [{ ...variant, published: false }]));
  assert.throws(() => quoteLines([lines[0], lines[0]], [variant, variant]));
});
test('delivery address requires actual coordinates, recipient and phone', () => {
  const address = { line: 'House 1, Street 2', name: 'Customer', pincode: '500001', phone: '9177595164', lat: 17.4, lng: 78.5 };
  assert.equal(validateAddress(address).lat, 17.4);
  assert.throws(() => validateAddress({ ...address, lat: 'unknown' }));
  assert.throws(() => validateAddress({ ...address, phone: '123' }));
});
test('API refuses unconfigured infrastructure and unsupported methods', async () => {
  const response = { setHeader() {}, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
  await handler({ method: 'GET' }, response); assert.equal(response.code, 405);
  await handler({ method: 'POST', headers: {}, body: { action: 'verifyPayment' } }, response);
  assert.equal(response.code, 503); assert.equal(response.body.status, undefined);
});
