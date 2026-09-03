/**
 * Catalogue: hyperlocal scoping, filtering, facet counts and sorting.
 *
 * Two rules shape everything here:
 *
 * 1. Only stock inside a partner store's delivery radius of the shopper's
 *    neighbourhood exists at all. Change neighbourhood and the catalogue really
 *    changes — that is the product, not a re-sort.
 * 2. Out-of-stock SKUs are never filtered away. They sort to the end of the
 *    grid and render dimmed with an overlay, because a catalogue with no gaps
 *    looks fabricated and the shopper still wants a "notify me".
 */

import { PRODUCTS, STORES, HUBS, PRODUCT_LINES } from '../data/seedData.js';
import { deliveryWindow, windowLabel, storesForHub } from './geo.js';

export const DEFAULT_FILTERS = {
  q: '',
  dept: null, // the top chip row
  categories: [],
  lines: [],
  brands: [],
  sizes: [],
  colors: [],
  occasions: [],
  minPrice: 199,
  maxPrice: 2999,
  minRating: 0,
  delivery: 'any', // any | under45 | under60
  sort: 'relevance',
};

export const PRICE_FLOOR = 199;
export const PRICE_CEILING = 2999;

/** Every reachable SKU, decorated with its store, distance and ETA. */
export function scopedCatalog(hubId, stockOverrides = {}) {
  const reach = new Map(storesForHub(hubId).map((s) => [s.id, s]));
  const hub = HUBS.find((h) => h.id === hubId);

  return PRODUCTS.filter((p) => reach.has(p.storeId)).map((p) => {
    const store = reach.get(p.storeId);
    const w = deliveryWindow({ prepMins: store.prepMins, km: store.km });
    const stock = stockOverrides[p.id] ?? p.stock;
    return {
      ...p,
      stock,
      inStock: stock > 0,
      store: { id: store.id, name: store.name, chain: store.chain, hubId: store.hubId, address: store.address, phone: store.phone },
      km: store.km,
      etaMin: w.min,
      etaMax: w.max,
      etaMid: w.mid,
      etaLabel: windowLabel(w),
      hubName: hub?.name,
    };
  });
}

function matches(p, f) {
  if (f.dept && p.dept !== f.dept && !(f.dept === 'streetwear' && p.occasions.includes('Streetwear')) && !(f.dept === 'ethnic' && p.category === 'Ethnic')) return false;
  if (f.categories.length && !f.categories.includes(p.category)) return false;
  if (f.lines.length && !f.lines.includes(p.line)) return false;
  if (f.brands.length && !f.brands.includes(p.brand)) return false;
  if (f.colors.length && !p.colors.some((c) => f.colors.includes(c))) return false;
  if (f.sizes.length && !p.sizes.some((s) => f.sizes.includes(s))) return false;
  if (f.occasions.length && !p.occasions.some((o) => f.occasions.includes(o))) return false;
  if (p.price < f.minPrice || p.price > f.maxPrice) return false;
  if (p.rating < f.minRating) return false;
  if (f.delivery === 'under45' && p.etaMax > 45) return false;
  if (f.delivery === 'under60' && p.etaMax > 60) return false;
  if (f.q) {
    const hay = `${p.name} ${p.brand} ${p.category} ${p.lineLabel} ${p.gender} ${p.colors.join(' ')} ${p.tags.join(' ')} ${p.occasions.join(' ')}`.toLowerCase();
    if (!f.q.toLowerCase().split(/\s+/).filter(Boolean).every((t) => hay.includes(t))) return false;
  }
  return true;
}

/** Out-of-stock always sinks to the bottom, whatever the chosen sort. */
const withAvailability = (fn) => (a, b) => Number(b.inStock) - Number(a.inStock) || fn(a, b);

const SORTERS = {
  relevance: withAvailability((a, b) => b.popularity - a.popularity || a.etaMax - b.etaMax),
  fastest: withAvailability((a, b) => a.etaMax - b.etaMax || a.km - b.km),
  price_asc: withAvailability((a, b) => a.price - b.price),
  price_desc: withAvailability((a, b) => b.price - a.price),
  discount: withAvailability((a, b) => b.discount - a.discount),
  rating: withAvailability((a, b) => b.rating - a.rating || b.reviews - a.reviews),
  newest: withAvailability((a, b) => a.daysOld - b.daysOld),
};

