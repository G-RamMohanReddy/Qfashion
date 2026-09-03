/**
 * Q-STYLIST · INTENT CLASSIFICATION & ENTITY EXTRACTION
 *
 * Stage 1 of the pipeline described in `recommender.js`.
 *
 *   normalise → score weighted rule patterns → pick intent
 *             → extract typed slots → emit a normalised query object
 *
 * Rule-based rather than a model, for three reasons that hold at this stage of a
 * product: it is deterministic (so it can be unit-tested), it costs nothing per
 * call (so it can run on every keystroke), and it degrades to a sensible answer
 * rather than a confident wrong one. The output shape is the interface — a
 * classifier or an LLM can replace this file as long as it emits the same
 * `{ intent, entities }` object, and nothing downstream changes.
 */

import { PRODUCTS, HUBS, CITIES, PRODUCT_LINES } from '../data/seedData.js';

const BRANDS = [...new Set(PRODUCTS.map((p) => p.brand))];

/* --------------------------------------------------------------- lexicons */

const COLORS = {
  black: 'Black', white: 'White', ecru: 'Ecru', cream: 'Cream', ivory: 'Cream', 'off white': 'Ecru',
  sand: 'Sand', beige: 'Beige', stone: 'Stone', grey: 'Grey', gray: 'Grey', charcoal: 'Charcoal',
  slate: 'Slate', navy: 'Navy', blue: 'Denim', denim: 'Denim', 'ice blue': 'Ice Blue', teal: 'Teal',
  olive: 'Olive', sage: 'Sage', forest: 'Forest', green: 'Forest', mint: 'Mint', rust: 'Rust',
  terracotta: 'Terracotta', orange: 'Rust', mustard: 'Mustard', yellow: 'Yellow', maroon: 'Maroon',
  wine: 'Maroon', burgundy: 'Maroon', cherry: 'Cherry', red: 'Cherry', blush: 'Blush', pink: 'Pink',
  lavender: 'Lavender', purple: 'Purple', lilac: 'Lavender', brown: 'Brown', tan: 'Tan', gold: 'Gold', silver: 'Silver',
};

/** garment word → product line id */
const ITEMS = {
  tee: 'm-tee', tees: 'm-tee', tshirt: 'm-tee', 't-shirt': 'm-tee', 't-shirts': 'm-tee', tshirts: 'm-tee', oversized: 'm-tee',
  shirt: 'm-shirt', shirts: 'm-shirt', linen: 'm-shirt',
  polo: 'm-polo', polos: 'm-polo',
  hoodie: 'm-hoodie', hoodies: 'm-hoodie', sweatshirt: 'm-hoodie', bomber: 'm-hoodie', jacket: 'm-hoodie',
  cargo: 'm-cargo', cargos: 'm-cargo', 'cargo pants': 'm-cargo', joggers: 'm-cargo', jogger: 'm-cargo',
  jeans: 'm-jeans', denims: 'm-jeans',
  shorts: 'm-shorts',
  kurta: 'm-ethnic', sherwani: 'm-ethnic', 'nehru jacket': 'm-ethnic',
  top: 'w-top', tops: 'w-top', crop: 'w-top', 'crop top': 'w-top', 'crop tops': 'w-top', cami: 'w-top', corset: 'w-top',
  dress: 'w-dress', dresses: 'w-dress', frock: 'w-dress',
  coord: 'w-coord', 'co-ord': 'w-coord', 'co ord': 'w-coord', 'coord set': 'w-coord', 'two piece': 'w-coord',
  'wide leg': 'w-jeans', 'wide-leg': 'w-jeans',
  skirt: 'w-skirt', trousers: 'w-skirt', pants: 'w-skirt',
  kurti: 'w-kurti', kurtis: 'w-kurti', anarkali: 'w-kurti', ethnic: 'w-kurti', salwar: 'w-kurti', 'kurta set': 'w-kurti',
  sneaker: 'f-sneaker', sneakers: 'f-sneaker', shoes: 'f-sneaker', trainers: 'f-sneaker',
  heels: 'f-heel', heel: 'f-heel', flats: 'f-heel', pumps: 'f-heel',
  slides: 'f-slide', slippers: 'f-slide', sandals: 'f-slide', chappal: 'f-slide', crocs: 'f-slide',
  loafers: 'f-formal', derby: 'f-formal', 'formal shoes': 'f-formal',
  watch: 'a-watch', watches: 'a-watch',
  bag: 'a-bag', bags: 'a-bag', tote: 'a-bag', sling: 'a-bag', backpack: 'a-bag',
  sunglasses: 'a-sunglass', shades: 'a-sunglass', sunglass: 'a-sunglass', goggles: 'a-sunglass',
  belt: 'a-belt', wallet: 'a-belt',
  necklace: 'a-jewel', jewellery: 'a-jewel', jewelry: 'a-jewel', earrings: 'a-jewel', 'hair claw': 'a-jewel',
};

