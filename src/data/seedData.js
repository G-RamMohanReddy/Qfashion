/**
 * seedData.js — the single import surface for the whole catalogue.
 *
 * The 206 SKUs live in four department files (the way a real buying sheet is
 * split) and are aggregated here alongside geography, sizing metadata, upcoming
 * brand tie-ups and the platform's commercial constants.
 *
 *   import { PRODUCTS, STORES, HUBS, SIZE_CHARTS, PLATFORM } from '@/data/seedData.js';
 */

import { MEN } from './products.men.js';
import { WOMEN } from './products.women.js';
import { FOOTWEAR } from './products.footwear.js';
import { ACCESSORIES } from './products.accessories.js';

export * from './catalogBase.js';

/** Every SKU, in the order a merchandiser would lay the floor out. */
export const PRODUCTS = [...MEN, ...WOMEN, ...FOOTWEAR, ...ACCESSORIES];

export { MEN, WOMEN, FOOTWEAR, ACCESSORIES };

/* ------------------------------------------------------------- size charts */

const IN_TO_CM = 2.54;
export const toCm = (inches) => Math.round(inches * IN_TO_CM * 10) / 10;

/**
 * Sizing metadata, stored in inches and converted to centimetres on render so
 * the two units can never drift apart.
 *
 * `fitAdvice` is what actually reduces returns: it tells a shopper what to do
 * when they are between sizes, which is the case most size charts leave out.
 */
