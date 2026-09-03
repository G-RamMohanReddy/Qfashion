/**
 * Bill computation — one function, used by the bag, the checkout sheet, the
 * payment gateway and the order record, so no two of them can disagree.
 *
 *   Item total (MRP)      Σ mrp × qty
 *   Discount              MRP − selling price
 *   Item total            Σ price × qty
 *   Delivery fee          ₹40, waived at ₹1,499 of item value
 *   Platform & packaging  ₹15 flat
 *   GST                   5% on apparel, 18% on accessories (the real slabs)
 *   COD handling          ₹20, only when the customer pays cash
 *   ─────────────────────────────────────────────
 *   To pay                sum of the rows above
 *
 * Every row is rounded to the rupee BEFORE the total is summed, so the printed
 * column always adds up. There is a unit test that fails the day it stops.
 */

import { PLATFORM } from '../data/seedData.js';

const r = (n) => Math.round(n);

export function computeBill(lines = [], { paymentMode = 'UPI' } = {}) {
  const itemsMrp = r(lines.reduce((s, l) => s + (l.mrp ?? l.price) * l.qty, 0));
  const itemsTotal = r(lines.reduce((s, l) => s + l.price * l.qty, 0));
  const discount = itemsMrp - itemsTotal;
  const itemCount = lines.reduce((s, l) => s + l.qty, 0);

  const freeDelivery = itemsTotal >= PLATFORM.freeDeliveryAbove;
  const deliveryFee = itemsTotal === 0 || freeDelivery ? 0 : PLATFORM.deliveryFee;
  const platformFee = itemsTotal > 0 ? PLATFORM.platformFee : 0;

  // GST at the real slab per line, reported as one figure plus a breakdown.
  const buckets = {};
  for (const l of lines) {
    const rate = l.gstRate ?? PLATFORM.gstApparel;
    buckets[rate] = (buckets[rate] || 0) + l.price * l.qty;
  }
  const gstBreakdown = Object.entries(buckets)
    .map(([rate, base]) => ({ rate: Number(rate), base: r(base), amount: r((base * Number(rate)) / 100) }))
    .sort((a, b) => a.rate - b.rate);
  const gst = gstBreakdown.reduce((s, b) => s + b.amount, 0);

  const codFee = paymentMode === 'COD' && itemsTotal > 0 ? PLATFORM.codFee : 0;
  const total = itemsTotal + deliveryFee + platformFee + gst + codFee;

  return {
    itemCount,
    itemsMrp,
    itemsTotal,
    discount,
    discountPct: itemsMrp ? Math.round((discount / itemsMrp) * 100) : 0,
    deliveryFee,
    freeDelivery,
    amountToFreeDelivery: Math.max(0, PLATFORM.freeDeliveryAbove - itemsTotal),
    platformFee,
    gst,
    gstBreakdown,
    gstLabel: gstBreakdown.length === 1 ? `GST (${gstBreakdown[0].rate}%)` : 'GST (5% apparel · 18% accessories)',
    codFee,
    paymentMode,
    total,
    savings: discount + (freeDelivery ? PLATFORM.deliveryFee : 0),
  };
}

/** The ordered rows the bill panel renders. */
export function billRows(bill) {
  const rows = [{ key: 'mrp', label: `Item total (MRP)`, value: bill.itemsMrp }];
  if (bill.discount > 0) rows.push({ key: 'discount', label: `Discount (${bill.discountPct}%)`, value: -bill.discount, tone: 'success' });
  rows.push({ key: 'subtotal', label: 'Item total', value: bill.itemsTotal, strong: true });
  rows.push({
    key: 'delivery',
    label: 'Delivery fee',
    value: bill.deliveryFee,
    strike: bill.freeDelivery ? PLATFORM.deliveryFee : null,
    tone: bill.freeDelivery ? 'success' : undefined,
    note: bill.freeDelivery ? 'Free above ₹1,499' : null,
  });
  rows.push({ key: 'platform', label: 'Platform & packaging', value: bill.platformFee });
  rows.push({ key: 'gst', label: bill.gstLabel, value: bill.gst });
  if (bill.codFee) rows.push({ key: 'cod', label: 'Cash handling', value: bill.codFee });
  return rows;
}

export { PLATFORM };
