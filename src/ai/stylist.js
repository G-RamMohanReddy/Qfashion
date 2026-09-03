/**
 * Q-STYLIST · STRUCTURED RESPONSE GENERATION
 *
 * Stage 3 of the pipeline. Takes a parsed intent plus the live hub-scoped
 * catalogue and returns typed blocks — text, a ranked product carousel, a built
 * outfit, a tracker card, a rating widget — which the chat renders as real,
 * clickable cards inside the bubble rather than as a wall of text.
 *
 * Every recommendation carries the reason it ranked, produced by
 * `explain()` in the recommender, so the styling rationale a shopper reads is
 * the same signal the ranker actually used.
 */

import { parse, describe } from './intentParser.js';
import { rank, explain, logEvent, WEIGHTS } from './recommender.js';
import { searchCatalog } from '../lib/catalog.js';
import { PLATFORM, SIZE_CHARTS, HUBS, PRODUCT_LINES, BRAND_FIT_NOTES } from '../data/seedData.js';
import { TRACKER_STEPS, trackerStep, STATUS } from '../lib/orders.js';
import { storesForHub } from '../lib/geo.js';

const inr = (n) => '₹' + Number(n).toLocaleString('en-IN');
const t = (text) => ({ type: 'text', text });
const pickOne = (a) => a[Math.floor(Math.random() * a.length)];

const card = (p, entities) => ({
  id: p.id, name: p.name, brand: p.brand, price: p.price, mrp: p.mrp, discount: p.discount,
  image: p.images?.front, colors: p.colors, sizes: p.sizes, category: p.category,
  rating: p.rating, etaLabel: p.etaLabel, storeName: p.store?.name, stock: p.stock,
  inStock: p.inStock, reason: explain(p, entities), score: p._score?.score,
});

const products = (items, entities, title, note) => ({
  type: 'products',
  title,
  note,
  items: items.map((p) => card(p, entities)),
});

export const DEFAULT_CHIPS = [
  'Suggest an outfit under ₹1500 for a college fest',
  'Black oversized tees under ₹600',
  'What goes with wide-leg jeans?',
  'How does 60-minute delivery work?',
];

/* ------------------------------------------------------------ outfit recipes */

const RECIPES = {
  college: {
    title: 'College fest fit',
    line: 'Loud enough for photos, comfortable enough to stand in for six hours.',
    slots: [
      { key: 'Top', lines: ['m-tee', 'w-top', 'm-hoodie'], share: 0.34 },
      { key: 'Bottom', lines: ['m-cargo', 'm-jeans', 'w-jeans'], share: 0.4 },
      { key: 'Shoes', lines: ['f-sneaker', 'f-slide'], share: 0.26 },
    ],
  },
  party: {
    title: 'Going-out fit',
    line: 'One dark base, one piece with texture, and shoes that finish it.',
    slots: [
      { key: 'Top', lines: ['m-shirt', 'w-top', 'm-tee'], share: 0.36 },
      { key: 'Bottom', lines: ['m-jeans', 'w-jeans', 'w-skirt'], share: 0.38 },
      { key: 'Shoes', lines: ['f-sneaker', 'f-heel'], share: 0.26 },
    ],
  },
  date: {
    title: 'Dinner, not a boardroom',
    line: 'Smart but relaxed — texture on top, a clean leg, shoes you can walk in.',
    slots: [
      { key: 'Top', lines: ['m-shirt', 'w-top'], share: 0.4 },
      { key: 'Bottom', lines: ['m-jeans', 'w-jeans', 'w-skirt'], share: 0.34 },
      { key: 'Shoes', lines: ['f-sneaker', 'f-heel'], share: 0.26 },
    ],
  },
  work: {
    title: 'Office-ready',
    line: 'Nothing loud. Fit does the talking.',
    slots: [
      { key: 'Top', lines: ['m-shirt', 'w-kurti', 'm-polo'], share: 0.4 },
      { key: 'Bottom', lines: ['w-skirt', 'm-jeans'], share: 0.34 },
      { key: 'Shoes', lines: ['f-formal', 'f-heel', 'f-sneaker'], share: 0.26 },
    ],
  },
  interview: {
    title: 'Interview armour',
    line: 'Plain, pressed and forgettable in exactly the right way.',
    slots: [
      { key: 'Top', lines: ['m-shirt', 'w-kurti'], share: 0.42 },
      { key: 'Bottom', lines: ['w-skirt', 'm-jeans'], share: 0.32 },
      { key: 'Shoes', lines: ['f-formal', 'f-heel'], share: 0.26 },
    ],
  },
  festive: {
    title: 'Festive without overthinking it',
    line: 'One rich fabric, one clean base, minimal everything else.',
    slots: [
      { key: 'Ethnic', lines: ['w-kurti', 'm-ethnic'], share: 0.6 },
      { key: 'Shoes', lines: ['f-heel', 'f-slide'], share: 0.22 },
      { key: 'Finish', lines: ['a-jewel', 'a-watch'], share: 0.18 },
    ],
  },
  street: {
    title: 'Street fit',
    line: 'Oversized on top, wide below, obvious shoes.',
    slots: [
      { key: 'Top', lines: ['m-tee', 'm-hoodie'], share: 0.34 },
      { key: 'Bottom', lines: ['m-cargo', 'w-jeans'], share: 0.38 },
      { key: 'Shoes', lines: ['f-sneaker'], share: 0.28 },
    ],
  },
  everyday: {
    title: 'Easy everyday',
    line: 'A good tee, denim that fits, shoes that go with both.',
    slots: [
      { key: 'Top', lines: ['m-tee', 'w-top'], share: 0.3 },
      { key: 'Bottom', lines: ['m-jeans', 'w-jeans', 'm-cargo'], share: 0.42 },
      { key: 'Shoes', lines: ['f-sneaker', 'f-slide'], share: 0.28 },
    ],
  },
};

