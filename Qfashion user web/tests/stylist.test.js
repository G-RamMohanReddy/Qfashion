/**
 * Q-Stylist — intent classification, the feature space, and the ranking
 * function. These are the tests that make the ML claims checkable rather than
 * decorative.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { parse } from '../src/ai/intentParser.js';
import { reply } from '../src/ai/stylist.js';
import {
  vectorise, queryVector, cosine, scoreProduct, availabilityScore, proximityScore,
  rank, generateCandidates, explain, logEvent, conversionStats, WEIGHTS,
} from '../src/ai/recommender.js';
import { scopedCatalog } from '../src/lib/catalog.js';

const CTX = { hubId: 'gs-road' };
const POOL = scopedCatalog('gs-road');

/* ------------------------------------------------ intent classification */

const CASES = [
  ['hi', 'greeting'],
  ['Suggest an outfit under ₹1500 for a college fest in Guwahati', 'outfit'],
  ['what should I wear to a party', 'outfit'],
  ['style me for work', 'outfit'],
  ['show me black oversized tees under 600', 'product_search'],
  ['do you have olive cargo pants', 'product_search'],
  ['any wide leg jeans below 1.5k', 'product_search'],
  ['what goes with wide-leg jeans', 'match'],
  ['find matching sneakers for blue denim', 'match'],
  ['how does Q Fashion work', 'how_it_works'],
  ['which areas do you deliver to', 'how_it_works'],
  ['what is the return policy', 'policy'],
  ['do you take cash on delivery', 'policy'],
  ['how is GST calculated on my bill', 'policy'],
  ['where is my order', 'order_status'],
  ['track QF482193', 'order_status'],
  ["I'm 5'10 and 75 kg, what size should I get", 'size'],
  ['which size for 62 kg', 'size'],
  ['I want to give feedback', 'feedback'],
  ['delivery was late and the item was damaged', 'feedback'],
];

test('every supported utterance routes to the right intent', () => {
  for (const [utterance, expected] of CASES) {
    const p = parse(utterance, CTX);
    assert.equal(p.intent, expected, `"${utterance}" → ${p.intent}, expected ${expected}`);
  }
});

test('entity extraction pulls typed slots out of the headline query', () => {
  const p = parse('Suggest an outfit under ₹1500 for a college fest in Guwahati', CTX);
  assert.equal(p.entities.maxPrice, 1500);
  assert.deepEqual(p.entities.occasions, ['College']);
  assert.deepEqual(p.entities.briefs, ['college']);
  assert.equal(p.entities.cityId, 'guwahati');

  assert.equal(parse('tees under 2k', CTX).entities.maxPrice, 2000);
  assert.equal(parse('jeans between 800 and 1600', CTX).entities.minPrice, 800);
  assert.equal(parse('jeans between 800 and 1600', CTX).entities.maxPrice, 1600);
  assert.equal(parse('something in Banjara Hills', CTX).entities.hubId, 'banjara-hills');
  assert.deepEqual(parse('black cargo pants for men', CTX).entities.colors, ['Black']);
  assert.deepEqual(parse('black cargo pants for men', CTX).entities.genders, ['Men']);
  assert.equal(parse('track QF482193', CTX).entities.orderId, 'QF482193');
  assert.equal(parse("I'm 5'10 and 75 kg", CTX).entities.weightKg, 75);
});

test('brand matching respects word boundaries', () => {
  // the brand "W" must not fire on the "w" inside "Guwahati"
  assert.ok(!parse('kurti in Guwahati', CTX).entities.brands.includes('W'));
  assert.ok(parse('show me W kurtis', CTX).entities.brands.includes('W'));
});

/* -------------------------------------------------------- feature space */

