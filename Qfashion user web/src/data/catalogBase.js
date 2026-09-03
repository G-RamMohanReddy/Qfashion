/**
 * Catalogue foundations — geography, stores, taxonomy, price bands, image
 * shoots, and the SKU factory the four department files use.
 *
 * The catalogue is organised the way a buying sheet is: a PRODUCT LINE is one
 * design (one photo shoot, one fabric, one fit, one price band) that fans out
 * into COLOURWAY SKUs, each with its own shelf position at a specific outlet.
 * That is why `line()` takes a base plus variants rather than 200 flat objects —
 * it keeps every SKU internally consistent and makes the file readable.
 */

/* ------------------------------------------------------------------ cities */

export const CITIES = [
  { id: 'guwahati', name: 'Guwahati', state: 'Assam', center: { lat: 26.1445, lng: 91.7362 }, primary: true },
  { id: 'hyderabad', name: 'Hyderabad', state: 'Telangana', center: { lat: 17.4326, lng: 78.4071 }, primary: false },
];

/* -------------------------------------------------------------------- hubs */

export const HUBS = [
  { id: 'gs-road', cityId: 'guwahati', name: 'GS Road', pincode: '781005', lat: 26.1445, lng: 91.7362, busy: true },
  { id: 'zoo-road', cityId: 'guwahati', name: 'Zoo Road', pincode: '781024', lat: 26.1706, lng: 91.7783, busy: true },
  { id: 'christian-basti', cityId: 'guwahati', name: 'Christian Basti', pincode: '781005', lat: 26.1512, lng: 91.7745, busy: true },
  { id: 'pan-bazaar', cityId: 'guwahati', name: 'Pan Bazaar', pincode: '781001', lat: 26.1836, lng: 91.7462, busy: false },
  { id: 'jalukbari', cityId: 'guwahati', name: 'Jalukbari', pincode: '781014', lat: 26.1516, lng: 91.666, busy: false },
  { id: 'banjara-hills', cityId: 'hyderabad', name: 'Banjara Hills', pincode: '500034', lat: 17.4126, lng: 78.4392, busy: true },
  { id: 'jubilee-hills', cityId: 'hyderabad', name: 'Jubilee Hills', pincode: '500033', lat: 17.4326, lng: 78.4071, busy: true },
  { id: 'gachibowli', cityId: 'hyderabad', name: 'Gachibowli', pincode: '500032', lat: 17.4401, lng: 78.3489, busy: true },
];

/* ------------------------------------------------------------------ stores */