/** occasion phrase → { facet, styling brief } */
const OCCASIONS = {
  'college fest': { o: 'College', brief: 'college' },
  fest: { o: 'College', brief: 'college' },
  college: { o: 'College', brief: 'college' },
  campus: { o: 'College', brief: 'college' },
  party: { o: 'Party', brief: 'party' },
  clubbing: { o: 'Party', brief: 'party' },
  'night out': { o: 'Party', brief: 'party' },
  birthday: { o: 'Party', brief: 'party' },
  date: { o: 'Party', brief: 'date' },
  dinner: { o: 'Party', brief: 'date' },
  'rooftop dinner': { o: 'Party', brief: 'date' },
  office: { o: 'Work', brief: 'work' },
  work: { o: 'Work', brief: 'work' },
  interview: { o: 'Work', brief: 'interview' },
  meeting: { o: 'Work', brief: 'work' },
  formal: { o: 'Work', brief: 'work' },
  festive: { o: 'Festive', brief: 'festive' },
  puja: { o: 'Festive', brief: 'festive' },
  bihu: { o: 'Festive', brief: 'festive' },
  diwali: { o: 'Festive', brief: 'festive' },
  wedding: { o: 'Festive', brief: 'festive' },
  traditional: { o: 'Festive', brief: 'festive' },
  streetwear: { o: 'Streetwear', brief: 'street' },
  street: { o: 'Streetwear', brief: 'street' },
  casual: { o: 'Casual', brief: 'everyday' },
  everyday: { o: 'Casual', brief: 'everyday' },
  brunch: { o: 'Casual', brief: 'everyday' },
  travel: { o: 'Casual', brief: 'everyday' },
};

const GENDERS = {
  men: 'Men', mens: 'Men', "men's": 'Men', man: 'Men', male: 'Men', guys: 'Men', guy: 'Men', boys: 'Men', him: 'Men',
  women: 'Women', womens: 'Women', "women's": 'Women', woman: 'Women', female: 'Women', girls: 'Women', girl: 'Women',
  ladies: 'Women', her: 'Women', unisex: 'Unisex',
};

/* ---------------------------------------------------------- intent rules */