export const SORT_OPTIONS = [
  { id: 'relevance', label: 'Recommended' },
  { id: 'fastest', label: 'Fastest delivery' },
  { id: 'price_asc', label: 'Price: low to high' },
  { id: 'price_desc', label: 'Price: high to low' },
  { id: 'discount', label: 'Better discount' },
  { id: 'rating', label: 'Customer rating' },
  { id: 'newest', label: 'What’s new' },
];

/** Counts are computed with each facet's own filter removed. */
function facets(pool, f) {
  const countBy = (key, valuesOf) => {
    const base = pool.filter((p) => matches(p, { ...f, [key]: [] }));
    const out = {};
    base.forEach((p) => valuesOf(p).forEach((v) => (out[v] = (out[v] || 0) + 1)));
    return out;
  };
  const visible = pool.filter((p) => matches(p, f));
  return {
    categories: countBy('categories', (p) => [p.category]),
    lines: countBy('lines', (p) => [p.line]),
    brands: countBy('brands', (p) => [p.brand]),
    colors: countBy('colors', (p) => p.colors),
    sizes: countBy('sizes', (p) => p.sizes),
    occasions: countBy('occasions', (p) => p.occasions),
    outOfStock: visible.filter((p) => !p.inStock).length,
    priceBounds: pool.length
      ? { min: Math.min(...pool.map((p) => p.price)), max: Math.max(...pool.map((p) => p.price)) }
      : { min: PRICE_FLOOR, max: PRICE_CEILING },
  };
}

export function searchCatalog({ hubId = 'gs-road', stockOverrides = {}, ...query } = {}) {
  const f = { ...DEFAULT_FILTERS, ...query };
  const pool = scopedCatalog(hubId, stockOverrides);
  const items = pool.filter((p) => matches(p, f)).sort(SORTERS[f.sort] || SORTERS.relevance);
  return {
    items,
    total: items.length,
    poolSize: pool.length,
    facets: facets(pool, f),
    stores: storesForHub(hubId).map((s) => ({ id: s.id, name: s.name, km: s.km, prepMins: s.prepMins })),
  };
}

export function getProduct(id, hubId = 'gs-road', stockOverrides = {}) {
  const found = scopedCatalog(hubId, stockOverrides).find((x) => x.id === id);
  if (found) return found;
  // out of range for this hub, but still resolvable for the wishlist and order history
  const raw = PRODUCTS.find((x) => x.id === id);
  if (!raw) return null;
  const store = STORES.find((s) => s.id === raw.storeId);
  return { ...raw, store, km: null, etaLabel: '—', inStock: (stockOverrides[id] ?? raw.stock) > 0 };
}

/** "You may also like" — same line first, then same category. */
export function similarProducts(product, hubId, stockOverrides = {}, limit = 8) {
  const pool = scopedCatalog(hubId, stockOverrides).filter((p) => p.id !== product.id);
  const score = (p) =>
    (p.line === product.line ? 4 : 0) +
    (p.category === product.category ? 2 : 0) +
    (p.colors.some((c) => product.colors.includes(c)) ? 1 : 0) +
    (Math.abs(p.price - product.price) < 400 ? 1 : 0) +
    (p.inStock ? 1 : 0);
  return pool.sort((a, b) => score(b) - score(a) || b.popularity - a.popularity).slice(0, limit);
}

export function countActiveFilters(f) {
  let n = 0;
  ['categories', 'lines', 'brands', 'sizes', 'colors', 'occasions'].forEach((k) => (n += (f[k] || []).length));
  if (f.minPrice > PRICE_FLOOR || f.maxPrice < PRICE_CEILING) n += 1;
  if (f.minRating > 0) n += 1;
  if (f.delivery !== 'any') n += 1;
  return n;
}

export { PRODUCT_LINES };