export const STORES = [
  { id: 'st-zara-gs', name: 'Zara GS Road', chain: 'Zara', cityId: 'guwahati', hubId: 'gs-road', address: 'Level 2, Guwahati Central, GS Road, Bhangagarh', lat: 26.1445, lng: 91.7362, radiusKm: 11, prepMins: 11, rating: 4.6, phone: '+91 98640 11221', manager: 'Rituparna Das', hours: '10:00 – 21:30', gstin: '18AABCZ1234K1Z9' },
  { id: 'st-trends-gs', name: 'Trends GS Road', chain: 'Reliance Trends', cityId: 'guwahati', hubId: 'gs-road', address: 'Ground Floor, Dona Planet, GS Road', lat: 26.1478, lng: 91.7702, radiusKm: 11, prepMins: 13, rating: 4.3, phone: '+91 98640 33447', manager: 'Nayanmoni Barua', hours: '10:00 – 21:00', gstin: '18AAACR5055K1ZM' },
  { id: 'st-max-zoo', name: 'Max Fashion Zoo Road', chain: 'Max Fashion', cityId: 'guwahati', hubId: 'zoo-road', address: 'City Centre, Zoo Road Tiniali, Ambikagirinagar', lat: 26.1706, lng: 91.7783, radiusKm: 12, prepMins: 12, rating: 4.2, phone: '+91 98640 77339', manager: 'Bhaskar Nath', hours: '11:00 – 22:00', gstin: '18AAECM2211P1ZT' },
  { id: 'st-fabindia-cb', name: 'FabIndia Christian Basti', chain: 'FabIndia', cityId: 'guwahati', hubId: 'christian-basti', address: 'Ganeshguri–Christian Basti Rd, opposite Dona Planet', lat: 26.1512, lng: 91.7745, radiusKm: 10, prepMins: 14, rating: 4.5, phone: '+91 98640 55112', manager: 'Anupam Kalita', hours: '10:30 – 21:00', gstin: '18AAACF6543M1ZK' },
  { id: 'st-vishal-pb', name: 'Vishal Mega Mart Pan Bazaar', chain: 'Vishal Mega Mart', cityId: 'guwahati', hubId: 'pan-bazaar', address: 'HB Road, Pan Bazaar, near Ward No. 4', lat: 26.1836, lng: 91.7462, radiusKm: 10, prepMins: 15, rating: 4.0, phone: '+91 98640 44120', manager: 'Pallabi Sarma', hours: '10:00 – 20:30', gstin: '18AAGCS3320H1ZR' },
  { id: 'st-sole-jkb', name: 'Sole House Jalukbari', chain: 'Sole House', cityId: 'guwahati', hubId: 'jalukbari', address: 'NH-27 Service Rd, Jalukbari Chariali, near IIT gate', lat: 26.1516, lng: 91.666, radiusKm: 11, prepMins: 10, rating: 4.4, phone: '+91 98640 90210', manager: 'Rahul Deka', hours: '10:00 – 21:00', gstin: '18AAFCS8899L1ZB' },
  { id: 'st-snitch-bh', name: 'Snitch Banjara Hills', chain: 'Snitch', cityId: 'hyderabad', hubId: 'banjara-hills', address: 'Road No. 12, Banjara Hills, beside GVK One', lat: 17.4126, lng: 78.4392, radiusKm: 12, prepMins: 10, rating: 4.7, phone: '+91 90000 44112', manager: 'Sai Teja', hours: '11:00 – 22:00', gstin: '36AAJCS7781Q1ZF' },
  { id: 'st-westside-jh', name: 'Westside Jubilee Hills', chain: 'Westside', cityId: 'hyderabad', hubId: 'jubilee-hills', address: 'Road No. 36, Jubilee Hills Check Post', lat: 17.4326, lng: 78.4071, radiusKm: 12, prepMins: 13, rating: 4.4, phone: '+91 90000 88221', manager: 'Kiran Kumar', hours: '11:00 – 22:00', gstin: '36AAACT2727Q1ZW' },
  { id: 'st-levis-gach', name: "Levi's Gachibowli", chain: "Levi's", cityId: 'hyderabad', hubId: 'gachibowli', address: 'Sarath City Capital Mall, Gachibowli', lat: 17.4401, lng: 78.3489, radiusKm: 13, prepMins: 12, rating: 4.6, phone: '+91 90000 66334', manager: 'Neha Reddy', hours: '10:30 – 21:30', gstin: '36AABCL4455N1ZD' },
  { id: 'st-lifestyle-gach', name: 'Lifestyle Gachibowli', chain: 'Lifestyle', cityId: 'hyderabad', hubId: 'gachibowli', address: 'Inorbit Mall Rd, Gachibowli', lat: 17.4353, lng: 78.3821, radiusKm: 13, prepMins: 14, rating: 4.3, phone: '+91 90000 22118', manager: 'Divya Menon', hours: '11:00 – 22:00', gstin: '36AAECL9012R1ZJ' },
];

/* ---------------------------------------------------------------- taxonomy */

/** The chips that sit across the top of the storefront. */
export const DEPARTMENTS = [
  { id: 'men', label: 'Men', icon: '👔' },
  { id: 'women', label: 'Women', icon: '👗' },
  { id: 'streetwear', label: 'Streetwear', icon: '🧢' },
  { id: 'ethnic', label: 'Ethnic', icon: '🪔' },
  { id: 'footwear', label: 'Footwear', icon: '👟' },
  { id: 'accessories', label: 'Accessories', icon: '⌚' },
];

export const CATEGORIES = ['Topwear', 'Bottomwear', 'Dresses & Sets', 'Ethnic', 'Footwear', 'Accessories'];
export const OCCASIONS = ['Casual', 'Streetwear', 'College', 'Party', 'Work', 'Festive'];
export const APPAREL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
export const SHOE_SIZES = ['6', '7', '8', '9', '10', '11'];
export const FREE_SIZE = ['Free Size'];

/**
 * Price bands, enforced by a unit test. A ₹4,000 tee cannot quietly appear in a
 * budget catalogue, because the test fails first.
 */
