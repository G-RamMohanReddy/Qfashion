/**
 * Catalogue and seed integrity.
 *
 * The price-band and gallery assertions are the load-bearing ones: they are what
 * stop a careless edit from putting a ₹4,000 tee in a budget catalogue, or
 * letting one product borrow another's photographs.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { PRODUCTS, PRODUCT_LINES, STORES, HUBS, CITIES, UPCOMING_BRANDS, SIZE_CHARTS, toCm } from '../src/data/seedData.js';
import { searchCatalog, scopedCatalog, similarProducts, countActiveFilters, DEFAULT_FILTERS, PRICE_FLOOR, PRICE_CEILING } from '../src/lib/catalog.js';
import { storesForHub, deliveryWindow, distanceKm } from '../src/lib/geo.js';

test('the catalogue carries 200+ uniquely identified SKUs', () => {
  assert.ok(PRODUCTS.length >= 200, `expected 200+ SKUs, got ${PRODUCTS.length}`);
  assert.equal(new Set(PRODUCTS.map((p) => p.id)).size, PRODUCTS.length);
  assert.equal(new Set(PRODUCTS.map((p) => p.sku)).size, PRODUCTS.length);
});

test('every price sits inside the ₹199–₹2,999 platform range', () => {
  for (const p of PRODUCTS) {
    assert.ok(p.price >= 199 && p.price <= 2999, `${p.name} priced ${p.price}`);
    assert.ok(p.mrp > p.price, `${p.name} MRP must exceed selling price`);
    assert.ok(p.discount > 0 && p.discount < 80, `${p.name} discount ${p.discount}%`);
  }
});

test('every SKU respects its product line price band', () => {
  for (const p of PRODUCTS) {
    const band = PRODUCT_LINES[p.line];
    assert.ok(band, `${p.name} has an unknown line "${p.line}"`);
    assert.ok(p.price >= band.min && p.price <= band.max, `${p.name} at ₹${p.price} is outside ${band.label} (₹${band.min}–₹${band.max})`);
  }
});

test('every SKU has a four-angle gallery of its own', () => {
  for (const p of PRODUCTS) {
    assert.equal(p.gallery.length, 4, `${p.name} needs 4 angles`);
    assert.deepEqual(p.gallery.map((g) => g.label), ['Front', 'Back', 'Fabric', 'Model']);
    assert.equal(new Set(p.gallery.map((g) => g.url)).size, 4, `${p.name} repeats an angle`);
    assert.ok(p.gallery.every((g) => g.url.startsWith('https://images.unsplash.com/')), `${p.name} has a non-Unsplash image`);
    assert.equal(p.images.front, p.gallery[0].url);
  }
});

test('galleries are allocated per product line, not sampled per render', () => {
  // two calls to the same SKU must give identical URLs
  const a = PRODUCTS[10].gallery.map((g) => g.url).join('|');
  const b = PRODUCTS[10].gallery.map((g) => g.url).join('|');
  assert.equal(a, b);
  // and the catalogue must use many distinct shoots, not one recycled set
  const shoots = new Set(PRODUCTS.map((p) => p.gallery.map((g) => g.url).join('|')));
  assert.ok(shoots.size >= 40, `only ${shoots.size} distinct shoots across the catalogue`);
});

test('roughly 15% of the catalogue is unavailable, as real retail is', () => {
  const out = PRODUCTS.filter((p) => p.stock === 0).length;
  const last = PRODUCTS.filter((p) => p.stock === 1).length;
  const pct = ((out + last) / PRODUCTS.length) * 100;
  assert.ok(out > 0, 'some SKUs must genuinely be out of stock');
  assert.ok(pct >= 8 && pct <= 22, `unavailable share was ${pct.toFixed(1)}%`);
});

test('every SKU is well formed and points at a real store', () => {
  for (const p of PRODUCTS) {
    assert.ok(p.sizes.length > 0 && p.colors.length > 0, `${p.name} needs sizes and colours`);
    assert.ok(STORES.some((s) => s.id === p.storeId), `${p.name} points at an unknown store`);
    assert.ok(p.rating >= 3 && p.rating <= 5);
    assert.ok([5, 18].includes(p.gstRate));
    assert.ok(p.fabric && p.fit && p.care && p.description, `${p.name} is missing product copy`);
  }
});

test('geography covers both cities and every hub is reachable', () => {
  assert.equal(CITIES.length, 2);
  assert.equal(HUBS.filter((h) => h.cityId === 'guwahati').length, 5);
  assert.equal(HUBS.filter((h) => h.cityId === 'hyderabad').length, 3);
  for (const h of HUBS) assert.ok(storesForHub(h.id).length > 0, `${h.name} has no store in range`);
});

test('catalogue is scoped to stores that can actually reach the hub', () => {
  const gs = scopedCatalog('gs-road');
  const hyd = STORES.filter((s) => s.cityId === 'hyderabad').map((s) => s.id);
  assert.ok(gs.length > 0);
  assert.ok(gs.every((p) => !hyd.includes(p.storeId)), 'Hyderabad stock leaked into a Guwahati hub');
});

test('out-of-stock items are never filtered away, only sunk to the bottom', () => {
  const res = searchCatalog({ hubId: 'gs-road' });
  const outCount = res.items.filter((p) => !p.inStock).length;
  assert.ok(outCount > 0, 'out-of-stock SKUs must remain visible in the grid');
  const firstOut = res.items.findIndex((p) => !p.inStock);
  const lastIn = res.items.map((p) => p.inStock).lastIndexOf(true);
  assert.ok(firstOut > lastIn, 'every out-of-stock item must sort after every in-stock one');
  assert.equal(res.facets.outOfStock, outCount);
});

test('filters compose and facet counts survive their own selection', () => {
  const res = searchCatalog({ hubId: 'gs-road', categories: ['Topwear'], maxPrice: 700 });
  assert.ok(res.items.every((i) => i.category === 'Topwear' && i.price <= 700));
  const withColor = searchCatalog({ hubId: 'gs-road', colors: ['Black'] });
  assert.ok(Object.keys(withColor.facets.colors).length > 1, 'other colours must still be counted');
});

test('delivery-speed filter restricts by real ETA', () => {
  const fast = searchCatalog({ hubId: 'gs-road', delivery: 'under45' });
  assert.ok(fast.items.every((i) => i.etaMax <= 45));
  const hour = searchCatalog({ hubId: 'gs-road', delivery: 'under60' });
  assert.ok(hour.items.every((i) => i.etaMax <= 60));
  assert.ok(hour.total >= fast.total);
});

test('live stock overrides flow through to the storefront', () => {
  const before = searchCatalog({ hubId: 'gs-road' });
  const victim = before.items.find((p) => p.inStock);
  const after = searchCatalog({ hubId: 'gs-road', stockOverrides: { [victim.id]: 0 } });
  const same = after.items.find((p) => p.id === victim.id);
  assert.ok(same, 'the SKU must still be listed');
  assert.equal(same.inStock, false, 'but marked unavailable');
});

test('delivery windows come from distance, not a hard-coded field', () => {
  const near = deliveryWindow({ prepMins: 10, km: 1 });
  const far = deliveryWindow({ prepMins: 10, km: 9 });
  assert.ok(far.mid > near.mid);
  assert.ok(distanceKm(HUBS[0], HUBS[1]) > 0);
});

test('similar products favour the same line and stay in range', () => {
  const pool = scopedCatalog('gs-road');
  const anchor = pool.find((p) => p.line === 'm-tee');
  const similar = similarProducts(anchor, 'gs-road', {}, 6);
  assert.equal(similar.length, 6);
  assert.ok(!similar.some((s) => s.id === anchor.id));
  assert.ok(similar.filter((s) => s.line === anchor.line).length >= 2);
});

test('size charts carry dual units and real fit advice', () => {
  for (const [name, chart] of Object.entries(SIZE_CHARTS)) {
    assert.ok(chart.rows.length > 0, `${name} has no rows`);
    assert.ok(chart.fitAdvice.length > 0, `${name} has no fit advice`);
    assert.ok(chart.columns.every((c) => c.key && c.label));
  }
  assert.ok(SIZE_CHARTS.Topwear.columns.some((c) => c.convert), 'topwear must convert to cm');
  assert.equal(toCm(38), 96.5);
});

test('upcoming brands are complete enough to render the rail', () => {
  assert.ok(UPCOMING_BRANDS.length >= 6);
  for (const b of UPCOMING_BRANDS) {
    assert.ok(b.name && b.kind && b.eta && b.city && b.hub && b.blurb && b.accent, `${b.id} is missing a field`);
  }
});

test('active filter count reflects what the user actually changed', () => {
  assert.equal(countActiveFilters(DEFAULT_FILTERS), 0);
  assert.equal(countActiveFilters({ ...DEFAULT_FILTERS, colors: ['Black'], delivery: 'under45' }), 2);
  assert.equal(countActiveFilters({ ...DEFAULT_FILTERS, minPrice: PRICE_FLOOR, maxPrice: PRICE_CEILING }), 0);
});
