/**
 * Platform actions — everything that writes to shared state goes through here,
 * so there is exactly one author. `store.mutate` handles persistence: local
 * first, then mirrored to Firestore when it is configured and reachable.
 */

import { syncStore } from './sync.js';
import { buildOrders, applyTransition, nextAction } from './orders.js';
import { PRODUCTS } from '../data/seedData.js';

const store = syncStore();

export const stockOf = (productId, state = store.get()) => {
  const base = PRODUCTS.find((p) => p.id === productId);
  return state.stockOverrides[productId] ?? base?.stock ?? 0;
};

/**
 * Places a checkout. Validates the whole bag first — nothing is decremented
 * unless every line passes, so a shopper never ends up half-ordered.
 */
export function placeOrder({ lines, address, hubId, cityId, payment, customer }) {
  const state = store.get();
  const problems = [];
  for (const l of lines) {
    const have = stockOf(l.productId, state);
    if (have < l.qty) problems.push(`${l.name} — ${have === 0 ? 'just went out of stock' : `only ${have} left`}`);
  }
  if (problems.length) return { error: 'Some items are no longer available', problems };

  const orders = buildOrders({ lines, address, hubId, cityId, payment, customer });

  store.mutate((s) => {
    lines.forEach((l) => {
      s.stockOverrides[l.productId] = Math.max(0, stockOf(l.productId, s) - l.qty);
    });
    s.orders = [...orders, ...s.orders];
    return s;
  });

  return { orders, groupId: orders[0].groupId };
}

export function orderAction(orderId, action, payload) {
  const current = store.get().orders.find((o) => o.id === orderId);
  if (!current) return { error: `Order ${orderId} not found` };
  const res = applyTransition(current, action, payload);
  if (res.error) return res;

  store.mutate((s) => {
    if (action === 'cancel') {
      current.items.forEach((i) => {
        s.stockOverrides[i.productId] = stockOf(i.productId, s) + i.qty;
      });
    }
    s.orders = s.orders.map((o) => (o.id === orderId ? res.order : o));
    return s;
  });
  return { order: res.order };
}

export function advanceOrder(orderId) {
  const order = store.get().orders.find((o) => o.id === orderId);
  if (!order) return { error: 'Order not found' };
  const action = nextAction(order);
  if (!action) return { error: 'This order is already complete' };
  return orderAction(orderId, action);
}

export function setStock(productId, value) {
  store.mutate((s) => {
    s.stockOverrides[productId] = Math.max(0, Math.round(value));
    return s;
  });
}

export function addFeedback(entry) {
  const record = {
    id: 'FB' + Math.floor(1000 + Math.random() * 8999),
    ts: Date.now(),
    rating: entry.rating ?? null,
    message: entry.message || '',
    orderId: entry.orderId || null,
    topic: entry.topic || 'general',
    source: entry.source || 'stylist',
  };
  store.mutate((s) => {
    s.feedback = [record, ...s.feedback];
    return s;
  });
  return record;
}

/** "Notify me" on an out-of-stock SKU — a demand signal the store can act on. */
export function requestNotify(product) {
  const record = { id: product.id, name: product.name, storeId: product.storeId, ts: Date.now() };
  store.mutate((s) => {
    if (!s.notifyRequests.some((n) => n.id === product.id)) s.notifyRequests = [record, ...s.notifyRequests];
    return s;
  });
  return record;
}

export const resetPlatform = () => store.reset();
export { store as platformStore };