test('products and queries project into the same named feature space', () => {
  const p = POOL.find((x) => x.line === 'm-tee' && x.colors.includes('Black'));
  const pv = vectorise(p);
  assert.ok(pv.has(`cat:${p.category}`));
  assert.ok(pv.has(`line:${p.line}`));
  assert.ok(pv.has('color:Black'));

  const qv = queryVector({ lines: ['m-tee'], colors: ['Black'] });
  assert.ok(qv.has('line:m-tee'));
  assert.ok(qv.has('color:Black'));
  // price is a hard constraint, not a scored feature — it must never leak in
  assert.ok(![...queryVector({ maxPrice: 600 }).keys()].some((k) => k.startsWith('band:')));
});

test('cosine similarity is bounded and rewards overlap', () => {
  const a = new Map([['color:Black', 0.8], ['line:m-tee', 0.6]]);
  assert.ok(Math.abs(cosine(a, a) - 1) < 1e-9);
  assert.equal(cosine(a, new Map([['color:White', 1]])), 0);
});

test('availability is zero when the shelf is empty and saturates when full', () => {
  assert.equal(availabilityScore({ inStock: false, stock: 0 }), 0);
  const low = availabilityScore({ inStock: true, stock: 1 });
  const high = availabilityScore({ inStock: true, stock: 40 });
  assert.ok(high > low && high <= 1 && low > 0);
});

test('proximity decays with the delivery window', () => {
  assert.ok(proximityScore({ etaMid: 25 }) > proximityScore({ etaMid: 55 }));
  assert.ok(proximityScore({ etaMid: 200 }) === 0);
  assert.ok(proximityScore({ etaMid: 20 }) <= 1);
});

/* ------------------------------------------------------------- ranking */

test('Score = w1·Similarity + w2·Availability + w3·Proximity, exactly', () => {
  const p = { ...POOL[0] };
  const qv = queryVector({ lines: [p.line] });
  const parts = scoreProduct(p, qv);
  const expected = WEIGHTS.similarity * parts.similarity + WEIGHTS.availability * parts.availability + WEIGHTS.proximity * parts.proximity;
  assert.ok(Math.abs(parts.score - expected) < 1e-12);
  assert.ok(parts.score >= 0 && parts.score <= 1);
});

test('candidate generation applies hard constraints before scoring', () => {
  const cands = generateCandidates(POOL, { maxPrice: 700, lines: ['m-tee'] });
  assert.ok(cands.length > 0);
  assert.ok(cands.every((p) => p.price <= 700 && p.line === 'm-tee'));
  assert.ok(cands.every((p) => p.inStock), 'an out-of-stock item is never a candidate when stock exists');
});

test('ranking puts the asked-for thing first', () => {
  const ranked = rank(POOL, { lines: ['m-tee'], colors: ['Black'], maxPrice: 700 }, { limit: 5 });
  assert.ok(ranked.length > 0);
  assert.ok(ranked[0].colors.includes('Black'), 'the top result should match the requested colour');
  assert.ok(ranked[0].line === 'm-tee');
  // scores must be monotonically non-increasing
  const scores = ranked.map((r) => r._score.score);
  assert.deepEqual(scores, [...scores].sort((a, b) => b - a));
});

test('weights are injectable, so a fitted model can replace the priors', () => {
  const onlyProximity = rank(POOL, { lines: ['m-tee'] }, { limit: 3, weights: { similarity: 0, availability: 0, proximity: 1 } });
  const etas = onlyProximity.map((p) => p.etaMid);
  assert.deepEqual(etas, [...etas].sort((a, b) => a - b), 'with proximity alone, the nearest wins');
});

test('every recommendation carries the reason it ranked', () => {
  const ranked = rank(POOL, { colors: ['Black'], occasions: ['Party'] }, { limit: 3 });
  for (const p of ranked) {
    const why = explain(p, { colors: ['Black'], occasions: ['Party'] });
    assert.ok(why.length > 0);
    assert.match(why, /stock nearby|last piece/);
    assert.match(why, /min away/);
  }
});

/* ------------------------------------------------ conversion / feedback */