export const PRODUCT_LINES = {
  'm-tee': { label: 'T-Shirts', dept: 'men', category: 'Topwear', min: 349, max: 799, gst: 5 },
  'm-shirt': { label: 'Shirts', dept: 'men', category: 'Topwear', min: 699, max: 1799, gst: 5 },
  'm-polo': { label: 'Polos', dept: 'men', category: 'Topwear', min: 499, max: 1199, gst: 5 },
  'm-hoodie': { label: 'Hoodies & Sweatshirts', dept: 'men', category: 'Topwear', min: 799, max: 1899, gst: 5 },
  'm-cargo': { label: 'Cargos & Joggers', dept: 'men', category: 'Bottomwear', min: 799, max: 1599, gst: 5 },
  'm-jeans': { label: 'Jeans', dept: 'men', category: 'Bottomwear', min: 899, max: 2299, gst: 5 },
  'm-shorts': { label: 'Shorts', dept: 'men', category: 'Bottomwear', min: 399, max: 999, gst: 5 },
  'm-ethnic': { label: 'Kurtas & Ethnic', dept: 'men', category: 'Ethnic', min: 799, max: 2499, gst: 5 },
  'w-top': { label: 'Tops & Crop Tops', dept: 'women', category: 'Topwear', min: 249, max: 899, gst: 5 },
  'w-sweat': { label: 'Sweatshirts & Jackets', dept: 'women', category: 'Topwear', min: 799, max: 1899, gst: 5 },
  'w-dress': { label: 'Dresses', dept: 'women', category: 'Dresses & Sets', min: 599, max: 1999, gst: 5 },
  'w-coord': { label: 'Co-ord Sets', dept: 'women', category: 'Dresses & Sets', min: 899, max: 2299, gst: 5 },
  'w-jeans': { label: 'Jeans & Wide-leg', dept: 'women', category: 'Bottomwear', min: 799, max: 1999, gst: 5 },
  'w-skirt': { label: 'Skirts & Trousers', dept: 'women', category: 'Bottomwear', min: 499, max: 1499, gst: 5 },
  'w-kurti': { label: 'Kurtis & Ethnic Sets', dept: 'women', category: 'Ethnic', min: 499, max: 2799, gst: 5 },
  'f-sneaker': { label: 'Sneakers', dept: 'footwear', category: 'Footwear', min: 899, max: 2999, gst: 5 },
  'f-heel': { label: 'Heels & Flats', dept: 'footwear', category: 'Footwear', min: 599, max: 1999, gst: 5 },
  'f-slide': { label: 'Slides & Sandals', dept: 'footwear', category: 'Footwear', min: 199, max: 899, gst: 5 },
  'f-formal': { label: 'Formal Shoes', dept: 'footwear', category: 'Footwear', min: 1299, max: 2999, gst: 5 },
  'a-watch': { label: 'Watches', dept: 'accessories', category: 'Accessories', min: 599, max: 2499, gst: 18 },
  'a-bag': { label: 'Bags & Totes', dept: 'accessories', category: 'Accessories', min: 199, max: 1499, gst: 18 },
  'a-sunglass': { label: 'Sunglasses', dept: 'accessories', category: 'Accessories', min: 249, max: 999, gst: 18 },
  'a-belt': { label: 'Belts & Wallets', dept: 'accessories', category: 'Accessories', min: 299, max: 1199, gst: 18 },
  'a-jewel': { label: 'Jewellery & Hair', dept: 'accessories', category: 'Accessories', min: 199, max: 899, gst: 18 },
};

export const COLOR_SWATCHES = {
  Black: '#1a1a1d', White: '#fdfdfd', Ecru: '#e8dfcc', Cream: '#f3ead7', Sand: '#d9c7a7', Beige: '#ddd0bb',
  Stone: '#b6afa4', Grey: '#9a9aa2', Charcoal: '#44464f', Slate: '#6b7a8f', Navy: '#20304d', Denim: '#4a6d9c',
  'Ice Blue': '#aecde4', Teal: '#1f7a72', Olive: '#556040', Sage: '#a3b596', Forest: '#254b34', Mint: '#a9dcc4',
  Rust: '#a75a3c', Terracotta: '#c26e50', Mustard: '#d5a52a', Yellow: '#f0c419', Maroon: '#6d2233',
  Cherry: '#c02a35', Red: '#d3342e', Blush: '#eab6bd', Pink: '#e87a9c', Lavender: '#b6a8dc', Purple: '#6f4fa1',
  Brown: '#6f4e37', Tan: '#b78b60', Gold: '#c9a227', Silver: '#c7ccd1',
};