export const SIZE_CHARTS = {
  Topwear: {
    unit: 'Body measurements',
    columns: [
      { key: 'size', label: 'Size' },
      { key: 'chest', label: 'Chest / Bust', convert: true },
      { key: 'waist', label: 'Waist', convert: true },
      { key: 'length', label: 'Length', convert: true },
      { key: 'shoulder', label: 'Shoulder', convert: true },
    ],
    rows: [
      { size: 'XS', chest: 34, waist: 28, length: 26, shoulder: 15.5 },
      { size: 'S', chest: 36, waist: 30, length: 27, shoulder: 16.5 },
      { size: 'M', chest: 38, waist: 32, length: 28, shoulder: 17.5 },
      { size: 'L', chest: 40, waist: 34, length: 29, shoulder: 18.5 },
      { size: 'XL', chest: 42, waist: 36, length: 30, shoulder: 19.5 },
      { size: 'XXL', chest: 44, waist: 38, length: 31, shoulder: 20.5 },
    ],
    fitAdvice: [
      'Measure your chest at the fullest point, keeping the tape level and not tight.',
      'Between two sizes? Go up. Exchanges are free and usually same-day.',
      'Anything labelled Oversized is already cut two sizes generous — take your normal size.',
    ],
  },
  Bottomwear: {
    unit: 'Body measurements',
    columns: [
      { key: 'size', label: 'Size' },
      { key: 'waist', label: 'Waist', convert: true },
      { key: 'hip', label: 'Hip', convert: true },
      { key: 'inseam', label: 'Inseam', convert: true },
    ],
    rows: [
      { size: 'XS', waist: 28, hip: 35, inseam: 29 },
      { size: 'S', waist: 30, hip: 37, inseam: 30 },
      { size: 'M', waist: 32, hip: 39, inseam: 30 },
      { size: 'L', waist: 34, hip: 41, inseam: 31 },
      { size: 'XL', waist: 36, hip: 43, inseam: 31 },
      { size: 'XXL', waist: 38, hip: 45, inseam: 32 },
    ],
    fitAdvice: [
      'Measure your waist where you actually wear your jeans, not at the navel.',
      'Rigid (non-stretch) denim relaxes about half an inch after a few wears — buy it snug.',
      'Wide-leg and baggy fits are drafted roomy. Take your true waist, not a size up.',
    ],
  },
  'Dresses & Sets': {
    unit: 'Body measurements',
    columns: [
      { key: 'size', label: 'Size' },
      { key: 'bust', label: 'Bust', convert: true },
      { key: 'waist', label: 'Waist', convert: true },
      { key: 'hip', label: 'Hip', convert: true },
      { key: 'length', label: 'Length', convert: true },
    ],
    rows: [
      { size: 'XS', bust: 32, waist: 26, hip: 35, length: 36 },
      { size: 'S', bust: 34, waist: 28, hip: 37, length: 37 },
      { size: 'M', bust: 36, waist: 30, hip: 39, length: 38 },
      { size: 'L', bust: 38, waist: 32, hip: 41, length: 38 },
      { size: 'XL', bust: 40, waist: 34, hip: 43, length: 39 },
      { size: 'XXL', bust: 42, waist: 36, hip: 45, length: 39 },
    ],
    fitAdvice: [
      'For fit-and-flare styles, size to your bust — the skirt is cut full regardless.',
      'Bodycon and satin styles have no give. If your bust and waist land in different sizes, take the larger.',
      'Length is measured from the shoulder seam and assumes a height of about 5\'4".',
    ],
  },
  Ethnic: {
    unit: 'Body measurements',
    columns: [
      { key: 'size', label: 'Size' },
      { key: 'bust', label: 'Bust / Chest', convert: true },
      { key: 'waist', label: 'Waist', convert: true },
      { key: 'length', label: 'Kurta length', convert: true },
    ],
    rows: [
      { size: 'XS', bust: 34, waist: 28, length: 44 },
      { size: 'S', bust: 36, waist: 30, length: 45 },
      { size: 'M', bust: 38, waist: 32, length: 46 },
      { size: 'L', bust: 40, waist: 34, length: 46 },
      { size: 'XL', bust: 42, waist: 36, length: 47 },
      { size: 'XXL', bust: 44, waist: 38, length: 47 },
    ],
    fitAdvice: [
      'Handloom cotton shrinks roughly 2% on the first wash — size up if you are between.',
      'Kurtas are cut with ease built in. Take your true chest, not a size up.',
      'Anarkali and flared styles are sized to the bust; the flare is the same across sizes.',
    ],
  },
  Footwear: {
    unit: 'UK / EU / US and foot length',
    columns: [
      { key: 'size', label: 'UK' },
      { key: 'eu', label: 'EU' },
      { key: 'us', label: 'US' },
      { key: 'footCm', label: 'Foot length (cm)' },
    ],
    rows: [
      { size: '6', eu: '39', us: '7', footCm: 24.5 },
      { size: '7', eu: '40-41', us: '8', footCm: 25.4 },
      { size: '8', eu: '42', us: '9', footCm: 26.2 },
      { size: '9', eu: '43', us: '10', footCm: 27.1 },
      { size: '10', eu: '44', us: '11', footCm: 27.9 },
      { size: '11', eu: '45-46', us: '12', footCm: 28.8 },
    ],
    fitAdvice: [
      'Measure your foot in the evening, standing, heel against a wall — feet swell through the day.',
      'Leather sneakers and derbies run half a size small. Chunky-sole styles run roomy.',
      'If one foot is larger, size to the larger one.',
    ],
  },
  Accessories: {
    unit: '—',
    columns: [
      { key: 'size', label: 'Size' },
      { key: 'note', label: 'Notes' },
    ],
    rows: [{ size: 'Free Size', note: 'One size fits most. Belts are trimmable; watch links can be removed free in store.' }],
    fitAdvice: ['Watch straps fit wrists of 15–20 cm. Ask the store to remove links at pickup and it costs nothing.'],
  },
};

/** Brand-specific fit quirks, surfaced on the product page where they matter. */
export const BRAND_FIT_NOTES = {
  Zara: 'Zara runs about half a size small. Size up if you are between.',
  "Levi's": 'Waist sizing is true to the label. Rigid denim relaxes about half an inch.',
  FabIndia: 'Handloom cotton shrinks about 2% on the first wash. Size up.',
  Snitch: 'Oversized styles are already cut generous — stay at your usual size.',
  Bewakoof: 'Oversized fits run two sizes generous. Take your normal size.',
  Nike: 'True to size. Half a size up if you wear thick socks.',
  Adidas: 'Retro court styles run long — half a size down.',
  Crocs: 'Roomy by design. Size down if you are between.',
  Puma: 'True to size across sneakers and slides.',
};

/* --------------------------------------------------- brands landing soon */

/**
 * Partner tie-ups in the pipeline. Shown as a "Brands Landing Soon" rail with a
 * notify button — it is also the cheapest demand signal a marketplace can
 * collect before signing a contract.
 */