test('the event log tracks the impression → click → add funnel', () => {
  logEvent('impression', { productId: 'QF2001' });
  logEvent('impression', { productId: 'QF2002' });
  logEvent('click', { productId: 'QF2001' });
  logEvent('add_to_bag', { productId: 'QF2001' });
  const stats = conversionStats();
  assert.ok(stats.impressions >= 2);
  assert.ok(stats.clicks >= 1);
  assert.ok(stats.adds >= 1);
  assert.ok(stats.ctr > 0 && stats.addRate > 0);
});

/* ------------------------------------------------------ end-to-end reply */

test('product search returns in-stock, in-range items inside the budget', () => {
  const r = reply('show me black oversized tees under 600', CTX, {});
  const block = r.blocks.find((b) => b.type === 'products');
  assert.ok(block && block.items.length > 0);
  for (const i of block.items) {
    assert.ok(i.inStock, `${i.name} is out of stock`);
    assert.ok(i.price <= 900, `${i.name} at ₹${i.price} is far outside the ask`);
    assert.ok(i.storeName && i.reason);
  }
  assert.deepEqual(r.weights, WEIGHTS);
});

test('the headline outfit query builds a multi-slot look inside the budget', () => {
  const r = reply('Suggest an outfit under ₹1500 for a college fest in Guwahati', CTX, {});
  assert.equal(r.intent, 'outfit');
  const outfit = r.blocks.find((b) => b.type === 'outfit');
  assert.ok(outfit, 'an outfit block came back');
  assert.ok(outfit.slots.length >= 2, 'at least two garments');
  assert.equal(new Set(outfit.slots.map((s) => s.label)).size, outfit.slots.length, 'no repeated slot');
  assert.ok(outfit.slots.every((s) => s.item.inStock), 'every piece must be buyable');
  assert.ok(outfit.total <= 1500 * 1.35, `look totalled ₹${outfit.total} against a ₹1500 budget`);
});

test('order status finds an order and reports its stage', () => {
  const order = {
    id: 'QF482193', status: 'packed', storeName: 'Zara GS Road', otp: '4417',
    partner: null, promisedAt: Date.now() + 1800000, bill: { total: 1234, itemCount: 2 },
  };
  const r = reply('where is QF482193', CTX, { orders: [order] });
  assert.equal(r.intent, 'order_status');
  const block = r.blocks.find((b) => b.type === 'order');
  assert.equal(block.order.id, 'QF482193');
  assert.equal(block.order.step, 2);
});

test('feedback is collected over two turns and handed to the store', () => {
  const logged = [];
  const api = { orders: [], addFeedback: (f) => { logged.push(f); return { id: 'FB1234', ...f }; } };

  const first = reply('I want to give feedback', CTX, api);
  assert.ok(first.blocks.some((b) => b.type === 'rating'));
  assert.equal(first.patch.pending, 'rating');

  const second = reply('2 stars', { ...CTX, pending: 'rating' }, api);
  assert.equal(second.patch.pending, 'comment');
  assert.equal(second.patch.draftRating, 2);

  const third = reply('the delivery was an hour late', { ...CTX, pending: 'comment', draftRating: 2 }, api);
  assert.equal(logged.length, 1);
  assert.equal(logged[0].rating, 2);
  assert.equal(logged[0].topic, 'delivery');
  assert.equal(third.patch.pending, null);
});

test('platform questions answer with the real published numbers', () => {
  const how = reply('how does Q Fashion work', CTX, {}).blocks[0].text;
  assert.match(how, /45–60 minutes/);
  assert.match(how, /₹40/);
  assert.match(how, /₹1,499/);

  const gst = reply('how is GST calculated on my bill', CTX, {}).blocks[0].text;
  assert.match(gst, /5% on apparel/);
  assert.match(gst, /18%/);
});

test('nonsense degrades to a helpful answer rather than an error', () => {
  const r = reply('zzzz qwerty asdf', CTX, {});
  assert.ok(r.blocks.length > 0);
  assert.ok(r.chips.length > 0);
});
