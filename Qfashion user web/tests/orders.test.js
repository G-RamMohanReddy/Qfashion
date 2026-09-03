/** Order lifecycle — the guard both apps share. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { buildOrders, applyTransition, nextAction, trackerStep, STATUS, makeTxnId, makeOrderId } from '../src/lib/orders.js';
import { PRODUCTS, STORES, ADDRESSES } from '../src/data/seedData.js';

const lineFrom = (p, qty = 1) => ({
  productId: p.id, sku: p.sku, name: p.name, brand: p.brand, image: p.images.front,
  colors: p.colors, category: p.category, size: p.sizes[0], color: p.colors[0],
  qty, price: p.price, mrp: p.mrp, gstRate: p.gstRate, storeId: p.storeId,
  storeName: STORES.find((s) => s.id === p.storeId).name,
});

function makeOrder(storeIds = ['st-zara-gs']) {
  const lines = storeIds.map((sid) => lineFrom(PRODUCTS.find((p) => p.storeId === sid && p.stock > 2)));
  return buildOrders({
    lines,
    address: ADDRESSES[0],
    hubId: 'gs-road',
    cityId: 'guwahati',
    payment: { mode: 'UPI', status: 'captured', txnId: makeTxnId() },
    customer: { name: 'Test Buyer', phone: '+91 90000 00000' },
  });
}

test('identifiers follow the published formats', () => {
  assert.match(makeOrderId(), /^QF\d{6}$/);
  assert.match(makeTxnId(), /^TXN_QF_\d{5}$/);
});

test('an order carries everything both apps need', () => {
  const [o] = makeOrder();
  assert.match(o.otp, /^\d{4}$/);
  assert.match(o.awb, /^QFX\d{8}$/);
  assert.equal(o.status, 'placed');
  assert.ok(o.bill.total > 0);
  assert.ok(o.eta.min > 0 && o.eta.max > o.eta.min);
  assert.ok(o.promisedAt > Date.now());
  assert.equal(o.history.length, 1);
  assert.ok(o.storeName && o.hubName && o.customer.name);
});

test('a bag spanning two stores splits into two linked orders', () => {
  const orders = makeOrder(['st-zara-gs', 'st-max-zoo']);
  assert.equal(orders.length, 2);
  assert.equal(orders[0].groupId, orders[1].groupId);
  assert.notEqual(orders[0].storeId, orders[1].storeId);
});

test('the happy path walks placed → delivered', () => {
  let [o] = makeOrder();
  for (const action of ['accept', 'mark_packed', 'dispatch']) {
    const res = applyTransition(o, action);
    assert.ok(!res.error, `${action}: ${res.error}`);
    o = res.order;
  }
  assert.equal(o.status, 'dispatched');
  assert.ok(o.boxId, 'a pack box was assigned');
  assert.ok(o.partner?.name, 'a delivery partner was attached');

  o = applyTransition(o, 'deliver').order;
  assert.equal(o.status, 'delivered');
  assert.equal(typeof o.actualMins, 'number');
  assert.equal(trackerStep(o), 4);
});

test('out-of-order transitions are refused with a readable reason', () => {
  const [o] = makeOrder();
  const res = applyTransition(o, 'dispatch');
  assert.ok(res.error);
  assert.match(res.error, /Order placed/);
  assert.ok(applyTransition(o, 'deliver').error);
  assert.ok(applyTransition(o, 'not_a_real_action').error);
});

test('the five-stage customer tracker maps onto the internal statuses', () => {
  let [o] = makeOrder();
  assert.equal(trackerStep(o), 0);
  o = applyTransition(o, 'accept').order;
  assert.equal(trackerStep(o), 1);
  o = applyTransition(o, 'mark_packed').order;
  assert.equal(trackerStep(o), 2);
  o = applyTransition(o, 'dispatch').order;
  assert.equal(trackerStep(o), 3);
  assert.equal(STATUS[o.status].step, 3);
});

test('nextAction drives the whole flow without a dead end', () => {
  let [o] = makeOrder();
  let guard = 0;
  while (o.status !== 'delivered' && guard++ < 10) {
    const action = nextAction(o);
    assert.ok(action, `stuck at ${o.status}`);
    o = applyTransition(o, action).order;
  }
  assert.equal(o.status, 'delivered');
  assert.equal(nextAction(o), null);
});

test('cancelling records a reason and is refused once dispatched', () => {
  let [o] = makeOrder();
  const cancelled = applyTransition(o, 'cancel', { reason: 'Out of stock on the floor' }).order;
  assert.equal(cancelled.status, 'cancelled');
  assert.equal(cancelled.cancelReason, 'Out of stock on the floor');

  o = applyTransition(o, 'accept').order;
  o = applyTransition(o, 'mark_packed').order;
  o = applyTransition(o, 'dispatch').order;
  assert.ok(applyTransition(o, 'cancel').error, 'cannot cancel once it has left the store');
});

test('COD is marked collected only on delivery', () => {
  const lines = [lineFrom(PRODUCTS.find((p) => p.storeId === 'st-zara-gs' && p.stock > 2))];
  let [o] = buildOrders({
    lines, address: ADDRESSES[0], hubId: 'gs-road', cityId: 'guwahati',
    payment: { mode: 'COD', status: 'pending' }, customer: { name: 'T', phone: '+91 90000 00000' },
  });
  assert.equal(o.payment.status, 'pending');
  for (const a of ['accept', 'mark_packed', 'dispatch', 'deliver']) o = applyTransition(o, a).order;
  assert.equal(o.payment.status, 'collected');
});

test('the history is appended on every step, never replaced', () => {
  let [o] = makeOrder();
  const steps = ['accept', 'mark_packed', 'dispatch', 'deliver'];
  for (const a of steps) o = applyTransition(o, a).order;
  assert.equal(o.history.length, steps.length + 1);
  assert.ok(o.history.every((h) => h.ts && h.note));
});
