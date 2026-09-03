/** Bill arithmetic — the rows must always sum to the amount payable. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { computeBill, billRows } from '../src/lib/pricing.js';
import { PLATFORM } from '../src/data/seedData.js';

const apparel = (price, qty = 1, mrp = price * 2) => ({ price, mrp, qty, gstRate: 5 });
const accessory = (price, qty = 1, mrp = price * 2) => ({ price, mrp, qty, gstRate: 18 });

test('platform constants match the published pricing', () => {
  assert.equal(PLATFORM.deliveryFee, 40);
  assert.equal(PLATFORM.freeDeliveryAbove, 1499);
  assert.equal(PLATFORM.platformFee, 15);
  assert.equal(PLATFORM.gstApparel, 5);
});

test('a small apparel order charges delivery, platform fee and 5% GST', () => {
  const bill = computeBill([apparel(599, 1, 1099)]);
  assert.equal(bill.itemsTotal, 599);
  assert.equal(bill.itemsMrp, 1099);
  assert.equal(bill.discount, 500);
  assert.equal(bill.deliveryFee, 40);
  assert.equal(bill.platformFee, 15);
  assert.equal(bill.gst, 30);
  assert.equal(bill.total, 599 + 40 + 15 + 30);
});

test('delivery is waived above ₹1,499 of item value', () => {
  const under = computeBill([apparel(1498)]);
  assert.equal(under.deliveryFee, 40);
  assert.equal(under.amountToFreeDelivery, 1);

  const over = computeBill([apparel(1499)]);
  assert.equal(over.deliveryFee, 0);
  assert.equal(over.freeDelivery, true);
  assert.equal(over.total, 1499 + 15 + 75);
});

test('GST is charged at the real slab per line, not one blended rate', () => {
  const bill = computeBill([apparel(1000), accessory(1000)]);
  assert.equal(bill.gst, 50 + 180);
  assert.deepEqual(bill.gstBreakdown.map((b) => [b.rate, b.amount]), [[5, 50], [18, 180]]);
  assert.match(bill.gstLabel, /5% apparel/);
  assert.equal(computeBill([apparel(1000)]).gstLabel, 'GST (5%)');
});

test('cash on delivery adds a handling charge, other modes do not', () => {
  const cod = computeBill([apparel(500)], { paymentMode: 'COD' });
  const upi = computeBill([apparel(500)], { paymentMode: 'UPI' });
  assert.equal(cod.codFee, PLATFORM.codFee);
  assert.equal(upi.codFee, 0);
  assert.equal(cod.total - upi.total, PLATFORM.codFee);
});

test('quantities multiply through every line', () => {
  const bill = computeBill([apparel(400, 3, 800)]);
  assert.equal(bill.itemCount, 3);
  assert.equal(bill.itemsTotal, 1200);
  assert.equal(bill.gst, 60);
});

test('the printed rows always sum to the amount payable', () => {
  const cases = [
    computeBill([apparel(249)]),
    computeBill([apparel(1499), accessory(799)]),
    computeBill([apparel(599, 2), accessory(349)], { paymentMode: 'COD' }),
    computeBill([apparel(2999, 1, 5999)]),
  ];
  for (const bill of cases) {
    const printed = billRows(bill)
      .filter((r) => !['mrp', 'discount', 'subtotal'].includes(r.key))
      .reduce((s, r) => s + r.value, bill.itemsTotal);
    assert.equal(printed, bill.total, `rows summed to ${printed}, total says ${bill.total}`);
  }
});

test('an empty bag has no fees at all', () => {
  const bill = computeBill([]);
  assert.equal(bill.total, 0);
  assert.equal(bill.deliveryFee, 0);
  assert.equal(bill.platformFee, 0);
  assert.equal(bill.gst, 0);
});

test('savings include the waived delivery fee', () => {
  const bill = computeBill([apparel(1600, 1, 2600)]);
  assert.equal(bill.discount, 1000);
  assert.equal(bill.savings, 1000 + PLATFORM.deliveryFee);
});