const RULES = [
  {
    intent: 'order_status', weight: 3,
    patterns: [/\bwhere(?:'s| is)? (?:my|the) order\b/, /\btrack\b/, /\border status\b/, /\bqf\s?\d{5,6}\b/, /\btxn_qf\b/, /\bwhen will (?:it|my order)\b/, /\bhow long (?:until|till|more)\b/, /\bdelivery status\b/],
  },
  {
    intent: 'feedback', weight: 3,
    patterns: [/\bfeedback\b/, /\bcomplain(?:t|ing)?\b/, /\brate (?:the|my|your)\b/, /\breview\b/, /\b(?:bad|poor|terrible|great|amazing|excellent) (?:service|experience|delivery|app|quality)\b/, /\bwrong (?:item|size|product|order)\b/, /\bdamaged|torn|stained\b/, /\bnot happy\b/],
  },
  {
    intent: 'size', weight: 3,
    patterns: [/\bwhat size\b/, /\bwhich size\b/, /\bsize (?:chart|guide|help)\b/, /\bmy size\b/, /\b\d{2,3}\s?kgs?\b/, /\b\d\s?(?:'|ft|feet)\s?\d{0,2}\b/, /\bsize up|size down\b/, /\bwill (?:it|this) fit\b/, /\bfit me\b/],
  },
  {
    intent: 'how_it_works', weight: 2.5,
    patterns: [/\bhow does (?:it|this|q ?fashion) work\b/, /\bhow it works\b/, /\bwhat is q ?fashion\b/, /\bhow (?:fast|quick|long)\b/, /\bdelivery time\b/, /\bwhich (?:areas|places|neighbourhoods|neighborhoods)\b/, /\bdo you deliver\b/, /\bserviceable\b/, /\b(?:45|60) min\b/],
  },
  {
    intent: 'policy', weight: 2.5,
    patterns: [/\breturn/, /\bexchange\b/, /\brefund\b/, /\bcancel/, /\bcod\b/, /\bcash on delivery\b/, /\bpayment (?:mode|method|option)/, /\bupi\b/, /\bgst\b/, /\bdelivery (?:fee|charge)\b/, /\bplatform fee\b/, /\bbill\b/],
  },
  {
    intent: 'match', weight: 2.5,
    patterns: [/\bmatch(?:ing|es)?\b/, /\bgoes? (?:well )?with\b/, /\bpair (?:it|this|them)? ?with\b/, /\bwhat (?:should|can) i wear with\b/, /\bcomplete (?:the|my) (?:look|outfit)\b/, /\bstyle (?:it|this) with\b/],
  },
  {
    intent: 'outfit', weight: 2,
    patterns: [/\bwhat should i wear\b/, /\bsuggest\b.*\b(?:outfit|look|fit)\b/, /\boutfit\b/, /\bstyle me\b/, /\bdress me\b/, /\bhelp me (?:pick|choose|decide)\b/, /\bgoing to a\b/, /\bi have a\b.*\b(?:party|fest|wedding|interview|date)\b/],
  },
  {
    intent: 'product_search', weight: 1.5,
    patterns: [/\b(?:show|find|get|search|browse|need|want|looking for|any|do you have)\b/, /\bunder\s?₹?\s?\d/, /\bbelow\s?₹?\s?\d/, /\bin stock\b/, /\bavailable\b/, /\bcheapest\b/],
  },
  { intent: 'greeting', weight: 1, patterns: [/^(?:hi|hey|hello|yo|namaste|hola)\b/, /^good (?:morning|evening|afternoon)\b/] },
];

/* -------------------------------------------------- query normalisation */

const normalise = (s) =>
  String(s || '').toLowerCase().replace(/₹/g, '₹ ').replace(/[^\w\s'₹.:-]/g, ' ').replace(/\s+/g, ' ').trim();

const money = (raw) => {
  const t = String(raw).replace(/[,\s₹]/g, '').toLowerCase();
  const k = t.match(/^([\d.]+)k$/);
  if (k) return Math.round(parseFloat(k[1]) * 1000);
  const n = parseFloat(t);
  return Number.isFinite(n) ? Math.round(n) : null;
};

function budget(text) {
  const t = text.replace(/₹\s?/g, '');
  let m = t.match(/\bbetween\s+([\d.,]+k?)\s+(?:and|to|-)\s+([\d.,]+k?)/);
  if (m) return { minPrice: money(m[1]), maxPrice: money(m[2]) };
  m = t.match(/\b(?:under|below|less than|within|upto|up to|max|maximum|budget of|budget|around)\s*([\d.,]+k?)/);
  if (m) return { maxPrice: money(m[1]) };
  m = t.match(/\b(?:above|over|more than|at least|minimum)\s*([\d.,]+k?)/);
  if (m) return { minPrice: money(m[1]) };
  m = t.match(/\b([\d.,]+k?)\s*(?:rs|rupees|bucks)\b/);
  if (m) return { maxPrice: money(m[1]) };
  return {};
}

/** Longest key first, on word boundaries — "rooftop dinner" must beat "dinner". */
function lookup(text, dict) {
  const hits = [];
  Object.keys(dict)
    .sort((a, b) => b.length - a.length)
    .forEach((key) => {
      const re = new RegExp(`(^|\\W)${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\W|$)`, 'i');
      if (re.test(text) && !hits.some((h) => h.key.includes(key))) hits.push({ key, value: dict[key] });
    });
  return hits;
}

function place(text) {
  for (const h of HUBS) if (text.includes(h.name.toLowerCase())) return { hubId: h.id, cityId: h.cityId, placeName: h.name };
  for (const c of CITIES) if (text.includes(c.name.toLowerCase())) return { cityId: c.id, placeName: c.name };
  return {};
}

function body(text) {
  const out = {};
  let m = text.match(/\b(\d)\s*(?:'|ft|feet|foot)\s*(\d{1,2})?\b/);
  if (m) out.heightCm = Math.round((parseInt(m[1], 10) * 12 + (parseInt(m[2], 10) || 0)) * 2.54);
  m = text.match(/\b(1[4-9]\d|2[0-2]\d)\s*cm\b/);
  if (m) out.heightCm = parseInt(m[1], 10);
  m = text.match(/\b(\d{2,3})\s*(?:kgs?|kilos?)\b/);
  if (m) out.weightKg = parseInt(m[1], 10);
  return out;
}

/* ------------------------------------------------------------ the parse */

export function parse(input, ctx = {}) {
  const raw = String(input || '');
  const text = normalise(raw);
  if (!text) return { intent: 'fallback', confidence: 0, raw, text, entities: {} };

  const colors = [...new Set(lookup(text, COLORS).map((h) => h.value))];
  const lines = [...new Set(lookup(text, ITEMS).map((h) => h.value))];
  const categories = [...new Set(lines.map((l) => PRODUCT_LINES[l]?.category).filter(Boolean))];
  const occHits = lookup(text, OCCASIONS);
  const occasions = [...new Set(occHits.map((h) => h.value.o))];
  const briefs = [...new Set(occHits.map((h) => h.value.brief))];
  const genders = [...new Set(lookup(text, GENDERS).map((h) => h.value))];

  // Word-boundary match: the brand "W" must not fire on "guwahati".
  const brands = BRANDS.filter((b) => {
    const needle = normalise(b);
    if (!needle) return false;
    return new RegExp(`(^|\\W)${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\W|$)`, 'i').test(text);
  });

  const orderMatch = text.match(/\bqf\s?(\d{5,6})\b/) || text.match(/\border\s*#?\s*(\d{5,6})\b/);
  const ratingMatch = text.match(/\b([1-5])\s*(?:star|stars|\/\s*5|out of 5)\b/) || text.match(/^\s*([1-5])\s*$/);
  const sizeMatch = raw.match(/\bsize\s+(XS|S|M|L|XL|XXL)\b/i) || raw.match(/\b(XS|S|M|L|XL|XXL)\s+size\b/i);

  const scores = RULES.map((r) => {
    const hits = r.patterns.filter((p) => p.test(text)).length;
    return { intent: r.intent, score: hits ? r.weight + hits * 0.4 : 0 };
  }).filter((s) => s.score > 0);

  const shopping = lines.length + colors.length + brands.length;
  if (shopping) scores.push({ intent: 'product_search', score: 1.2 + shopping * 0.55 });
  if (orderMatch) scores.push({ intent: 'order_status', score: 4.5 });
  if (briefs.length && !lines.length) scores.push({ intent: 'outfit', score: 1.7 + briefs.length * 0.5 });
  if (ratingMatch && ctx.pending === 'rating') scores.push({ intent: 'feedback', score: 6 });
  if (ctx.pending === 'comment') scores.push({ intent: 'feedback', score: 6 });
  if (/^(hi|hey|hello|yo|namaste|hola)$/.test(text)) scores.push({ intent: 'greeting', score: 5 });

  scores.sort((a, b) => b.score - a.score);
  let intent = scores[0]?.intent || 'fallback';
  if (intent === 'product_search' && /\b(?:match|matching|goes with|pair with|complete the look)\b/.test(text)) intent = 'match';

  return {
    intent,
    confidence: Math.min(1, (scores[0]?.score || 0) / 5),
    raw,
    text,
    entities: {
      colors, lines, categories, occasions, briefs, genders, brands,
      sizes: sizeMatch ? [sizeMatch[1].toUpperCase()] : [],
      tags: /\boversized\b/.test(text) ? ['oversized'] : [],
      orderId: orderMatch ? `QF${orderMatch[1]}` : null,
      rating: ratingMatch ? Number(ratingMatch[1]) : null,
      urgent: /\b(right now|now|asap|immediately|today|tonight|urgent|fast|quick)\b/.test(text),
      express: /\b(under 45|express|fastest|45 min)\b/.test(text),
      ...budget(text),
      ...place(text),
      ...body(text),
    },
  };
}

/** "What I understood" chips shown under a reply. */
export function describe(p) {
  const e = p.entities;
  const bits = [];
  if (e.lines?.length) bits.push(e.lines.map((l) => PRODUCT_LINES[l]?.label || l).join(', '));
  if (e.colors?.length) bits.push(e.colors.join('/'));
  if (e.genders?.length) bits.push(e.genders.join('/'));
  if (e.occasions?.length) bits.push(e.occasions.join('/'));
  if (e.maxPrice) bits.push(`under ₹${e.maxPrice}`);
  if (e.placeName) bits.push(e.placeName);
  return bits;
}

export default parse;