export const UPCOMING_BRANDS = [
  { id: 'pantaloons', name: 'Pantaloons', kind: 'Multi-brand department store', eta: 'Nov 2026', city: 'Guwahati', hub: 'GS Road', accent: '#5b3a8e', blurb: 'Full women’s and men’s floor, from workwear to festive.' },
  { id: 'bewakoof-flagship', name: 'Bewakoof Flagship', kind: 'Streetwear', eta: 'Nov 2026', city: 'Guwahati', hub: 'Zoo Road', accent: '#1f7a72', blurb: 'The full graphic library, not just the top sellers.' },
  { id: 'snitch-gs', name: 'Snitch', kind: 'Men’s fast fashion', eta: 'Dec 2026', city: 'Guwahati', hub: 'GS Road', accent: '#282c3f', blurb: 'Guwahati’s first Snitch counter — new drops every Thursday.' },
  { id: 'souled-store', name: 'The Souled Store', kind: 'Licensed graphics', eta: 'Dec 2026', city: 'Guwahati', hub: 'Christian Basti', blurb: 'Marvel, F.R.I.E.N.D.S and anime licences under one roof.', accent: '#c02a35' },
  { id: 'muga-atelier', name: 'Muga Atelier', kind: 'Local boutique · Assam silk', eta: 'Jan 2027', city: 'Guwahati', hub: 'Pan Bazaar', accent: '#c9a227', blurb: 'Sualkuchi weavers, Muga and Eri silk, made to measure.' },
  { id: 'thread-house', name: 'Thread & Co.', kind: 'Local boutique · Slow fashion', eta: 'Jan 2027', city: 'Guwahati', hub: 'Zoo Road', accent: '#556040', blurb: 'Small-batch linen and khadi from a two-person studio.' },
  { id: 'zudio', name: 'Zudio', kind: 'Value fashion', eta: 'Feb 2027', city: 'Hyderabad', hub: 'Gachibowli', accent: '#e12454', blurb: 'Everything under ₹999, restocked twice a week.' },
  { id: 'nykaa-fashion', name: 'Nykaa Fashion', kind: 'Curated multi-brand', eta: 'Feb 2027', city: 'Hyderabad', hub: 'Banjara Hills', accent: '#e87a9c', blurb: 'Occasion wear and the brands you cannot find offline.' },
];

/* ---------------------------------------------------------------- addresses */

export const ADDRESSES = [
  { id: 'ad-1', label: 'Home', cityId: 'guwahati', hubId: 'gs-road', line: 'Flat 4B, Sundarbari Apartments, Bhangagarh', landmark: 'Near Down Town Hospital', pincode: '781005', phone: '+91 98640 12345' },
  { id: 'ad-2', label: 'Office', cityId: 'guwahati', hubId: 'christian-basti', line: '3rd Floor, Aurora Tower, Christian Basti', landmark: 'Opposite Dona Planet', pincode: '781005', phone: '+91 98640 12345' },
  { id: 'ad-3', label: 'Hostel', cityId: 'guwahati', hubId: 'jalukbari', line: 'Room 212, Kapili Hostel, IIT Guwahati Road', landmark: 'Jalukbari Flyover', pincode: '781014', phone: '+91 98640 12345' },
  { id: 'ad-4', label: 'Home', cityId: 'hyderabad', hubId: 'jubilee-hills', line: 'Villa 22, Road No. 45, Jubilee Hills', landmark: 'Near Peddamma Temple', pincode: '500033', phone: '+91 90000 12345' },
  { id: 'ad-5', label: 'Work', cityId: 'hyderabad', hubId: 'gachibowli', line: 'Block C, DLF Cyber City, Gachibowli', landmark: 'Next to Sarath City Mall', pincode: '500032', phone: '+91 90000 12345' },
];

/* --------------------------------------------------------------- platform */

export const PLATFORM = {
  brand: 'Q Fashion',
  merchantName: 'Q Fashion Retail Pvt Ltd',
  deliveryPromise: '45–60 minutes',
  deliveryFee: 40,
  freeDeliveryAbove: 1499,
  platformFee: 15,
  gstApparel: 5,
  gstAccessories: 18,
  codLimit: 5000,
  codFee: 20,
  returnWindow: '7 days',
  supportPhone: '1800-419-7000',
  supportHours: '9 AM – 11 PM, all days',
};

export default { PRODUCTS, SIZE_CHARTS, UPCOMING_BRANDS, ADDRESSES, PLATFORM };