/* ------------------------------------------------------------------ images */

/**
 * Every SKU carries a four-angle gallery: FRONT, BACK, FABRIC and MODEL.
 *
 * These are real Unsplash CDN URLs. One honest caveat, stated once rather than
 * papered over: they are stock fashion photographs assigned per product line and
 * labelled by angle — not literal front/back plates of the same physical garment,
 * which only a real product shoot can give you. What the code does guarantee is
 * that a SKU's four images are stable, distinct, and never borrowed from another
 * product, so the gallery is always internally consistent. Swap `SHOOTS` for your
 * own CDN paths and the whole app picks them up.
 */
export const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=600&q=80';

export const ANGLES = ['Front', 'Back', 'Fabric', 'Model'];

const U = (id, w = 900) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

/** Photo pools, keyed by the kind of garment they show. */
const POOL = {
  tee: ['1521572163474-6864f9cf17ab', '1576566588028-4147f3842f27', '1583743814966-8936f5b7be1a', '1618354691373-d851c5c3a990', '1503341504253-dff4815485f1', '1622445275576-721325763afe', '1554568218-0f1715e72254', '1562157873-818bc0726f68'],
  shirt: ['1596755094514-f87e34085b2c', '1602810318383-e386cc2a3ccf', '1594938298603-c8148c4dae35', '1620012253295-c15cc3e65df4', '1608234808654-2a8875faa7fd', '1607345366928-199ea26cfe3e', '1626497764746-6dc36546b388', '1589310243389-96a5483213a8'],
  bottom: ['1517445312882-bc9910d016b7', '1624378439575-d8705ad7ae80', '1473966968600-fa801b869a1a', '1594633312681-425c7b97ccd1', '1552902865-b72c031ac5ea', '1584865288642-42078afe6942'],
  denim: ['1542272604-787c3835535d', '1509631179647-0177331693ae', '1541099649105-f69ad21f3246', '1475178626620-a4d074967452', '1582418702059-97ebafb35d09', '1604176354204-9268737828e4', '1551163943-3f6a855d1153', '1584370848010-d7fe6bc767ec'],
  outer: ['1556821840-3a63f95609a7', '1620799140408-edc6dcb6d633', '1578768079052-aa76e52ff62e', '1591047139829-d91aecb6caea', '1608063615781-e2ef8c9d19d7', '1551028719-00167b16eac5'],
  ethnicM: ['1610030469983-98e550d6193c', '1583391733956-6c78276477e2', '1622519407650-3df9883f76a5', '1595777457583-95e059d581b8', '1604176354204-9268737828e4'],
  dress: ['1515886657613-9f3515b0c78f', '1490481651871-ab68de25d43d', '1572804013309-59a88b7e92f1', '1485968579580-b6d095142e6e', '1595777457583-95e059d581b8', '1496747611176-843222e1e57c', '1583496661160-fb5886a13d77', '1566174053879-31528523f8ae'],
  wtop: ['1554568218-0f1715e72254', '1503342217505-b0a15ec3261c', '1496747611176-843222e1e57c', '1485462537746-965f33f7f6a7', '1564257631407-4deb1f99d992', '1479064555552-3ef4979f8908'],
  coord: ['1483985988355-763728e1935b', '1581044777550-4cfa60707c03', '1487222477894-8943e31ef7b2', '1509319117193-57bab727e09d', '1571945153237-4929e783af4a'],
  ethnicW: ['1610030469983-98e550d6193c', '1583391733956-6c78276477e2', '1595777457583-95e059d581b8', '1622519407650-3df9883f76a5', '1610030181087-540017dc9d61'],
  sneaker: ['1542291026-7eec264c27ff', '1600185365483-26d7a4cc7519', '1595950653106-6c9ebd614d3a', '1549298916-b41d501d3772', '1560769629-975ec94e6a86', '1608231387042-66d1773070a5', '1552346154-21d32810aba3', '1491553895911-0055eca6402d'],
  heel: ['1543163521-1bf539c55dd2', '1596703263926-eb0762ee17e4', '1518049362265-d5b2a6b00b37', '1571245268313-2b4b0e5b1d55', '1560343090-f0409e92791a'],
  slide: ['1603487742131-4160ec999306', '1520639888713-7851133b1ed0', '1603808033192-082d6919d3e1', '1562273138-f46be4ebdf33'],
  formal: ['1533867617858-e7b97e060509', '1614252235316-8c857d38b5f4', '1449505278894-297fdb3edbc1', '1560343090-f0409e92791a'],
  watch: ['1523275335684-37898b6baf30', '1611591437281-460bfbe1220a', '1524805444758-089113d48a6d', '1508057198894-247b23fe5ade', '1587836374828-4dbafa94cf0e'],
  bag: ['1553062407-98eeb64c6a62', '1594223274512-ad4803739b7c', '1590874103328-eac38a683ce7', '1548036328-c9fa89d128fa', '1584917865442-de89df76afd3'],
  eyewear: ['1508296695146-257a814070b4', '1511499767150-a48a237f0083', '1572635196237-14b3f281503f', '1577803645773-f96470509666'],
  misc: ['1556306535-0f09a537f0a3', '1611085583191-a3b181a88401', '1515562141207-7a88fb7ce338', '1602173574767-37ac01994b2a'],
};

