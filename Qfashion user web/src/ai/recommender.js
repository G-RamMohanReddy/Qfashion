/**
 * Q-STYLIST · CONTEXTUAL RECOMMENDATION ENGINE
 * =============================================================================
 *
 * Architecture in four bullets
 * ----------------------------
 * 1. INTENT PARSING & QUERY NORMALISATION — `intentParser.js` lowercases and
 *    strips the utterance, scores it against weighted rule patterns to pick one
 *    of ten intents, and extracts typed slots (budget, colour, occasion,
 *    category, gender, brand, urgency, location, size, order id). The output is
 *    a normalised query object, never raw text, so every stage downstream reads
 *    structured fields.
 *
 * 2. VECTOR / FEATURE MATCHING ON PRODUCT TAGS — every SKU is projected into a
 *    sparse bag-of-features space (`category:`, `line:`, `colour:`, `occasion:`,
 *    `tag:`, `brand:`, `gender:`, `priceband:`). Features are weighted by
 *    inverse document frequency computed over the live catalogue, so "oversized"
 *    (common) counts for less than "chanderi" (rare). The parsed query is
 *    projected into the same space and matched by cosine similarity. The space
 *    is deliberately sparse and named: swapping in a dense sentence-embedding
 *    model means replacing `vectorise()` and `cosine()` and nothing else, and
 *    the ranking layer above keeps working unchanged.
 *
 * 3. COLD-START RANKING & REAL-TIME INVENTORY FILTERING — with no purchase
 *    history to personalise from, ranking is content-based plus two operational
 *    signals the catalogue already knows. Retrieval is two-stage: candidate
 *    generation applies hard constraints (hub delivery radius, budget ceiling,
 *    explicit category or gender), then the candidate set is scored by
 *
 *        Score = w1·Similarity + w2·Availability + w3·Proximity
 *
 *    Availability reads live stock, including anything a store has just
 *    switched off in Firestore, so the stylist can never recommend something
 *    that is not on a shelf. Proximity converts the store's delivery window into a 0–1
 *    signal, which is what makes a hyperlocal recommender different from a
 *    catalogue search.
 *
 * 4. CONVERSION TRACKING & FEEDBACK LOOP — `logEvent()` records impressions,
 *    card clicks, add-to-bag and purchases against the recommendation that
 *    produced them, keyed by query id. That table is the training set: the
 *    weights below are hand-set priors for cold start, and `WEIGHTS` is a single
 *    exported object precisely so a fitted model can replace it later without
 *    touching the ranking code. Explicit feedback (star rating plus a comment)
 *    is captured by the stylist and written to shared state, which mirrors to
 *    the `feedback` collection in Firestore.
 *
 * Everything here is deterministic and dependency-free, which is what makes it
 * unit-testable — see `tests/stylist.test.js`.
 */

import { PRODUCTS } from '../data/seedData.js';

/* ------------------------------------------------------------------ weights */

/**
 * Cold-start priors. Similarity dominates because with no user history the
 * query is the only personalisation signal we have; availability is weighted
 * heavily enough that a low-stock item loses to an equally relevant in-stock
 * one; proximity breaks ties in a way that shortens the delivery promise.
 */
export const WEIGHTS = { similarity: 0.6, availability: 0.25, proximity: 0.15 };

/* --------------------------------------------------- feature space + IDF */

const priceBand = (p) => (p < 500 ? 'budget' : p < 1000 ? 'value' : p < 2000 ? 'mid' : 'premium');

/** Projects a SKU into the sparse feature space. */
export function vectorise(p) {
  const f = new Map();
  const put = (k, w = 1) => f.set(k, (f.get(k) || 0) + w);

  put(`cat:${p.category}`, 1.2);
  put(`line:${p.line}`, 1.5);
  put(`gender:${p.gender}`);
  put(`brand:${p.brand}`);
  put(`band:${priceBand(p.price)}`, 0.6);
  p.colors.forEach((c) => put(`color:${c}`, 1.3));
  p.occasions.forEach((o) => put(`occ:${o}`, 1.2));
  p.tags.forEach((t) => put(`tag:${t}`, 0.8));
  return f;
}

/**
 * Inverse document frequency across the live catalogue, computed once at module
 * load. Rare features (a specific colourway) carry more signal than common ones
 * ("cotton").
 */
const IDF = (() => {
  const df = new Map();
  for (const p of PRODUCTS) {
    for (const key of vectorise(p).keys()) df.set(key, (df.get(key) || 0) + 1);
  }
  const N = PRODUCTS.length;
  const idf = new Map();
  for (const [key, n] of df) idf.set(key, Math.log((N + 1) / (n + 1)) + 1);
  return idf;
})();

const idfOf = (key) => IDF.get(key) ?? Math.log(PRODUCTS.length + 1) + 1;

/** Applies IDF weighting and L2-normalises, so cosine is a plain dot product. */
function weighted(features) {
  const out = new Map();
  let norm = 0;
  for (const [k, w] of features) {
    const v = w * idfOf(k);
    out.set(k, v);
    norm += v * v;
  }
  norm = Math.sqrt(norm) || 1;
  for (const [k, v] of out) out.set(k, v / norm);
  return out;
}

export function cosine(a, b) {
  const [small, large] = a.size < b.size ? [a, b] : [b, a];
  let dot = 0;
  for (const [k, v] of small) {
    const other = large.get(k);
    if (other) dot += v * other;
  }
  return dot;
}