/** What pairs with what, for the "goes with" intent. */
const COMPLEMENTS = {
  'm-tee': ['m-cargo', 'm-jeans', 'f-sneaker'], 'm-shirt': ['m-jeans', 'm-cargo', 'f-formal'],
  'm-polo': ['m-jeans', 'f-sneaker'], 'm-hoodie': ['m-cargo', 'm-jeans', 'f-sneaker'],
  'm-cargo': ['m-tee', 'f-sneaker', 'm-hoodie'], 'm-jeans': ['m-tee', 'm-shirt', 'f-sneaker'],
  'm-shorts': ['m-tee', 'f-slide'], 'm-ethnic': ['f-formal', 'a-watch'],
  'w-top': ['w-jeans', 'w-skirt', 'f-heel'], 'w-dress': ['f-heel', 'a-bag', 'a-jewel'],
  'w-coord': ['f-sneaker', 'a-watch'], 'w-jeans': ['w-top', 'm-tee', 'f-sneaker'],
  'w-skirt': ['w-top', 'f-heel'], 'w-kurti': ['f-slide', 'a-jewel'],
  'f-sneaker': ['m-jeans', 'm-cargo'], 'f-heel': ['w-dress', 'w-skirt'], 'f-slide': ['m-shorts', 'w-kurti'],
  'f-formal': ['m-shirt', 'a-belt'], 'a-watch': ['m-shirt'], 'a-bag': ['w-dress'],
  'a-sunglass': ['m-tee'], 'a-belt': ['m-shirt'], 'a-jewel': ['w-dress'],
};

/* ----------------------------------------------------------------- helpers */

const hubName = (id) => HUBS.find((h) => h.id === id)?.name || 'your area';

/** The live, hub-scoped pool the ranker draws from. */
const poolFor = (ctx) => searchCatalog({ hubId: ctx.hubId, stockOverrides: ctx.stockOverrides || {} }).items;

/* ----------------------------------------------------------------- answers */

function answerHowItWorks() {
  return {
    blocks: [
      t(
        `**Q Fashion is the shop down the road, delivered.**\n\n` +
          `1. You share your neighbourhood. We only show stock physically sitting in partner stores that can reach it.\n` +
          `2. The store gets the order on their dashboard and packs it — usually in 10 to 15 minutes.\n` +
          `3. A delivery partner collects it and rides over.\n` +
          `4. You read out a 4-digit OTP at the door.\n\n` +
          `Typical door-to-door is **${PLATFORM.deliveryPromise}**. Delivery is ${inr(PLATFORM.deliveryFee)}, free above ${inr(PLATFORM.freeDeliveryAbove)}.`
      ),
    ],
    chips: ['What are the delivery charges?', 'Which areas do you cover?', 'Show me what is trending'],
  };
}

