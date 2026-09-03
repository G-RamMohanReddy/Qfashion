/** Footwear buying sheet — 34 SKUs across 4 product lines. */

import { line, SHOE_SIZES } from './catalogBase.js';

const UK = SHOE_SIZES;
const UK_W = ['6', '7', '8', '9'];

export const FOOTWEAR = [
  /* ---------------------------------------------------------- Sneakers (14) */
  ...line(
    {
      line: 'f-sneaker', brand: 'Puma', bucket: 'sneaker', sizes: UK, gender: 'Unisex',
      occasions: ['Casual', 'Streetwear'], tags: ['leather', 'classic', 'trending'],
      fabric: 'Leather upper, rubber cupsole', fit: 'True to size', rating: 4.5, reviews: 1988, pop: 94,
      desc: 'The white leather court shoe. Goes with denim, cargos and a kurta equally well.',
      care: 'Wipe with a damp cloth. Do not machine wash.',
    },
    [
      { name: 'Court Classic Leather Sneakers', colors: ['White'], price: 2499, storeId: 'st-sole-jkb', stock: 12 },
      { name: 'Court Classic Leather Sneakers', colors: ['Black'], price: 2499, storeId: 'st-sole-jkb', stock: 1 },
      { name: 'Court Classic Leather Sneakers', colors: ['Navy'], price: 2499, storeId: 'st-lifestyle-gach', stock: 7 },
    ]
  ),
  ...line(
    {
      line: 'f-sneaker', brand: 'Nike', bucket: 'sneaker', sizes: UK, gender: 'Unisex',
      occasions: ['Casual', 'Streetwear'], tags: ['mesh', 'cushioned', 'running', 'trending'],
      fabric: 'Engineered mesh, foam midsole', fit: 'True to size', rating: 4.7, reviews: 2521, pop: 96,
      desc: 'Breathable knit upper on a responsive foam midsole. Good for a 5 km and a full day of walking both.',
    },
    [
      { name: 'Air Runner Mesh Sneakers', colors: ['Black'], price: 2999, storeId: 'st-sole-jkb', stock: 9 },
      { name: 'Air Runner Mesh Sneakers', colors: ['White'], price: 2999, storeId: 'st-sole-jkb', stock: 5 },
      { name: 'Air Runner Mesh Sneakers', colors: ['Grey'], price: 2999, storeId: 'st-lifestyle-gach', stock: 0 },
    ]
  ),
  ...line(
    {
      line: 'f-sneaker', brand: 'Adidas', bucket: 'sneaker', sizes: UK, gender: 'Unisex',
      occasions: ['Casual', 'College'], tags: ['retro', 'classic', 'everyday'],
      fabric: 'Full-grain leather', fit: 'Size down half', rating: 4.6, reviews: 1634, pop: 92,
      desc: 'Low-profile retro court shoe with a gum sole. Half a size down if you are between sizes.',
    },
    [
      { name: 'Retro Court Sneakers', colors: ['White'], price: 2699, storeId: 'st-sole-jkb', stock: 11 },
      { name: 'Retro Court Sneakers', colors: ['Forest'], price: 2699, storeId: 'st-sole-jkb', stock: 6 },
      { name: 'Retro Court Sneakers', colors: ['Cream'], price: 2699, storeId: 'st-lifestyle-gach', stock: 3 },
    ]
  ),
  ...line(
    {
      line: 'f-sneaker', brand: 'Campus', bucket: 'sneaker', sizes: UK, gender: 'Unisex',
      occasions: ['College', 'Streetwear'], tags: ['chunky', 'value', 'trending'],
      fabric: 'Synthetic upper, EVA midsole', fit: 'Size up if wide', rating: 4.1, reviews: 2440, pop: 82,
      desc: 'A 4 cm stacked sole and a padded collar, at a price that makes it a sensible first sneaker.',
    },
    [
      { name: 'Chunky Sole Sneakers', colors: ['White'], price: 1299, storeId: 'st-sole-jkb', stock: 25 },
      { name: 'Chunky Sole Sneakers', colors: ['Black'], price: 1299, storeId: 'st-sole-jkb', stock: 18 },
      { name: 'Chunky Sole Sneakers', colors: ['Sand'], price: 1299, storeId: 'st-vishal-pb', stock: 12 },
    ]
  ),
  ...line(
    {
      line: 'f-sneaker', brand: 'Skechers', bucket: 'sneaker', sizes: UK, gender: 'Unisex',
      occasions: ['Casual', 'Work'], tags: ['comfort', 'memory-foam', 'walking'],
      fabric: 'Knit upper, memory-foam footbed', fit: 'True to size', rating: 4.4, reviews: 1120, pop: 85,
      desc: 'Memory-foam footbed on a light knit upper. Built for a day of standing, not a marathon.',
    },
    [
      { name: 'Air-Cooled Walking Sneakers', colors: ['Grey'], price: 2899, storeId: 'st-sole-jkb', stock: 8 },
      { name: 'Air-Cooled Walking Sneakers', colors: ['Navy'], price: 2899, storeId: 'st-lifestyle-gach', stock: 4 },
    ]
  ),

  /* --------------------------------------------------- Heels & flats (8) */
  ...line(
    {
      line: 'f-heel', brand: 'Westside', bucket: 'heel', sizes: UK_W, gender: 'Women',
      occasions: ['Party', 'Work'], tags: ['block-heel', 'evening', 'padded'],
      fabric: 'Micro-suede upper, padded footbed', fit: 'True to size', rating: 4.1, reviews: 397, pop: 74,
      desc: 'A 6 cm block heel with a padded footbed — the pair you can actually stand in for three hours.',
    },
    [
      { name: 'Block Heel Party Pumps', colors: ['Black'], price: 1699, storeId: 'st-westside-jh', stock: 9 },
      { name: 'Block Heel Party Pumps', colors: ['Maroon'], price: 1699, storeId: 'st-westside-jh', stock: 5 },
      { name: 'Block Heel Party Pumps', colors: ['Beige'], price: 1699, storeId: 'st-lifestyle-gach', stock: 0 },
    ]
  ),
  ...line(
    {
      line: 'f-heel', brand: 'Lifestyle', bucket: 'heel', sizes: UK_W, gender: 'Women',
      occasions: ['Work', 'Casual'], tags: ['flats', 'everyday', 'comfort'],
      fabric: 'Faux leather with cushioned insole', fit: 'True to size', rating: 4.2, reviews: 812, pop: 78,
      desc: 'Pointed ballet flats with a cushioned insole and a bit of give at the toe box.',
    },
    [
      { name: 'Pointed Ballet Flats', colors: ['Black'], price: 899, storeId: 'st-lifestyle-gach', stock: 21 },
      { name: 'Pointed Ballet Flats', colors: ['Tan'], price: 899, storeId: 'st-lifestyle-gach', stock: 14 },
      { name: 'Pointed Ballet Flats', colors: ['Blush'], price: 899, storeId: 'st-westside-jh', stock: 8 },
    ]
  ),
  ...line(
    {
      line: 'f-heel', brand: 'Metro', bucket: 'heel', sizes: UK_W, gender: 'Women',
      occasions: ['Party', 'Festive'], tags: ['kitten-heel', 'festive', 'strappy'],
      fabric: 'Metallic faux leather', fit: 'True to size', rating: 4.0, reviews: 264, pop: 68,
      desc: 'Strappy kitten-heel sandals with an ankle buckle that actually holds. Wedding-season standard.',
    },
    [
      { name: 'Strappy Kitten Heel Sandals', colors: ['Gold'], price: 1299, storeId: 'st-westside-jh', stock: 7 },
      { name: 'Strappy Kitten Heel Sandals', colors: ['Silver'], price: 1299, storeId: 'st-lifestyle-gach', stock: 2 },
    ]
  ),

  /* ------------------------------------------------ Slides & sandals (8) */
  ...line(
    {
      line: 'f-slide', brand: 'Puma', bucket: 'slide', sizes: UK, gender: 'Unisex',
      occasions: ['Casual'], tags: ['monsoon', 'eva', 'everyday'],
      fabric: 'EVA foam', fit: 'True to size', rating: 4.2, reviews: 1890, pop: 77,
      desc: 'Contoured EVA footbed with a moulded arch. Monsoon-proof and rinses clean under a tap.',
    },
    [
      { name: 'Contoured Sport Slides', colors: ['Black'], price: 899, storeId: 'st-sole-jkb', stock: 28 },
      { name: 'Contoured Sport Slides', colors: ['Navy'], price: 899, storeId: 'st-sole-jkb', stock: 22 },
      { name: 'Contoured Sport Slides', colors: ['Grey'], price: 899, storeId: 'st-vishal-pb', stock: 16 },
    ]
  ),
  ...line(
    {
      line: 'f-slide', brand: 'Bata', bucket: 'slide', sizes: UK, gender: 'Unisex',
      occasions: ['Casual'], tags: ['value', 'monsoon', 'rubber'],
      fabric: 'Moulded rubber', fit: 'True to size', rating: 3.9, reviews: 2410, pop: 62,
      desc: 'The ₹199 rubber slide. Wear it to the shop, wear it in the rain, wear it out.',
    },
    [
      { name: 'Everyday Rubber Slides', colors: ['Grey'], price: 199, storeId: 'st-sole-jkb', stock: 45 },
      { name: 'Everyday Rubber Slides', colors: ['Brown'], price: 199, storeId: 'st-vishal-pb', stock: 33 },
      { name: 'Everyday Rubber Slides', colors: ['Black'], price: 199, storeId: 'st-vishal-pb', stock: 39 },
    ]
  ),
  ...line(
    {
      line: 'f-slide', brand: 'Crocs', bucket: 'slide', sizes: UK, gender: 'Unisex',
      occasions: ['Casual', 'Streetwear'], tags: ['clog', 'trending', 'waterproof'],
      fabric: 'Croslite foam', fit: 'Roomy — size down if between', rating: 4.3, reviews: 1442, pop: 84,
      desc: 'The clog. Ventilated, waterproof, and immune to opinions about it.',
    },
    [
      { name: 'Classic Clog', colors: ['Olive'], price: 899, storeId: 'st-sole-jkb', stock: 13 },
      { name: 'Classic Clog', colors: ['Black'], price: 899, storeId: 'st-sole-jkb', stock: 1 },
    ]
  ),

  /* ------------------------------------------------------ Formal shoes (4) */
  ...line(
    {
      line: 'f-formal', brand: 'Hidesign', bucket: 'formal', sizes: UK, gender: 'Men',
      occasions: ['Work', 'Festive'], tags: ['leather', 'premium', 'office', 'resoleable'],
      fabric: 'Calf leather, leather sole', fit: 'True to size', rating: 4.5, reviews: 356, pop: 70,
      desc: 'Closed-lacing derby with a Goodyear welt. Resoleable, so it outlives the suit.',
      care: 'Polish monthly. Use shoe trees.',
    },
    [
      { name: 'Leather Derby Shoes', colors: ['Black'], price: 2999, storeId: 'st-sole-jkb', stock: 5 },
      { name: 'Leather Derby Shoes', colors: ['Brown'], price: 2999, storeId: 'st-lifestyle-gach', stock: 3 },
    ]
  ),
  ...line(
    {
      line: 'f-formal', brand: 'Red Tape', bucket: 'formal', sizes: UK, gender: 'Men',
      occasions: ['Work', 'Party'], tags: ['loafers', 'slip-on', 'office'],
      fabric: 'Burnished leather', fit: 'True to size', rating: 4.2, reviews: 588, pop: 72,
      desc: 'Slip-on loafers with a burnished toe and a flexible rubber sole. Formal without the laces.',
    },
    [
      { name: 'Burnished Leather Loafers', colors: ['Tan'], price: 1899, storeId: 'st-sole-jkb', stock: 10 },
      { name: 'Burnished Leather Loafers', colors: ['Black'], price: 1899, storeId: 'st-sole-jkb', stock: 6 },
    ]
  ),
];

export default FOOTWEAR;
