/** Accessories buying sheet — 30 SKUs across 5 product lines. */

import { line, FREE_SIZE } from './catalogBase.js';

const ONE = FREE_SIZE;

export const ACCESSORIES = [
  /* ---------------------------------------------------------- Watches (8) */
  ...line(
    {
      line: 'a-watch', brand: 'Fastrack', bucket: 'watch', sizes: ONE, gender: 'Unisex',
      occasions: ['Casual', 'Work'], tags: ['minimal', 'gifting', 'leather'],
      fabric: 'Stainless steel case, leather strap', fit: '40 mm case, 20 mm strap', rating: 4.2, reviews: 1140, pop: 80,
      desc: 'A 40 mm case, clean dial, no complications. The watch you wear when you own one watch.',
      care: 'Keep the leather strap dry. Water resistant to 3 ATM — splashes only.',
    },
    [
      { name: 'Minimalist Leather Strap Watch', colors: ['Black'], price: 1799, storeId: 'st-max-zoo', stock: 12 },
      { name: 'Minimalist Leather Strap Watch', colors: ['Brown'], price: 1799, storeId: 'st-max-zoo', stock: 6 },
      { name: 'Minimalist Leather Strap Watch', colors: ['Tan'], price: 1799, storeId: 'st-trends-gs', stock: 1 },
    ]
  ),
  ...line(
    {
      line: 'a-watch', brand: 'Titan', bucket: 'watch', sizes: ONE, gender: 'Unisex',
      occasions: ['Work', 'Party'], tags: ['premium', 'steel', 'gifting'],
      fabric: 'Stainless steel bracelet, sapphire-coated crystal', fit: '38 mm case', rating: 4.5, reviews: 620, pop: 78,
      desc: 'Brushed steel bracelet, sapphire-coated crystal, 5 ATM. Quietly good rather than loud.',
      care: 'Links can be removed free at any Titan counter.',
    },
    [
      { name: 'Slim Steel Bracelet Watch', colors: ['Silver'], price: 2499, storeId: 'st-lifestyle-gach', stock: 5 },
      { name: 'Slim Steel Bracelet Watch', colors: ['Gold'], price: 2499, storeId: 'st-lifestyle-gach', stock: 0 },
      { name: 'Slim Steel Bracelet Watch', colors: ['Black'], price: 2499, storeId: 'st-westside-jh', stock: 4 },
    ]
  ),
  ...line(
    {
      line: 'a-watch', brand: 'Fastrack', bucket: 'watch', sizes: ONE, gender: 'Women',
      occasions: ['College', 'Casual'], tags: ['value', 'minimal', 'mesh'],
      fabric: 'Mesh steel strap', fit: '32 mm case', rating: 4.0, reviews: 812, pop: 66,
      desc: 'A 32 mm mesh-strap watch that fits a small wrist without sliding around all day.',
    },
    [
      { name: 'Mesh Strap Analog Watch', colors: ['Blush'], price: 599, storeId: 'st-trends-gs', stock: 18 },
      { name: 'Mesh Strap Analog Watch', colors: ['Black'], price: 599, storeId: 'st-trends-gs', stock: 24 },
    ]
  ),

  /* ------------------------------------------------------ Bags & totes (8) */
  ...line(
    {
      line: 'a-bag', brand: 'Chumbak', bucket: 'bag', sizes: ONE, gender: 'Unisex',
      occasions: ['College', 'Casual'], tags: ['canvas', 'value', 'sustainable', 'printed'],
      fabric: '12 oz cotton canvas, reinforced base', fit: '38 × 42 cm', rating: 4.1, reviews: 456, pop: 69,
      desc: 'Heavy 12 oz canvas with a reinforced base. Holds a laptop, a tiffin and a water bottle without sagging.',
      care: 'Machine wash cold, air dry flat.',
    },
    [
      { name: 'Printed Canvas Tote', colors: ['Ecru'], price: 349, storeId: 'st-vishal-pb', stock: 26 },
      { name: 'Printed Canvas Tote', colors: ['Black'], price: 349, storeId: 'st-vishal-pb', stock: 19 },
      { name: 'Printed Canvas Tote', colors: ['Olive'], price: 349, storeId: 'st-max-zoo', stock: 11 },
    ]
  ),
  ...line(
    {
      line: 'a-bag', brand: 'Baggit', bucket: 'bag', sizes: ONE, gender: 'Women',
      occasions: ['Party', 'Work'], tags: ['sling', 'vegan-leather', 'everyday'],
      fabric: 'Vegan leather with metal chain', fit: '22 × 15 cm', rating: 4.2, reviews: 708, pop: 75,
      desc: 'Chain strap that converts from shoulder to crossbody. Fits a phone, a card holder and a kajal.',
    },
    [
      { name: 'Quilted Sling Bag', colors: ['Black'], price: 1199, storeId: 'st-westside-jh', stock: 15 },
      { name: 'Quilted Sling Bag', colors: ['Tan'], price: 1199, storeId: 'st-westside-jh', stock: 9 },
      { name: 'Quilted Sling Bag', colors: ['Maroon'], price: 1199, storeId: 'st-lifestyle-gach', stock: 2 },
    ]
  ),
  ...line(
    {
      line: 'a-bag', brand: 'Wildcraft', bucket: 'bag', sizes: ONE, gender: 'Unisex',
      occasions: ['College', 'Casual'], tags: ['backpack', 'laptop', 'durable'],
      fabric: 'Ripstop polyester, padded laptop sleeve', fit: '30 L, fits 15.6"', rating: 4.4, reviews: 1892, pop: 86,
      desc: '30 litres with a padded 15.6-inch sleeve and a rain flap. The default Indian campus backpack.',
    },
    [
      { name: 'Daypack 30L Backpack', colors: ['Navy'], price: 1499, storeId: 'st-vishal-pb', stock: 17 },
      { name: 'Daypack 30L Backpack', colors: ['Charcoal'], price: 1499, storeId: 'st-max-zoo', stock: 13 },
    ]
  ),

  /* ------------------------------------------------------- Sunglasses (6) */
  ...line(
    {
      line: 'a-sunglass', brand: 'Vincent Chase', bucket: 'eyewear', sizes: ONE, gender: 'Unisex',
      occasions: ['Casual', 'Streetwear'], tags: ['polarised', 'uv400', 'trending'],
      fabric: 'Acetate frame, polarised lens', fit: '52 mm lens width', rating: 4.3, reviews: 1320, pop: 83,
      desc: 'Polarised UV400 lenses in an acetate frame. Cuts glare off the Brahmaputra completely.',
      care: 'Use the pouch. Never wipe dry lenses with a shirt.',
    },
    [
      { name: 'Polarised Wayfarer Sunglasses', colors: ['Black'], price: 999, storeId: 'st-max-zoo', stock: 17 },
      { name: 'Polarised Wayfarer Sunglasses', colors: ['Brown'], price: 999, storeId: 'st-max-zoo', stock: 1 },
      { name: 'Polarised Wayfarer Sunglasses', colors: ['Gold'], price: 999, storeId: 'st-vishal-pb', stock: 8 },
    ]
  ),
  ...line(
    {
      line: 'a-sunglass', brand: 'Fastrack', bucket: 'eyewear', sizes: ONE, gender: 'Women',
      occasions: ['College', 'Party'], tags: ['value', 'uv400', 'oversized'],
      fabric: 'Polycarbonate frame', fit: '54 mm lens width', rating: 4.0, reviews: 702, pop: 65,
      desc: 'Lightweight polycarbonate at ₹249 — the pair you can lose without it ruining your week.',
    },
    [
      { name: 'Oversized Cat-Eye Sunglasses', colors: ['Black'], price: 249, storeId: 'st-trends-gs', stock: 31 },
      { name: 'Oversized Cat-Eye Sunglasses', colors: ['Blush'], price: 249, storeId: 'st-trends-gs', stock: 24 },
      { name: 'Oversized Cat-Eye Sunglasses', colors: ['Brown'], price: 249, storeId: 'st-vishal-pb', stock: 0 },
    ]
  ),

  /* -------------------------------------------------- Belts & wallets (4) */
  ...line(
    {
      line: 'a-belt', brand: "Levi's", bucket: 'misc', sizes: ONE, gender: 'Men',
      occasions: ['Work', 'Casual'], tags: ['leather', 'reversible', 'gifting'],
      fabric: 'Genuine leather, rotating buckle', fit: 'Trimmable to 42"', rating: 4.2, reviews: 487, pop: 62,
      desc: 'Black one day, brown the next. Rotating buckle, trimmable to 42 inches.',
    },
    [
      { name: 'Reversible Leather Belt', colors: ['Black'], price: 1199, storeId: 'st-levis-gach', stock: 20 },
      { name: 'Reversible Leather Belt', colors: ['Brown'], price: 1199, storeId: 'st-levis-gach', stock: 14 },
    ]
  ),
  ...line(
    {
      line: 'a-belt', brand: 'Hidesign', bucket: 'misc', sizes: ONE, gender: 'Unisex',
      occasions: ['Work', 'Casual'], tags: ['leather', 'premium', 'gifting'],
      fabric: 'Vegetable-tanned leather', fit: '6 card slots + note compartment', rating: 4.5, reviews: 312, pop: 64,
      desc: 'Vegetable-tanned leather that darkens with use. Six card slots and a note compartment, nothing more.',
    },
    [
      { name: 'Bifold Leather Wallet', colors: ['Brown'], price: 1199, storeId: 'st-lifestyle-gach', stock: 9 },
      { name: 'Bifold Leather Wallet', colors: ['Black'], price: 1199, storeId: 'st-lifestyle-gach', stock: 5 },
    ]
  ),

  /* ---------------------------------------------- Jewellery & hair (4) */
  ...line(
    {
      line: 'a-jewel', brand: 'Accessorize', bucket: 'misc', sizes: ONE, gender: 'Women',
      occasions: ['Party', 'Festive'], tags: ['layered', 'gifting', 'trending'],
      fabric: 'Gold-plated brass, anti-tarnish coating', fit: '16" + 18" adjustable', rating: 4.1, reviews: 398, pop: 71,
      desc: 'Two chains at different lengths so the layering stays put instead of tangling all evening.',
      care: 'Keep away from perfume and water.',
    },
    [
      { name: 'Layered Chain Necklace Set', colors: ['Gold'], price: 899, storeId: 'st-westside-jh', stock: 16 },
      { name: 'Layered Chain Necklace Set', colors: ['Silver'], price: 899, storeId: 'st-westside-jh', stock: 11 },
    ]
  ),
  ...line(
    {
      line: 'a-jewel', brand: 'Accessorize', bucket: 'misc', sizes: ONE, gender: 'Women',
      occasions: ['Casual', 'College'], tags: ['hair', 'value', 'everyday'],
      fabric: 'Cellulose acetate', fit: 'Large claw, holds thick hair', rating: 4.3, reviews: 1105, pop: 74,
      desc: 'A large acetate claw with real grip — the kind that holds thick hair through a scooter ride.',
    },
    [
      { name: 'Acetate Hair Claw Set', colors: ['Cream'], price: 199, storeId: 'st-trends-gs', stock: 38 },
      { name: 'Acetate Hair Claw Set', colors: ['Black'], price: 199, storeId: 'st-vishal-pb', stock: 42 },
    ]
  ),
];

export default ACCESSORIES;