function answerPolicy(p) {
  const x = p.text;
  if (/\breturn|exchange|refund\b/.test(x)) {
    return {
      blocks: [
        t(
          `**Returns and exchanges**\n\n` +
            `• ${PLATFORM.returnWindow} from delivery, tags on, original packing.\n` +
            `• A size exchange is the fast path — the same store re-picks your size and it is swapped, usually the same day.\n` +
            `• Refunds go back to the source in 3–5 working days; COD refunds are sent to UPI.\n` +
            `• Innerwear and anything marked final sale cannot be returned.`
        ),
      ],
      chips: ['How do I exchange a size?', 'What payment methods work?'],
    };
  }
  if (/\bgst|bill|charge|fee\b/.test(x)) {
    return {
      blocks: [
        t(
          `**How your bill is built**\n\n` +
            `• Item total at the discounted price, with MRP and your saving both shown.\n` +
            `• Delivery ${inr(PLATFORM.deliveryFee)} — free above ${inr(PLATFORM.freeDeliveryAbove)}.\n` +
            `• Platform & packaging ${inr(PLATFORM.platformFee)} flat.\n` +
            `• GST at the real slabs — 5% on apparel, 18% on watches, bags and eyewear.\n` +
            `• Cash on delivery adds ${inr(PLATFORM.codFee)} handling.`
        ),
      ],
      chips: ['What payment methods work?', 'What is the return policy?'],
    };
  }
  if (/\bcod|cash|payment|upi|card\b/.test(x)) {
    return {
      blocks: [t(`**Paying**\n\n• UPI — GPay, PhonePe, Paytm or scan the QR.\n• Credit and debit cards, and net banking.\n• Cash on delivery up to ${inr(PLATFORM.codLimit)}, with ${inr(PLATFORM.codFee)} handling.`)],
      chips: ['How is GST calculated?', 'What is the return policy?'],
    };
  }
  if (/\bcancel\b/.test(x)) {
    return {
      blocks: [t(`Cancel free any time before the store marks your bag packed. After that, refuse it at the door — it goes straight back and the refund starts the same evening.`)],
      chips: ['Where is my order?', 'What is the return policy?'],
    };
  }
  return answerHowItWorks();
}

function answerStores(ctx) {
  const near = storesForHub(ctx.hubId);
  return {
    blocks: [
      t(
        `**${near.length} partner store${near.length === 1 ? '' : 's'} can reach ${hubName(ctx.hubId)} right now:**\n\n` +
          near.map((s) => `• ${s.name} — ${s.km} km, packs in about ${s.prepMins} min`).join('\n')
      ),
    ],
    chips: ['Show me what is trending', 'How does delivery work?'],
  };
}

function answerSearch(p, ctx) {
  const e = p.entities;
  const pool = poolFor(ctx);
  let ranked = rank(pool, e, { limit: 6 });
  let note = null;

  // graceful relaxation, in the order that loses the least intent
  if (!ranked.length && (e.colors?.length || e.occasions?.length)) {
    ranked = rank(pool, { ...e, colors: [], occasions: [] }, { limit: 6 });
    note = 'Nothing matched that exactly, so I relaxed the colour and occasion:';
  }
  if (!ranked.length && e.maxPrice) {
    const wider = Math.min(2999, Math.round(e.maxPrice * 1.5));
    ranked = rank(pool, { ...e, colors: [], occasions: [], maxPrice: wider }, { limit: 6 });
    note = `Nothing under ${inr(e.maxPrice)} nearby — closest matches up to ${inr(wider)}:`;
  }
  if (!ranked.length) {
    return {
      blocks: [t(`I could not find that within delivery range of ${hubName(ctx.hubId)}. Try another neighbourhood from the top bar, or tell me the occasion and I will style something.`)],
      chips: DEFAULT_CHIPS,
    };
  }

  const queryId = logEvent('query', { intent: p.intent, text: p.raw, results: ranked.length }).ts;
  ranked.forEach((r) => logEvent('impression', { queryId, productId: r.id, score: r._score.score }));

  const bits = describe(p);
  const head =
    `Found **${ranked.length}** ${ranked.length === 1 ? 'piece' : 'pieces'}` +
    (bits.length ? ` matching ${bits.join(' · ')}` : '') +
    `, ranked by fit to what you asked, what is actually on the shelf, and how fast it can reach ${hubName(ctx.hubId)}.`;

  return {
    blocks: [t(note || head), products(ranked, e, null)],
    chips: ['Show me cheaper options', 'Only under 45 min delivery', 'Build a full outfit around this'],
    patch: { lastLine: e.lines?.[0] || ctx.lastLine, lastQueryId: queryId },
  };
}

