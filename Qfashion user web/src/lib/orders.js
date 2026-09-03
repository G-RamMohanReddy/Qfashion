/**
 * Order model and lifecycle.
 *
 * One guarded transition funnel. Every status change in the app goes
 * through `applyTransition`, so neither can put an order into a state the other
 * does not understand.
 */

import { STORES, HUBS, PLATFORM } from '../data/seedData.js';
import { computeBill } from './pricing.js';
import { distanceKm, deliveryWindow } from './geo.js';

export const STATUS = {
  placed: { label: 'Order placed', step: 0, tone: 'speed' },
  accepted: { label: 'Confirmed by store', step: 1, tone: 'info' },
  packing: { label: 'Packing', step: 1, tone: 'info' },
  packed: { label: 'Packed & ready', step: 2, tone: 'info' },
  dispatched: { label: 'Out for delivery', step: 3, tone: 'success' },
  delivered: { label: 'Delivered', step: 4, tone: 'success' },
  cancelled: { label: 'Cancelled', step: -1, tone: 'danger' },
};

/** The five stages the customer sees on the tracker. */
export const TRACKER_STEPS = [
  { key: 'placed', label: 'Placed', hint: 'Sent to the store' },
  { key: 'confirmed', label: 'Confirmed', hint: 'Store accepted your order' },
  { key: 'packed', label: 'Packed', hint: 'Your size is bagged and sealed' },
  { key: 'transit', label: 'Out for delivery', hint: 'On the way to you' },
  { key: 'delivered', label: 'Delivered', hint: `${PLATFORM.returnWindow} to return` },
];

export const TRANSITIONS = {
  accept: { from: ['placed'], to: 'accepted' },
  start_packing: { from: ['accepted'], to: 'packing' },
  mark_packed: { from: ['accepted', 'packing'], to: 'packed' },
  dispatch: { from: ['packed'], to: 'dispatched' },
  deliver: { from: ['dispatched'], to: 'delivered' },
  cancel: { from: ['placed', 'accepted', 'packing', 'packed'], to: 'cancelled' },
};

const rnd = (n) => Math.floor(Math.random() * n);

export const makeOrderId = () => 'QF' + (100000 + rnd(899999));
export const makeTxnId = () => `TXN_QF_${10000 + rnd(89999)}`;
export const makeOtp = () => String(1000 + rnd(8999));
export const makeAwb = () => 'QFX' + (10000000 + rnd(89999999));
export const makeBoxId = () => 'BOX-' + 'ABCDEFGH'[rnd(8)] + (10 + rnd(89));

/** Delivery partners the store hands the bag to. */
const PARTNERS = [
  { name: 'Bikash Sharma', vehicle: 'Honda Activa · AS-01 BX 4471', phone: '+91 98640 55501' },
  { name: 'Jitu Boro', vehicle: 'TVS Jupiter · AS-01 CE 9920', phone: '+91 98640 55502' },
  { name: 'Md. Arif', vehicle: 'Ola S1 · TS-09 EZ 3312', phone: '+91 90000 55503' },
  { name: 'Praveen Goud', vehicle: 'Bajaj Pulsar · TS-07 FA 1188', phone: '+91 90000 55504' },
];

export const trackerStep = (order) => Math.max(0, STATUS[order.status].step);

/**
 * Builds the order records for a checkout.
 *
 * A bag spanning two partner stores becomes two orders sharing a `groupId` —
 * each store packs and dispatches its own bag, which is how hyperlocal
 * fulfilment actually works, and it is what puts a separate ticket on each
 * store's dashboard.
 */
export function buildOrders({ lines, address, hubId, cityId, payment, customer }) {
  const groupId = 'GRP' + (1000 + rnd(8999));
  const byStore = new Map();
  lines.forEach((l) => {
    if (!byStore.has(l.storeId)) byStore.set(l.storeId, []);
    byStore.get(l.storeId).push(l);
  });

  const now = Date.now();
  const hub = HUBS.find((h) => h.id === hubId);

  return [...byStore.entries()].map(([storeId, storeLines]) => {
    const store = STORES.find((s) => s.id === storeId);
    const km = distanceKm(hub, store);
    const w = deliveryWindow({ prepMins: store.prepMins, km });
    const bill = computeBill(storeLines, { paymentMode: payment.mode });

    return {
      id: makeOrderId(),
      groupId,
      awb: makeAwb(),
      createdAt: now,
      updatedAt: now,
      cityId,
      hubId,
      hubName: hub?.name,
      storeId,
      storeName: store.name,
      storeAddress: store.address,
      storePhone: store.phone,
      storeGstin: store.gstin,
      customer,
      address,
      items: storeLines,
      bill,
      payment,
      km,
      eta: w,
      promisedAt: now + w.max * 60000,
      status: 'placed',
      history: [{ status: 'placed', ts: now, note: 'Order received' }],
      otp: makeOtp(),
      boxId: null,
      partner: null,
      deliveredAt: null,
    };
  });
}

/** The single guarded transition. Returns { order } or { error }. */
export function applyTransition(order, action, payload = {}) {
  const rule = TRANSITIONS[action];
  if (!rule) return { error: `Unknown action "${action}"` };
  if (!rule.from.includes(order.status)) {
    return { error: `Cannot ${action.replace(/_/g, ' ')} while the order is "${STATUS[order.status].label}"` };
  }

  const next = { ...order, status: rule.to, updatedAt: Date.now() };
  let note = payload.note || STATUS[rule.to].label;

  if (action === 'mark_packed') {
    next.boxId = order.boxId || payload.boxId || makeBoxId();
    note = `Packed into ${next.boxId}`;
  }
  if (action === 'dispatch') {
    const partner = payload.partner || PARTNERS[rnd(PARTNERS.length)];
    next.partner = partner;
    note = `Handed to ${partner.name}`;
  }
  if (action === 'deliver') {
    next.deliveredAt = Date.now();
    next.actualMins = Math.round((next.deliveredAt - order.createdAt) / 60000);
    if (next.payment.mode === 'COD') next.payment = { ...next.payment, status: 'collected' };
    note = 'Delivered · OTP verified';
  }
  if (action === 'cancel') {
    next.cancelReason = payload.reason || 'Cancelled';
    note = next.cancelReason;
  }

  next.history = [...order.history, { status: next.status, ts: next.updatedAt, note }];
  return { order: next };
}

/** Next legal step — powers the storefront's "simulate store" control. */
export function nextAction(order) {
  return { placed: 'accept', accepted: 'mark_packed', packing: 'mark_packed', packed: 'dispatch', dispatched: 'deliver' }[order.status] || null;
}

export { PARTNERS };