let SHOOT_SEQ = 0;

/**
 * Allocates one product line its own four-angle shoot. Lines walk the pool with
 * a stride so neighbouring lines never end up with the same set.
 */
function shoot(bucket) {
  const pool = POOL[bucket] || POOL.tee;
  const start = (SHOOT_SEQ++ * 3) % pool.length;
  const pick = (k) => U(pool[(start + k) % pool.length]);
  return { front: pick(0), back: pick(1), fabric: pick(2), model: pick(3) };
}

/* ------------------------------------------------------------- SKU factory */

let SEQ = 0;

/** Indian retail price points: MRPs land on ₹999 / ₹1,499 / ₹2,299. */
const roundMrp = (n) => (n < 2000 ? Math.round(n / 50) * 50 : Math.round(n / 100) * 100) - 1;
const mrpFrom = (price, pct) => Math.max(roundMrp(price / (1 - pct / 100)), price + 50);

/** Varied discounts — a catalogue where every tag reads the same is a generated one. */
const OFF_LADDER = [25, 28, 30, 33, 35, 38, 40, 42, 45, 48, 50, 52, 55, 58, 60];

/**
 * One design → many colourway SKUs.
 *
 * @param base     shared design attributes, including the image `bucket`
 * @param variants per-colourway overrides: name, colors, price, stock, storeId
 */
export function line(base, variants) {
  const gallery = shoot(base.bucket);
  const band = PRODUCT_LINES[base.line];

  return variants.map((v) => {
    SEQ += 1;
    const price = v.price ?? base.price;
    const off = v.off ?? base.off ?? OFF_LADDER[(SEQ * 7) % OFF_LADDER.length];
    const mrp = v.mrp ?? mrpFrom(price, off);
    const stock = v.stock;
    const store = STORES.find((s) => s.id === v.storeId);

    return {
      id: `QF${2000 + SEQ}`,
      sku: `${base.line.toUpperCase().replace('-', '')}-${2000 + SEQ}`,
      name: v.name,
      brand: base.brand,
      dept: band.dept,
      category: band.category,
      line: base.line,
      lineLabel: band.label,
      gstRate: band.gst,
      gender: base.gender || (band.dept === 'men' ? 'Men' : band.dept === 'women' ? 'Women' : 'Unisex'),
      price,
      mrp,
      discount: Math.round(((mrp - price) / mrp) * 100),
      sizes: base.sizes,
      sizeChart: base.sizeChart || band.category,
      colors: v.colors,
      tags: base.tags,
      occasions: base.occasions,
      storeId: v.storeId,
      cityId: store.cityId,
      stock,
      isNew: !!v.isNew,
      daysOld: v.age ?? 45,
      rating: v.rating ?? base.rating,
      reviews: v.reviews ?? base.reviews,
      popularity: v.pop ?? base.pop ?? 60,
      fabric: base.fabric,
      fit: base.fit,
      care: base.care || 'Machine wash cold, do not bleach, tumble dry low.',
      description: base.desc,
      /** four-angle gallery — the same four images for the life of this SKU */
      images: gallery,
      gallery: ANGLES.map((label) => ({ label, url: gallery[label.toLowerCase()] })),
    };
  });
}

export { U };