function answerOutfit(p, ctx) {
  const e = p.entities;
  const brief = e.briefs?.[0] || 'everyday';
  const recipe = RECIPES[brief] || RECIPES.everyday;
  const budgetCap = e.maxPrice || null;
  const pool = poolFor(ctx);

  const slots = [];
  const skipped = [];
  const used = new Set();
  let remaining = budgetCap || Infinity;

  /**
   * Budget allocation: each slot gets a weighted share of what is LEFT, plus 25%
   * headroom, so an expensive top cannot starve the shoes. A slot nothing
   * affordable fits is dropped and named rather than blowing the budget — a
   * stylist who ignores your budget is not a stylist.
   */
  recipe.slots.forEach((slot, idx) => {
    const shareLeft = recipe.slots.slice(idx).reduce((s, x) => s + x.share, 0);
    const cap = budgetCap ? Math.max(199, Math.min(Math.round(((remaining * slot.share) / shareLeft) * 1.25), remaining)) : 2999;

    const tryRank = (opts) =>
      rank(pool.filter((x) => !used.has(x.id)), { ...e, lines: slot.lines, maxPrice: opts.cap, colors: opts.colors, occasions: opts.occasions }, { limit: 4 });

    let found = tryRank({ cap, colors: e.colors || [], occasions: e.occasions || [] });
    if (!found.length) found = tryRank({ cap, colors: [], occasions: [] });
    if (!found.length && remaining !== Infinity) found = tryRank({ cap: remaining, colors: [], occasions: [] });

    if (found.length) {
      used.add(found[0].id);
      remaining -= found[0].price;
      slots.push({ label: slot.key, item: card(found[0], e), alternates: found.slice(1, 4).map((x) => card(x, e)) });
    } else {
      skipped.push(slot.key.toLowerCase());
    }
  });

  if (!slots.length) {
    return {
      blocks: [t(`Nothing in that budget is within delivery range of ${hubName(ctx.hubId)} right now. Nudge the budget up a little, or switch neighbourhoods from the top bar.`)],
      chips: DEFAULT_CHIPS,
    };
  }

  const total = slots.reduce((s, x) => s + x.item.price, 0);
  const eta = Math.max(...slots.map((s) => parseInt(String(s.item.etaLabel).split('-')[1] || '60', 10)));
  const over = budgetCap && total > budgetCap;
  logEvent('query', { intent: 'outfit', text: p.raw, results: slots.length });

  return {
    blocks: [
      t(
        `**${recipe.title}**\n\n${recipe.line}\n\n` +
          `Everything here is on a shelf near ${hubName(ctx.hubId)} right now. Full look: **${inr(total)}**` +
          (budgetCap ? (over ? ` — ${inr(total - budgetCap)} over your ${inr(budgetCap)} budget.` : `, leaving ${inr(budgetCap - total)} of your ${inr(budgetCap)} budget.`) : '.') +
          ` Lands in about ${eta} minutes.` +
          (skipped.length ? `\n\nNothing in the ${skipped.join(' or ')} slot fits what is left of the budget — raise it a little and I will complete the look.` : '')
      ),
      { type: 'outfit', title: recipe.title, total, slots },
    ],
    chips: ['Show me cheaper options', 'Find matching shoes', 'How does delivery work?'],
  };
}

function answerMatch(p, ctx) {
  const e = p.entities;
  const anchor = e.lines?.[0] || ctx.lastLine || 'w-jeans';
  const wanted = e.lines?.[1] ? [e.lines[1]] : COMPLEMENTS[anchor] || ['f-sneaker'];
  const anchorColor = e.colors?.[0];
  const neutral = anchorColor && !['Black', 'White', 'Cream', 'Ecru'].includes(anchorColor) ? ['White', 'Black', 'Brown', 'Cream', 'Sand'] : [];

  const pool = poolFor(ctx);
  let ranked = rank(pool, { ...e, lines: wanted, colors: neutral, occasions: [] }, { limit: 6 });
  if (!ranked.length) ranked = rank(pool, { ...e, lines: wanted, colors: [], occasions: [] }, { limit: 6 });

  const anchorLabel = [anchorColor, PRODUCT_LINES[anchor]?.label?.toLowerCase() || anchor].filter(Boolean).join(' ');

  return {
    blocks: [
      t(
        `With ${anchorLabel}, keep the second piece quiet. ` +
          (anchorColor && !['Black', 'White'].includes(anchorColor)
            ? `A ${anchorColor.toLowerCase()} anchor already carries the outfit, so white, black or a warm brown is the safest pair.`
            : 'White, black or a warm brown will all work.') +
          ` Here is what is in stock near you:`
      ),
      products(ranked, e, `Goes with ${anchorLabel}`),
    ],
    chips: ['Build me the full outfit', 'Show me cheaper options'],
    patch: { lastLine: wanted[0] },
  };
}

