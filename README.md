# Q Fashion

Hyperlocal fashion delivery for Guwahati and Hyderabad — clothes from shops that
are already a few kilometres away, at your door in 45–60 minutes.

This is the **consumer web app**: React 18 + Vite + Tailwind, with orders,
feedback, live stock and the "notify me" waitlist persisted to **Firebase
Firestore**. There is no retailer portal and no rider app in this repository.

```bash
npm install
cp .env.example .env    # or use the .env already in this folder
npm run dev             # http://localhost:5173
```

---

## Contents

1. [Running it](#1-running-it)
2. [Deploying to Vercel](#2-deploying-to-vercel)
3. [Firebase](#3-firebase)
4. [What's in the box](#4-whats-in-the-box)
5. [Folder layout](#5-folder-layout)
6. [The Q-Stylist: how the chatbot actually works](#6-the-q-stylist-how-the-chatbot-actually-works)
7. [Catalogue, images and the honest caveat](#7-catalogue-images-and-the-honest-caveat)
8. [Money: the bill, to the rupee](#8-money-the-bill-to-the-rupee)
9. [Location](#9-location)
10. [Tests](#10-tests)
11. [Design decisions worth defending in an interview](#11-design-decisions-worth-defending-in-an-interview)

---

## 1. Running it

Requires Node 18 or newer.

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server at `http://localhost:5173` |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serves `dist/` at `:4173`, exactly as deployed |
| `npm test` | 56 unit tests, `node --test`, no test-runner dependency |

The payment screen is labelled **TEST MODE**, is pre-filled with a sandbox card,
and makes no network calls of any kind. Any six digits work as the OTP. No card
data leaves the component or reaches Firestore — only the payment *mode* and a
generated transaction id are stored on the order.

---

## 2. Deploying to Vercel

```
1. git init && git add . && git commit -m "Q Fashion"
2. Push to GitHub.
3. Vercel → Add New → Project → import the repo.
4. Environment Variables → paste the contents of .env → Deploy.
```

`vercel.json` already pins the framework, build command and output directory, so
step 3 needs no configuration.

**Step 4 is the one that is easy to skip.** `.env` is gitignored, so it never
reaches Vercel on its own, and Vite inlines these variables at *build* time — a
variable added after a deploy does nothing until you redeploy. Vercel's
environment-variable panel has a bulk paste box that accepts the whole `.env`
file at once.

If the variables are missing the site still builds and runs; it just keeps
orders on the device. The line under the product grid tells you which mode you
are in, so you can confirm the deploy worked without opening devtools:

| What it says | What it means |
| --- | --- |
| Orders sync to your Q Fashion account | Firestore connected |
| Saved on this device — cloud sync unavailable | Configured, but the backend did not answer |
| Orders are saved on this device | No Firebase config reached the build |

One thing not to add: an **SPA catch-all rewrite**. This app has no client-side
router and does not need one.

---

## 3. Firebase

`src/lib/firebase.js` reads seven `VITE_FIREBASE_*` variables through
`import.meta.env`. Vite only exposes variables with that prefix, and it replaces
them with literal strings during the build.

These values are **public by design** — they ship inside the JavaScript bundle
and anyone can read them in devtools. That is normal for a Firebase web app: the
API key identifies the project, it does not grant access. Security comes from
Firestore rules.

**Before you go live, do these two things in the Firebase Console:**

1. **Firestore Database → Create database.** Nothing works without it.
2. **Rules → paste `firestore.rules` → Publish.** Do not leave it in test mode:
   test rules are wide open *and* they expire after 30 days, at which point the
   site silently stops saving orders.

Read the header of `firestore.rules` before shipping. The rules in this repo are
written so the demo works today without a login screen, and they trade security
for that — anyone who finds the project can read every order, including the
customer name, phone and address inside it. That is fine for a portfolio build
with invented customers, and not fine the day a real person types a real
address. The hardened version, which needs Firebase anonymous auth, is commented
at the bottom of the same file.

### What gets stored

| Collection | One document per | Written when |
| --- | --- | --- |
| `orders` | order | checkout, and on every status change |
| `stock` | product | an order decrements a shelf |
| `feedback` | rating + comment | the Q-Stylist collects feedback |
| `notifyRequests` | product | someone taps *Notify me* on a sold-out item |

### How it fits together

`src/lib/sync.js` holds one state object and keeps it in two places:

- **Local first** — `localStorage` plus a `BroadcastChannel` so two tabs in the
  same browser stay in step. Every write lands here synchronously, which is why
  the interface never waits on a round trip.
- **Cloud after** — each changed record is mirrored to Firestore document by
  document, and `onSnapshot` streams other devices' changes back down.

If Firestore is unconfigured, offline, or refused by the rules, the write is
logged and the app carries on with local state. A shopper never sees a failure
because a database was unreachable. Everything above `sync.js` — `platform.js`,
the hooks, every component — is unaware any of this is happening.

---

## 4. What's in the box

- 206 SKUs across 24 product lines and 36 brands, ₹199–₹2,999, stocked across
  10 partner stores in 8 neighbourhoods.
- Familiar Indian marketplace layout — white header with logo, location, search,
  wishlist, bag, profile; category chips across the top; filters down the left.
- **Out-of-stock items are never hidden and cannot be hidden.** There is no
  toggle for it. They render greyscale at reduced opacity under a bold
  `OUT OF STOCK` band, stay clickable, and offer *Add to wishlist* or
  *Notify me when available* — which writes a real waitlist row to Firestore.
  They sort to the end of the grid; they never leave it. There is a test that
  fails if anyone adds the filter.
- Product page with a four-angle gallery (Front / Back / Fabric / Model), all
  four belonging to that garment's own shoot.
- Interactive **Size Guide & Fit Chart** on every product — bust/chest, waist,
  length, shoulder, in inches *and* centimetres, plus a "find my size" helper
  that takes height and weight and recommends a size with fit advice.
- **Q-Stylist**, a conversational agent — see §6.
- Geolocation with a manual neighbourhood picker as the fallback.
- A payment gateway with a real bill breakdown, UPI / card / COD, simulated bank
  processing and OTP, and `TXN_QF_#####` transaction ids.
- Live order tracking, five stages.
- "Brands landing soon" carousel with *Get notified*.

---

## 5. Folder layout

```
q-fashion/
├── index.html                       app entry
├── package.json
├── vercel.json                      Vercel build config
├── vite.config.js
├── tailwind.config.js               the marketplace palette
├── postcss.config.js
├── .env                             Firebase config for local dev (gitignored)
├── .env.example
├── firestore.rules                  paste into Firebase Console → Rules
│
├── src/
│   ├── main.jsx
│   ├── App.jsx                      state orchestration and layout
│   ├── index.css
│   │
│   ├── ai/                          ← the Q-Stylist
│   │   ├── intentParser.js          intent classification + entity extraction
│   │   ├── recommender.js           feature space, scoring, ranking, event log
│   │   └── stylist.js               dialogue policy, outfit builder, responses
│   │
│   ├── data/
│   │   ├── catalogBase.js           geography, stores, taxonomy, SKU factory
│   │   ├── products.men.js          70 SKUs
│   │   ├── products.women.js        72 SKUs
│   │   ├── products.footwear.js     34 SKUs
│   │   ├── products.accessories.js  30 SKUs
│   │   └── seedData.js              aggregate + size charts + addresses + constants
│   │
│   ├── lib/
│   │   ├── firebase.js              reads import.meta.env, lazy Firestore client
│   │   ├── sync.js                  shared state: local first, Firestore after
│   │   ├── platform.js              the only writer of shared state
│   │   ├── orders.js                order lifecycle + the transition guard
│   │   ├── pricing.js               the bill
│   │   ├── catalog.js               scoping, search, filters
│   │   ├── geo.js                   haversine, delivery windows, hub detection
│   │   └── format.js                ₹, time, small helpers
│   │
│   ├── hooks/
│   │   ├── useSync.js               useSyncExternalStore binding + toasts
│   │   └── useCart.js               bag and wishlist
│   │
│   └── components/
│       ├── ui.jsx                   ProductImage (3-stage fallback), Modal, Badge…
│       ├── Header.jsx               LocationPicker.jsx  CategoryChips.jsx
│       ├── FilterSidebar.jsx        ProductCard.jsx     ProductDetails.jsx
│       ├── SizeGuideModal.jsx       BrandsComingSoon.jsx
│       ├── CartDrawer.jsx           WishlistDrawer.jsx
│       ├── PaymentModal.jsx         OrderTracking.jsx
│       ├── SyncBadge.jsx            where orders are being saved
│       └── QStylist.jsx             QStylistBlocks.jsx
│
└── tests/
    ├── catalog.test.js   pricing.test.js   orders.test.js   stylist.test.js
```

---

## 6. The Q-Stylist: how the chatbot actually works

The short version: **it is a retrieval system, not a generator.** It never
invents a product. Every item it names is a real row in the catalogue that is in
stock, inside your budget, and deliverable to your neighbourhood right now. That
constraint is the whole design.

Ask it *"Suggest an outfit under ₹1500 for a college fest in Guwahati"* and four
things happen in order.

### Bullet 1 — Intent parsing and query normalisation

`src/ai/intentParser.js`

The sentence is lowercased, punctuation-stripped and scored against weighted
regular-expression rules for ten intents: `greeting`, `outfit`, `product_search`,
`match`, `size`, `order_status`, `policy`, `how_it_works`, `feedback`,
`smalltalk`. Highest total wins; the margin over the runner-up becomes a
confidence score, and low confidence makes the reply ask rather than assume.

In the same pass it extracts **typed slots** — the same job a production NER
layer does, just done with lexicons and patterns because the domain is closed:

| Slot | From | Example |
| --- | --- | --- |
| `maxPrice` / `minPrice` | `under 1500`, `below 1.5k`, `between 800 and 1600` | `1500` |
| `colors` | colour lexicon | `["Black"]` |
| `lines` | item lexicon → product line ids | `["m-tee"]` |
| `occasions` | occasion lexicon → facet + brief | `["College"]` |
| `genders`, `brands`, `sizes` | catalogue vocabularies | `["Men"]` |
| `cityId` / `hubId` | the geography table | `"guwahati"` |
| `heightCm`, `weightKg` | `5'10`, `75 kg` | `178`, `75` |
| `orderId` | `QF\d{6}` | `"QF482193"` |

The output is a plain object. **Nothing downstream ever sees raw text again** —
which is exactly what makes each stage independently testable, and what would
let you swap the rule layer for a fine-tuned classifier without touching
anything else.

One bug worth mentioning because it is the classic one: the brand `W` was
matching the `w` inside *"Guwahati"*, which silently emptied every search
mentioning the city. Brand matching is now word-boundary anchored and there is a
regression test for it.

### Bullet 2 — Vector / feature matching on product tags

`src/ai/recommender.js` → `vectorise()`, `queryVector()`, `cosine()`

Every SKU is projected into a **sparse bag-of-features vector** with namespaced
keys, so a colour can never collide with a brand:

```
cat:Topwear  line:m-tee  gender:Men  brand:Snitch
color:Black  color:Charcoal  occ:College  occ:Casual
tag:oversized  tag:cotton  tag:streetwear
```

Each feature is weighted by **inverse document frequency** computed once over the
live catalogue at module load. This matters: `tag:oversized` appears on dozens of
items and carries almost no information, while `tag:chanderi` appears on two and
is nearly a unique identifier. Without IDF the common tags drown the rare ones
and every query returns the same crowd-pleasers.

The parsed query is projected into **the same named space** and the two are
compared by cosine similarity on L2-normalised vectors, so the score is bounded
in [0, 1] and a product with fifty tags is not automatically closer than one with
six.

> **Price is deliberately not a feature.** It was, briefly, and it was wrong: a
> `band:` feature derived from the budget let a cheap irrelevant t-shirt outrank
> the specific oversized one that was asked for, because it scored twice — once
> for being cheap and once for being a t-shirt. Price is a *hard constraint*,
> applied exactly once, in candidate generation. After that fix the correct item
> went to the top (0.770 vs 0.735). There is a test asserting no `band:` key can
> ever appear in a query vector.

Because the space is sparse and named, replacing it with dense sentence
embeddings is a two-function change — `vectorise()` and `cosine()` — and
everything above keeps working.

### Bullet 3 — Cold-start ranking and real-time inventory filtering

There is no purchase history on day one, so ranking is **content-based plus two
operational signals** the catalogue already knows. Retrieval is two-stage, which
is how real recommenders are built: cheap filtering first, expensive scoring on
the survivors.

**Stage 1 — candidate generation.** Hard constraints, no scoring:

- the store must serve the customer's hub (haversine distance ≤ service radius);
- price inside the stated budget;
- explicit category / product line / gender if the user named one;
- out-of-stock items are dropped *provided at least one in-stock candidate
  survives* — the stylist would rather show you something you can buy, but it
  will not hand back an empty answer.

**Stage 2 — ranking.** Each candidate is scored:

```
Score = w1·Similarity + w2·Availability + w3·Proximity
        w1 = 0.60       w2 = 0.25         w3 = 0.15
```

- **Similarity** — cosine, above.
- **Availability** — `0` when the shelf is empty, otherwise
  `min(1, 0.45 + log₂(stock+1)/8)`. Logarithmic, because the difference between
  1 and 4 in stock genuinely matters and the difference between 40 and 80 does
  not.
- **Proximity** — the store's delivery window mapped onto 0–1. This is the
  signal that makes a *hyperlocal* recommender different from catalogue search:
  a slightly less perfect shirt that arrives in 30 minutes beats a perfect one
  that takes 70.

`WEIGHTS` is a single exported object, and `rank()` takes a `weights` override.
That is not decoration — it is the seam where a model fitted on the event log
below replaces the hand-set priors without the ranking code changing at all.
There is a test that ranks with `{similarity: 0, availability: 0, proximity: 1}`
and asserts the nearest store wins, proving the seam works.

**Real-time inventory** is the part that is easy to fake and easy to catch. The
stylist reads stock through the same shared-state layer that streams the `stock`
collection out of Firestore, so a shelf switched off anywhere is respected
mid-conversation.

Every recommendation carries an `explain()` string — *"black, party-ready, 6 in
stock nearby, 34 min away"* — because a recommender you cannot interrogate is a
recommender you cannot debug.

### Bullet 4 — Conversion tracking and the feedback loop

`logEvent()` writes an append-only table of `impression → click → add_to_bag →
purchase`, each row keyed by the query id that produced it, so a conversion is
attributable to the specific ranked list that caused it. `conversionStats()`
returns CTR and add-rate over that table.

**That table is the training set.** The path from here to a learned ranker is:
log a few weeks of it, label each impression by whether it converted, fit a
pairwise ranker (LambdaMART or a small gradient-boosted model) on the same
feature vectors already being computed, and replace `WEIGHTS` with the fitted
model. Nothing above `scoreProduct()` changes.

Explicit feedback runs alongside: the stylist collects a star rating and a
comment over two conversational turns, classifies the comment into a topic
(delivery / sizing / quality / price / app), and writes it to the `feedback`
collection in Firestore.

### The outfit builder

`src/ai/stylist.js` holds eight outfit recipes (college fest, office, wedding
guest, date night, brunch, travel, gym, festive), each a list of slots with a
**share of the budget**. It allocates the budget across slots, ranks candidates
per slot, and — the part that took a rewrite — allocates the *remaining* budget
after each pick rather than the original one, with 25% headroom. The first
version cheerfully returned a ₹3,397 outfit against a ₹1,500 budget. If a slot
cannot be filled inside what's left, it is dropped **and named**, rather than
silently ignored. There is a test that fails if a look exceeds its budget.

---

## 7. Catalogue, images and the honest caveat

206 SKUs, generated from 24 hand-written product lines by a variant factory in
`catalogBase.js`. Each line carries real copy — fabric, fit, care, description —
and expands into colourway variants with their own SKU, stock level, rating and
review count. 15 SKUs (7%) are out of stock on purpose, and stock is per-store,
so what's unavailable depends on which neighbourhood you're in.

**On the photography, plainly:** stock photo libraries do not contain true
front/back/fabric/model plates of the same garment. What this build guarantees
instead is that each product *line* gets its own four-image shoot, allocated once
and never borrowed from another product, so the four angles on a page are stable,
belong to that item, and are labelled by angle. That is the honest version of the
requirement, and it is stated once in `catalogBase.js` rather than papered over.

Every image goes through `ProductImage`, which has a three-stage fallback: the
real photo, then a shared fallback, then a tile drawn from that SKU's own
colourway and category — a garment silhouette that changes with the angle, so a
gallery still reads as four views even with every network image blocked. Nothing
ever renders as a broken-image icon.

---

## 8. Money: the bill, to the rupee

```
MRP                    ₹2,198
Discount             − ₹1,000
────────────────────────────
Item total             ₹1,198
Delivery fee              ₹40      free above ₹1,499 of item value
Platform fee              ₹15
GST (5% apparel)          ₹60      5% apparel, 18% accessories, per line
────────────────────────────
Total amount           ₹1,313
```

GST is charged **at the real slab per line and rounded per row**, not as one
blended rate on the subtotal, because that is how a real invoice works and
because a blended rate produces a bill whose rows don't sum to the total. There
is a test that takes four different bills, sums the printed rows, and asserts the
result equals the stated total. COD adds a ₹20 handling charge. An empty bag has
no fees at all — an earlier version charged ₹40 delivery on an empty cart.

---

## 9. Location

**Detect my location** uses the browser Geolocation API and then reverse-geocodes
against the built-in hub table by haversine distance — no API key, no third-party
service, and the coordinates never leave the page. If permission is denied or
the position is outside both cities, the manual neighbourhood picker takes over,
and it is always available regardless. Geolocation needs HTTPS, which Vercel
provides.

Serviceable areas: **Guwahati** — GS Road, Zoo Road, Christian Basti, Pan Bazaar,
Jalukbari. **Hyderabad** — Banjara Hills, Jubilee Hills, Gachibowli.

Your hub decides which stores are in range, which decides the catalogue you see
(86–120 SKUs depending on where you are) and the delivery window on every card.

---

## 10. Tests

```bash
npm test        # 56 tests, 56 pass
```

`node --test`, no test runner in the dependency tree. The tests that matter most
are the ones that pin down claims that would otherwise be decorative:

- `Score = w1·S + w2·A + w3·P` holds to 1e-12 against the exported weights.
- No `band:` key can appear in a query vector — price cannot leak back in.
- Out-of-stock items are never filtered out of the catalogue.
- Every SKU has four distinct angles drawn from its own line's shoot.
- Printed bill rows always sum to the amount payable.
- An outfit never exceeds its budget.
- Brand `W` does not match *Guwahati*.
- `nextAction()` walks an order from placed to delivered without a dead end.

---

## 11. Design decisions worth defending in an interview

**Why rules instead of an LLM for the stylist.** The catalogue is closed and
small; a fine-tuned classifier would beat regex on paraphrase but not on
anything else, and an LLM would hallucinate products that aren't on a shelf —
the one failure mode a delivery-in-an-hour business cannot absorb. The
architecture is staged precisely so the rule layer can be swapped for a model
without the retrieval or ranking layers noticing.

**Why two-stage retrieval.** Scoring 206 items is free; scoring 200,000 is not.
The split between hard constraints and soft scoring is what makes the system
survive a catalogue two orders of magnitude larger, and it is where an ANN index
would drop in.

**Why availability and proximity are in the score at all.** Because relevance
alone is the wrong objective for this business. The thing being optimised is not
"which garment best matches the query" but "which garment best matches the query
*and can be on their doorstep in an hour*". Putting operational reality into the
ranking function rather than filtering afterwards is the difference between a
catalogue and a hyperlocal one.

**Why out-of-stock items stay visible.** Hiding them makes the catalogue look
thinner than it is and destroys demand signal. Shown greyed with a *Notify me*
button, they generate a waitlist a store can act on — which is why those requests
are written to Firestore rather than dropped.

**Why local-first rather than reading straight from Firestore.** A shopper adding
to their bag should never watch a spinner because a database is slow, and a
delivery app that breaks on a weak connection is worse than useless in the
market it is built for. Writing locally and mirroring upward means the interface
is always instant and the network is always optional. It also means one file —
`sync.js` — owns every decision about persistence; nothing above it knows or
cares where state lives.