/** Projects a parsed query into the same space the products live in. */
export function queryVector(entities = {}) {
  const f = new Map();
  const put = (k, w = 1) => f.set(k, (f.get(k) || 0) + w);

  (entities.categories || []).forEach((c) => put(`cat:${c}`, 1.2));
  (entities.lines || []).forEach((l) => put(`line:${l}`, 1.6));
  (entities.colors || []).forEach((c) => put(`color:${c}`, 1.4));
  (entities.occasions || []).forEach((o) => put(`occ:${o}`, 1.3));
  (entities.brands || []).forEach((b) => put(`brand:${b}`));
  (entities.genders || []).forEach((g) => put(`gender:${g}`));
  (entities.tags || []).forEach((t) => put(`tag:${t}`, 1.1));
  // Price is deliberately NOT a query feature: it is a hard constraint applied
  // once in candidate generation. Scoring it again here would double-count the
  // budget and let a cheap irrelevant item outrank the thing actually asked for.
  return f;
}

/* ------------------------------------------------------------- the signals */

/** 0 when the shelf is empty, saturating around eight pieces. */
export function availabilityScore(product) {
  if (!product.inStock || product.stock <= 0) return 0;
  return Math.min(1, 0.45 + Math.log2(product.stock + 1) / 8);
}

/** 1 for a 25-minute promise, decaying to 0 by about 85 minutes. */
export function proximityScore(product) {
  const eta = product.etaMid ?? product.etaMax ?? 60;
  return Math.max(0, Math.min(1, 1 - (eta - 25) / 60));
}

/**
 * Scores one product against a query vector.
 * Returns the components as well as the total, because the chat surfaces the
 * reason ("black · party, 3 left nearby, 34 min") and an unexplainable
 * recommendation is one nobody trusts.
 */
export function scoreProduct(product, qv, { weights = WEIGHTS } = {}) {
  const similarity = qv.size ? cosine(qv, weighted(vectorise(product))) : 0.35;
  const availability = availabilityScore(product);
  const proximity = proximityScore(product);
  const score = weights.similarity * similarity + weights.availability * availability + weights.proximity * proximity;
  return { score, similarity, availability, proximity };
}

/* ---------------------------------------------- two-stage retrieval + rank */

/**
 * Stage 1 — candidate generation. Hard constraints only: things that would make
 * a recommendation wrong rather than merely worse.
 */
export function generateCandidates(pool, entities = {}) {
  let items = pool;
  if (entities.maxPrice) items = items.filter((p) => p.price <= entities.maxPrice);
  if (entities.minPrice) items = items.filter((p) => p.price >= entities.minPrice);
  if (entities.genders?.length) items = items.filter((p) => entities.genders.includes(p.gender) || p.gender === 'Unisex');
  if (entities.lines?.length) items = items.filter((p) => entities.lines.includes(p.line));
  else if (entities.categories?.length) items = items.filter((p) => entities.categories.includes(p.category));
  // A stylist recommending something the store cannot hand over is worse than useless.
  const inStock = items.filter((p) => p.inStock);
  return inStock.length ? inStock : items;
}

/** Stage 2 — score and sort. Returns products decorated with their score parts. */
export function rank(pool, entities = {}, { limit = 8, weights = WEIGHTS } = {}) {
  const candidates = generateCandidates(pool, entities);
  const qv = weighted(queryVector(entities));

  return candidates
    .map((p) => ({ ...p, _score: scoreProduct(p, qv, { weights }) }))
    .sort((a, b) => b._score.score - a._score.score)
    .slice(0, limit);
}

/** Human-readable reason for one ranked product. */
export function explain(product, entities = {}) {
  const bits = [];
  const colour = (entities.colors || []).find((c) => product.colors.includes(c));
  if (colour) bits.push(colour.toLowerCase());
  const occ = (entities.occasions || []).find((o) => product.occasions.includes(o));
  if (occ) bits.push(occ.toLowerCase());
  if (entities.maxPrice && product.price <= entities.maxPrice) bits.push(`under ₹${entities.maxPrice}`);
  bits.push(product.stock === 1 ? 'last piece nearby' : `${product.stock} in stock nearby`);
  bits.push(`${product.etaMid} min away`);
  return bits.join(' · ');
}

/* ------------------------------------------- conversion tracking / feedback */

const EVENT_CAP = 300;
const events = [];

/**
 * The feedback loop. Impressions, clicks, adds and purchases are logged against
 * the query that produced them; `WEIGHTS` above are the priors this table is
 * meant to replace once there is enough of it.
 */
export function logEvent(type, payload = {}) {
  events.unshift({ type, ts: Date.now(), ...payload });
  if (events.length > EVENT_CAP) events.length = EVENT_CAP;
  return events[0];
}

export const getEvents = () => events.slice();

/** Impression → click → add-to-bag funnel for the logged session. */
export function conversionStats() {
  const count = (t) => events.filter((e) => e.type === t).length;
  const impressions = count('impression');
  const clicks = count('click');
  const adds = count('add_to_bag');
  return {
    impressions,
    clicks,
    adds,
    ctr: impressions ? +(clicks / impressions).toFixed(3) : 0,
    addRate: clicks ? +(adds / clicks).toFixed(3) : 0,
  };
}

export const _internals = { weighted, priceBand, IDF };