function answerSize(p, ctx) {
  const { weightKg, heightCm } = p.entities;
  const chartKey = PRODUCT_LINES[ctx.lastLine]?.category || 'Topwear';
  const chart = SIZE_CHARTS[chartKey] || SIZE_CHARTS.Topwear;
  const brandNotes = Object.entries(BRAND_FIT_NOTES).slice(0, 3).map(([b, n]) => `• **${b}** — ${n}`).join('\n');

  if (!weightKg) {
    return {
      blocks: [
        t(`Tell me your height and weight — "5'9, 72 kg" is enough — and I will size you for the exact piece.\n\nBrand quirks worth knowing:\n${brandNotes}`),
        { type: 'sizeChart', category: chartKey, chart },
      ],
      chips: ["I'm 5'10 and 75 kg", 'What is the return policy?'],
    };
  }

  const MATRIX = [
    { maxKg: 55, Men: 'S', Women: 'XS' }, { maxKg: 63, Men: 'M', Women: 'S' },
    { maxKg: 72, Men: 'L', Women: 'M' }, { maxKg: 82, Men: 'XL', Women: 'L' },
    { maxKg: 95, Men: 'XXL', Women: 'XL' }, { maxKg: 999, Men: 'XXL', Women: 'XXL' },
  ];
  const gender = p.entities.genders?.[0] === 'Women' ? 'Women' : 'Men';
  let size = MATRIX.find((r) => weightKg <= r.maxKg)[gender];
  if (heightCm && heightCm >= 180) {
    const order = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    size = order[Math.min(order.length - 1, order.indexOf(size) + 1)];
  }

  return {
    blocks: [
      t(
        `At ${heightCm ? `${heightCm} cm and ` : ''}${weightKg} kg you are a **${size}** in most of what we carry.\n\n` +
          `Two adjustments: go one up for Zara, and stay at ${size} for anything labelled oversized — those are cut big already.\n\n${brandNotes}`
      ),
      { type: 'sizeChart', category: chartKey, chart },
    ],
    chips: [`Show me ${size} in stock`, 'How do exchanges work?'],
  };
}

function answerOrder(p, ctx, api) {
  const id = p.entities.orderId || ctx.lastOrderId;
  const all = api.orders || [];
  if (!all.length) {
    return {
      blocks: [t(`No orders on this account yet. Add something to your bag and I will track it here the moment it is placed.`)],
      chips: ['Show me what is trending', 'How does delivery work?'],
    };
  }
  const order = id ? all.find((o) => o.id === id) : all.find((o) => !['delivered', 'cancelled'].includes(o.status)) || all[0];
  if (!order) {
    return {
      blocks: [t(`I could not find order **${id}**. Order IDs look like QF482193 — you will find yours on the tracking card or in the confirmation.`)],
      chips: ['Where is my order?'],
    };
  }

  const step = trackerStep(order);
  const mins = Math.max(0, Math.round((order.promisedAt - Date.now()) / 60000));
  const lines = [`**Order ${order.id}** — ${STATUS[order.status].label}.`];
  if (order.status === 'delivered') lines.push(`Delivered in ${order.actualMins} minutes. You have ${PLATFORM.returnWindow} to return or exchange.`);
  else if (order.status === 'cancelled') lines.push(`This order was cancelled and any payment is on its way back.`);
  else {
    lines.push(order.partner ? `${order.partner.name} has it — ${order.partner.vehicle}. ${TRACKER_STEPS[step].hint}.` : `${order.storeName} is handling it. ${TRACKER_STEPS[step].hint}.`);
    lines.push(`Estimated arrival: **${mins > 0 ? `about ${mins} min` : 'any moment now'}**.`);
    lines.push(`Keep OTP **${order.otp}** ready for the handover.`);
  }

  return {
    blocks: [
      t(lines.join('\n\n')),
      { type: 'order', order: { id: order.id, status: order.status, step, storeName: order.storeName, partner: order.partner?.name, otp: order.otp, total: order.bill.total, itemCount: order.bill.itemCount } },
    ],
    chips: order.status === 'delivered' ? ['I want to leave feedback', 'How do returns work?'] : ['Where is my order?', 'What is the return policy?'],
    patch: { lastOrderId: order.id },
  };
}

function answerFeedback(p, ctx, api) {
  const rating = p.entities.rating;

  if (ctx.pending === 'comment') {
    const topic = /\b(late|slow|delay|waiting)\b/i.test(p.raw) ? 'delivery'
      : /\b(size|fit|wrong|damaged|torn|quality)\b/i.test(p.raw) ? 'product'
      : /\b(pay|payment|refund|charge)\b/i.test(p.raw) ? 'payment' : 'general';
    const rec = api.addFeedback({ rating: ctx.draftRating ?? null, message: p.raw, orderId: ctx.lastOrderId, topic, source: 'stylist' });
    logEvent('feedback', { rating: ctx.draftRating, topic });
    return {
      blocks: [t(`Logged as **${rec.id}**${ctx.draftRating ? ` at ${ctx.draftRating}/5` : ''} under *${topic}*. The store sees it on their dashboard, and if it needs a callback you will hear from ${PLATFORM.supportPhone} within the hour.`)],
      chips: ['Show me what is trending', 'Where is my order?'],
      patch: { pending: null, draftRating: null },
    };
  }

  if (rating) {
    return {
      blocks: [t(rating >= 4 ? `${rating} out of 5 — thank you. Anything specific that worked, or anything we should fix?` : `${rating} out of 5. Sorry about that. Tell me what went wrong and I will log it against your order.`)],
      chips: rating >= 4 ? ['Delivery was fast', 'Good product quality'] : ['Delivery was late', 'Wrong size delivered', 'Item was damaged'],
      patch: { pending: 'comment', draftRating: rating },
    };
  }

  return {
    blocks: [t(`I would like to hear it. How would you rate your last experience?`), { type: 'rating' }],
    chips: [],
    patch: { pending: 'rating' },
  };
}

function answerGreeting(ctx) {
  return {
    blocks: [
      t(
        `${pickOne(['Hey!', 'Hi there!', 'Hello!'])} I am Q-Stylist. I can see what is physically on the shelves near **${hubName(ctx.hubId)}** right now, so anything I show you can be at your door inside the hour.\n\n` +
          `Ask me for a look with a budget, a specific piece, your size, or where an order has got to.`
      ),
    ],
    chips: DEFAULT_CHIPS,
  };
}

function answerFallback(p, ctx) {
  const ranked = rank(poolFor(ctx), { ...p.entities }, { limit: 4 });
  if (ranked.length && p.text.length > 2) {
    return { blocks: [t(`Closest things near you for "${p.raw}":`), products(ranked, p.entities)], chips: DEFAULT_CHIPS };
  }
  return {
    blocks: [
      t(
        `I did not quite catch that. I am good at four things:\n\n` +
          `• **Styling** — "suggest an outfit under ₹1500 for a college fest"\n` +
          `• **Finding stock** — "black oversized tees under ₹600"\n` +
          `• **Explaining the platform** — delivery, GST, returns\n` +
          `• **Tracking orders** — give me an ID like QF482193`
      ),
    ],
    chips: DEFAULT_CHIPS,
  };
}

/* ------------------------------------------------------------ entry point */

/**
 * @param {string} message  raw user utterance
 * @param {object} ctx      { hubId, stockOverrides, pending, draftRating, lastOrderId, lastLine }
 * @param {object} api      { orders, addFeedback }
 */
export function reply(message, ctx = {}, api = {}) {
  const context = { hubId: 'gs-road', ...ctx };
  const p = parse(message, context);
  const safeApi = { orders: [], addFeedback: () => ({ id: 'FB0000' }), ...api };

  let out;
  switch (p.intent) {
    case 'greeting': out = answerGreeting(context); break;
    case 'how_it_works': out = /\bstore|outlet|partner|shop\b/.test(p.text) ? answerStores(context) : answerHowItWorks(); break;
    case 'policy': out = answerPolicy(p); break;
    case 'order_status': out = answerOrder(p, context, safeApi); break;
    case 'feedback': out = answerFeedback(p, context, safeApi); break;
    case 'size': out = answerSize(p, context); break;
    case 'outfit': out = answerOutfit(p, context); break;
    case 'match': out = answerMatch(p, context); break;
    case 'product_search': out = answerSearch(p, context); break;
    default: out = answerFallback(p, context);
  }

  return {
    intent: p.intent,
    confidence: p.confidence,
    understood: describe(p),
    blocks: out.blocks,
    chips: out.chips?.length ? out.chips : DEFAULT_CHIPS,
    patch: out.patch || {},
    weights: WEIGHTS,
  };
}

export default reply;
