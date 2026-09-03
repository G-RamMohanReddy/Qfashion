/** Women's buying sheet — 72 SKUs across 7 product lines. */

import { line, APPAREL_SIZES } from './catalogBase.js';

const S_XXL = APPAREL_SIZES;
const XS_XL = ['XS', 'S', 'M', 'L', 'XL'];
const XS_L = ['XS', 'S', 'M', 'L'];

export const WOMEN = [
  /* ------------------------------------------------- Tops & crop tops (16) */
  ...line(
    {
      line: 'w-top', brand: 'Bewakoof', bucket: 'wtop', sizes: XS_L,
      occasions: ['Casual', 'College', 'Streetwear'], tags: ['ribbed', 'value', 'trending', 'layering'],
      fabric: 'Cotton-modal rib', fit: 'Fitted, square neck', rating: 4.2, reviews: 1610, pop: 89,
      desc: 'Fine-gauge rib with a square neck. Layers under a shirt or stands alone with high-rise denim.',
    },
    [
      { name: 'Ribbed Square Neck Crop Top', colors: ['Black'], price: 349, storeId: 'st-max-zoo', stock: 34 },
      { name: 'Ribbed Square Neck Crop Top', colors: ['Cream'], price: 349, storeId: 'st-max-zoo', stock: 27 },
      { name: 'Ribbed Square Neck Crop Top', colors: ['Lavender'], price: 349, storeId: 'st-trends-gs', stock: 25 },
      { name: 'Ribbed Square Neck Crop Top', colors: ['Mint'], price: 349, storeId: 'st-trends-gs', stock: 0 },
    ]
  ),
  ...line(
    {
      line: 'w-top', brand: 'Freakins', bucket: 'wtop', sizes: XS_L,
      occasions: ['Party', 'Streetwear'], tags: ['mesh', 'going-out', 'trending'],
      fabric: 'Four-way stretch mesh with lining', fit: 'Bodycon', rating: 4.3, reviews: 402, pop: 85,
      desc: 'Stretch mesh on a lined base, so it moves with you instead of riding up all night.',
    },
    [
      { name: 'Mesh Long Sleeve Top', colors: ['Black'], price: 799, storeId: 'st-vishal-pb', stock: 12, isNew: true, age: 10 },
      { name: 'Mesh Long Sleeve Top', colors: ['Maroon'], price: 799, storeId: 'st-vishal-pb', stock: 7 },
      { name: 'Mesh Long Sleeve Top', colors: ['Ice Blue'], price: 799, storeId: 'st-westside-jh', stock: 4 },
    ]
  ),
  ...line(
    {
      line: 'w-top', brand: 'Roadster', bucket: 'wtop', sizes: XS_XL,
      occasions: ['Casual', 'College'], tags: ['basics', 'cotton', 'value'],
      fabric: 'Cotton jersey', fit: 'Boxy, raw hem', rating: 4.0, reviews: 890, pop: 68,
      desc: 'The ₹249 cotton crop. Boxy cut, raw hem, three in the drawer at all times.',
    },
    [
      { name: 'Boxy Cotton Crop Tee', colors: ['White'], price: 249, storeId: 'st-trends-gs', stock: 41 },
      { name: 'Boxy Cotton Crop Tee', colors: ['Sage'], price: 249, storeId: 'st-trends-gs', stock: 33 },
      { name: 'Boxy Cotton Crop Tee', colors: ['Blush'], price: 249, storeId: 'st-vishal-pb', stock: 22 },
    ]
  ),
  ...line(
    {
      line: 'w-top', brand: 'Only', bucket: 'wtop', sizes: XS_L,
      occasions: ['Party', 'Casual'], tags: ['satin', 'evening', 'trending'],
      fabric: 'Satin-finish viscose', fit: 'Relaxed cami', rating: 4.2, reviews: 318, pop: 79,
      desc: 'Bias-cut satin cami with adjustable straps. Under a blazer for work, on its own after eight.',
      care: 'Hand wash cold or dry clean. Do not wring.',
    },
    [
      { name: 'Satin Cami Top', colors: ['Black'], price: 899, storeId: 'st-westside-jh', stock: 13 },
      { name: 'Satin Cami Top', colors: ['Blush'], price: 899, storeId: 'st-westside-jh', stock: 8 },
      { name: 'Satin Cami Top', colors: ['Teal'], price: 899, storeId: 'st-lifestyle-gach', stock: 1 },
    ]
  ),
  ...line(
    {
      line: 'w-top', brand: 'Newme', bucket: 'wtop', sizes: XS_L,
      occasions: ['Party', 'Streetwear'], tags: ['corset', 'structured', 'trending'],
      fabric: 'Structured cotton twill with boning', fit: 'Fitted corset', rating: 4.4, reviews: 265, pop: 83,
      desc: 'Light boning through the front panels holds its shape without pinching. Back zip, no hooks to fight.',
    },
    [
      { name: 'Corset Style Top', colors: ['Black'], price: 899, storeId: 'st-snitch-bh', stock: 9, isNew: true, age: 6 },
      { name: 'Corset Style Top', colors: ['Cream'], price: 899, storeId: 'st-snitch-bh', stock: 6 },
      { name: 'Corset Style Top', colors: ['Cherry'], price: 899, storeId: 'st-westside-jh', stock: 3 },
    ]
  ),

  /* ----------------------------------------------------------- Dresses (14) */
  ...line(
    {
      line: 'w-dress', brand: 'Only', bucket: 'dress', sizes: XS_XL,
      occasions: ['Party', 'Casual'], tags: ['floral', 'summer', 'trending', 'tiered'],
      fabric: 'Viscose rayon', fit: 'A-line, smocked shoulders', rating: 4.3, reviews: 688, pop: 88,
      desc: 'Tiered viscose with smocked shoulders. Packs flat, needs no ironing, survives a scooter ride.',
    },
    [
      { name: 'Tiered Floral Midi Dress', colors: ['Blush'], price: 1699, storeId: 'st-westside-jh', stock: 10, isNew: true, age: 7 },
      { name: 'Tiered Floral Midi Dress', colors: ['Navy'], price: 1699, storeId: 'st-westside-jh', stock: 4 },
      { name: 'Tiered Floral Midi Dress', colors: ['Mustard'], price: 1699, storeId: 'st-zara-gs', stock: 0 },
      { name: 'Tiered Floral Midi Dress', colors: ['Sage'], price: 1699, storeId: 'st-zara-gs', stock: 6 },
    ]
  ),
  ...line(
    {
      line: 'w-dress', brand: 'Vero Moda', bucket: 'dress', sizes: XS_L,
      occasions: ['Party', 'College'], tags: ['floral', 'date-night', 'crepe'],
      fabric: 'Crepe', fit: 'Fit and flare', rating: 4.2, reviews: 431, pop: 81,
      desc: 'Crepe that skims rather than clings, with a hem that stops just above the knee.',
    },
    [
      { name: 'Ditsy Floral Skater Dress', colors: ['Cherry'], price: 1399, storeId: 'st-zara-gs', stock: 13 },
      { name: 'Ditsy Floral Skater Dress', colors: ['Ice Blue'], price: 1399, storeId: 'st-zara-gs', stock: 1 },
      { name: 'Ditsy Floral Skater Dress', colors: ['Black'], price: 1399, storeId: 'st-lifestyle-gach', stock: 8 },
    ]
  ),
  ...line(
    {
      line: 'w-dress', brand: 'Max Fashion', bucket: 'dress', sizes: S_XXL,
      occasions: ['Casual', 'College'], tags: ['value', 'rayon', 'summer', 'everyday'],
      fabric: 'Rayon', fit: 'Relaxed', rating: 4.0, reviews: 1290, pop: 73,
      desc: 'Everyday rayon at ₹599 — the dress you keep for mornings when deciding is too much work.',
    },
    [
      { name: 'Printed Rayon Day Dress', colors: ['Sage'], price: 599, storeId: 'st-max-zoo', stock: 30 },
      { name: 'Printed Rayon Day Dress', colors: ['Terracotta'], price: 599, storeId: 'st-max-zoo', stock: 24 },
      { name: 'Printed Rayon Day Dress', colors: ['Lavender'], price: 599, storeId: 'st-trends-gs', stock: 19 },
      { name: 'Printed Rayon Day Dress', colors: ['Cream'], price: 599, storeId: 'st-vishal-pb', stock: 15 },
    ]
  ),
  ...line(
    {
      line: 'w-dress', brand: 'Westside', bucket: 'dress', sizes: XS_XL,
      occasions: ['Work', 'Casual'], tags: ['linen', 'shirt-dress', 'breathable'],
      fabric: 'Linen blend', fit: 'Relaxed with self-tie belt', rating: 4.3, reviews: 164, pop: 72,
      desc: 'Collared shirt dress with a self-tie belt. Wear it belted to work, open over a slip on Sunday.',
    },
    [
      { name: 'Linen Shirt Dress', colors: ['White'], price: 1899, storeId: 'st-westside-jh', stock: 12, isNew: true, age: 11 },
      { name: 'Linen Shirt Dress', colors: ['Olive'], price: 1899, storeId: 'st-westside-jh', stock: 6 },
      { name: 'Linen Shirt Dress', colors: ['Stone'], price: 1899, storeId: 'st-lifestyle-gach', stock: 2 },
    ]
  ),

  /* -------------------------------------------------------- Co-ord sets (8) */
  ...line(
    {
      line: 'w-coord', brand: 'Newme', bucket: 'coord', sizes: XS_L,
      occasions: ['Party', 'Streetwear'], tags: ['co-ord', 'trending', 'knit', 'two-piece'],
      fabric: 'Textured knit', fit: 'Fitted top, wide trouser', rating: 4.4, reviews: 375, pop: 91,
      desc: 'Matching knit set — wear it together for the look, or split it and nobody knows it was a set.',
    },
    [
      { name: 'Textured Knit Co-ord Set', colors: ['Black'], price: 2099, storeId: 'st-westside-jh', stock: 9, isNew: true, age: 5 },
      { name: 'Textured Knit Co-ord Set', colors: ['Stone'], price: 2099, storeId: 'st-westside-jh', stock: 1 },
      { name: 'Textured Knit Co-ord Set', colors: ['Sage'], price: 2099, storeId: 'st-snitch-bh', stock: 5 },
    ]
  ),
  ...line(
    {
      line: 'w-coord', brand: 'Salt Attire', bucket: 'coord', sizes: XS_XL,
      occasions: ['Work', 'Party'], tags: ['premium', 'workwear', 'suiting'],
      fabric: 'Poly-viscose suiting', fit: 'Relaxed blazer + wide leg', rating: 4.5, reviews: 198, pop: 79,
      desc: 'Soft-shouldered blazer and a matching wide leg. Boardroom on top, comfortable all day.',
      care: 'Dry clean only.',
    },
    [
      { name: 'Relaxed Suiting Co-ord', colors: ['Charcoal'], price: 2299, storeId: 'st-westside-jh', stock: 7 },
      { name: 'Relaxed Suiting Co-ord', colors: ['Sand'], price: 2299, storeId: 'st-lifestyle-gach', stock: 0 },
    ]
  ),
  ...line(
    {
      line: 'w-coord', brand: 'Max Fashion', bucket: 'coord', sizes: XS_XL,
      occasions: ['Casual', 'College'], tags: ['cotton', 'value', 'co-ord'],
      fabric: 'Cotton poplin', fit: 'Relaxed', rating: 4.1, reviews: 542, pop: 72,
      desc: 'Cotton shirt-and-shorts set that survives a Guwahati summer without sticking to you.',
    },
    [
      { name: 'Cotton Shirt & Shorts Set', colors: ['Ecru'], price: 999, storeId: 'st-max-zoo', stock: 14 },
      { name: 'Cotton Shirt & Shorts Set', colors: ['Ice Blue'], price: 999, storeId: 'st-max-zoo', stock: 11 },
      { name: 'Cotton Shirt & Shorts Set', colors: ['Blush'], price: 999, storeId: 'st-trends-gs', stock: 18 },
    ]
  ),

  /* --------------------------------------------------- Jeans & wide-leg (10) */
  ...line(
    {
      line: 'w-jeans', brand: 'Freakins', bucket: 'denim', sizes: XS_XL,
      occasions: ['Streetwear', 'College', 'Casual'], tags: ['high-rise', 'wide-leg', 'trending'],
      fabric: 'Rigid cotton denim', fit: 'High-rise wide leg', rating: 4.4, reviews: 774, pop: 93,
      desc: 'High rise, wide through the leg, hem puddling slightly over a sneaker. The 2020s jean.',
    },
    [
      { name: 'High-Rise Wide Leg Jeans', colors: ['Denim'], price: 1899, storeId: 'st-westside-jh', stock: 12, isNew: true, age: 6 },
      { name: 'High-Rise Wide Leg Jeans', colors: ['Ice Blue'], price: 1899, storeId: 'st-westside-jh', stock: 1 },
      { name: 'High-Rise Wide Leg Jeans', colors: ['Black'], price: 1899, storeId: 'st-levis-gach', stock: 7 },
      { name: 'High-Rise Wide Leg Jeans', colors: ['Stone'], price: 1899, storeId: 'st-levis-gach', stock: 5 },
    ]
  ),
  ...line(
    {
      line: 'w-jeans', brand: "Levi's", bucket: 'denim', sizes: XS_L,
      occasions: ['Casual', 'Work'], tags: ['classic', 'premium', 'straight'],
      fabric: 'Cotton denim', fit: 'High-rise straight, cropped ankle', rating: 4.5, reviews: 1002, pop: 86,
      desc: 'A straighter take on the wide leg, cropped at the ankle so it works with flats too.',
    },
    [
      { name: 'Ribcage Straight Jeans', colors: ['Navy'], price: 1999, storeId: 'st-levis-gach', stock: 9 },
      { name: 'Ribcage Straight Jeans', colors: ['Denim'], price: 1999, storeId: 'st-levis-gach', stock: 0 },
      { name: 'Ribcage Straight Jeans', colors: ['Black'], price: 1999, storeId: 'st-levis-gach', stock: 6 },
    ]
  ),
  ...line(
    {
      line: 'w-jeans', brand: 'Max Fashion', bucket: 'denim', sizes: S_XXL,
      occasions: ['Casual', 'College'], tags: ['stretch', 'value'],
      fabric: 'Stretch denim', fit: 'Mid-rise wide', rating: 4.0, reviews: 655, pop: 70,
      desc: 'Softer stretch denim in a wide leg, at a price that makes trying the trend low-risk.',
    },
    [
      { name: 'Stretch Wide Leg Jeans', colors: ['Denim'], price: 799, storeId: 'st-max-zoo', stock: 21 },
      { name: 'Stretch Wide Leg Jeans', colors: ['Charcoal'], price: 799, storeId: 'st-max-zoo', stock: 17 },
      { name: 'Stretch Wide Leg Jeans', colors: ['Ice Blue'], price: 799, storeId: 'st-vishal-pb', stock: 14 },
    ]
  ),

  /* --------------------------------------------- Kurtis & ethnic sets (12) */
  ...line(
    {
      line: 'w-kurti', brand: 'FabIndia', bucket: 'ethnicW', sizes: S_XXL,
      occasions: ['Work', 'Festive', 'Casual'], tags: ['handloom', 'cotton', 'breathable', 'traditional'],
      fabric: 'Handloom cotton', fit: 'Straight, side pockets', rating: 4.5, reviews: 1320, pop: 87,
      desc: 'Handloom cotton that softens with every wash, with the side pockets everyone actually shops for.',
      care: 'Hand wash separately the first time.',
    },
    [
      { name: 'Handloom Cotton Straight Kurti', colors: ['Navy'], price: 1499, storeId: 'st-fabindia-cb', stock: 16 },
      { name: 'Handloom Cotton Straight Kurti', colors: ['Ecru'], price: 1499, storeId: 'st-fabindia-cb', stock: 12 },
      { name: 'Handloom Cotton Straight Kurti', colors: ['Rust'], price: 1499, storeId: 'st-fabindia-cb', stock: 1 },
    ]
  ),
  ...line(
    {
      line: 'w-kurti', brand: 'Biba', bucket: 'ethnicW', sizes: XS_XL,
      occasions: ['Festive', 'Party'], tags: ['chanderi', 'set', 'embroidered', 'wedding'],
      fabric: 'Chanderi silk-cotton', fit: 'Flared, with dupatta', rating: 4.4, reviews: 604, pop: 84,
      desc: 'Kurta, pants and dupatta with thread work at the yoke — the whole Bihu outfit in one bag.',
      care: 'Dry clean recommended.',
    },
    [
      { name: 'Chanderi Kurta Set', colors: ['Maroon'], price: 2799, storeId: 'st-fabindia-cb', stock: 6, isNew: true, age: 12 },
      { name: 'Chanderi Kurta Set', colors: ['Mustard'], price: 2799, storeId: 'st-fabindia-cb', stock: 4 },
      { name: 'Chanderi Kurta Set', colors: ['Teal'], price: 2799, storeId: 'st-lifestyle-gach', stock: 0 },
    ]
  ),
  ...line(
    {
      line: 'w-kurti', brand: 'W', bucket: 'ethnicW', sizes: S_XXL,
      occasions: ['Work', 'Casual'], tags: ['value', 'cotton', 'daily', 'a-line'],
      fabric: 'Cotton blend', fit: 'A-line with side pockets', rating: 4.1, reviews: 980, pop: 71,
      desc: 'A-line daily kurti that holds a press through a full working day.',
    },
    [
      { name: 'Printed A-Line Kurti', colors: ['Forest'], price: 799, storeId: 'st-trends-gs', stock: 23 },
      { name: 'Printed A-Line Kurti', colors: ['Blush'], price: 799, storeId: 'st-trends-gs', stock: 18 },
      { name: 'Printed A-Line Kurti', colors: ['Navy'], price: 799, storeId: 'st-vishal-pb', stock: 29 },
    ]
  ),
  ...line(
    {
      line: 'w-kurti', brand: 'Westside', bucket: 'ethnicW', sizes: XS_XL,
      occasions: ['Festive', 'Party'], tags: ['anarkali', 'embroidered', 'festive'],
      fabric: 'Georgette with cotton lining', fit: 'Floor-length flare', rating: 4.3, reviews: 288, pop: 76,
      desc: 'Floor-length Anarkali with a gota-trimmed neckline and a matching dupatta. Full flare, no can-can needed.',
    },
    [
      { name: 'Embroidered Anarkali Kurti', colors: ['Lavender'], price: 2299, storeId: 'st-westside-jh', stock: 8 },
      { name: 'Embroidered Anarkali Kurti', colors: ['Cream'], price: 2299, storeId: 'st-westside-jh', stock: 5 },
      { name: 'Embroidered Anarkali Kurti', colors: ['Maroon'], price: 2299, storeId: 'st-lifestyle-gach', stock: 3 },
    ]
  ),

  /* ------------------------------------------------- Skirts & trousers (6) */
  ...line(
    {
      line: 'w-skirt', brand: 'Zara', bucket: 'bottom', sizes: XS_L,
      occasions: ['Party', 'College'], tags: ['pleated', 'trending', 'mini'],
      fabric: 'Recycled polyester', fit: 'Mid-rise, knife pleats', rating: 4.2, reviews: 234, pop: 74,
      desc: 'Knife pleats that hold their shape, a hidden side zip, and a lining that does not cling.',
    },
    [
      { name: 'Pleated Mini Skirt', colors: ['Black'], price: 1299, storeId: 'st-zara-gs', stock: 11, isNew: true, age: 9 },
      { name: 'Pleated Mini Skirt', colors: ['Grey'], price: 1299, storeId: 'st-zara-gs', stock: 7 },
      { name: 'Pleated Mini Skirt', colors: ['Cream'], price: 1299, storeId: 'st-zara-gs', stock: 2 },
    ]
  ),
  ...line(
    {
      line: 'w-skirt', brand: 'Westside', bucket: 'bottom', sizes: XS_XL,
      occasions: ['Work', 'Party'], tags: ['wide-leg', 'workwear', 'pleated'],
      fabric: 'Poly-viscose twill', fit: 'High-rise wide leg', rating: 4.3, reviews: 356, pop: 77,
      desc: 'High-rise trousers with a pressed crease and a fluid drape. Pairs with anything cropped on top.',
    },
    [
      { name: 'Pleated Wide Trousers', colors: ['Black'], price: 1499, storeId: 'st-westside-jh', stock: 15 },
      { name: 'Pleated Wide Trousers', colors: ['Beige'], price: 1499, storeId: 'st-westside-jh', stock: 9 },
      { name: 'Pleated Wide Trousers', colors: ['Navy'], price: 1499, storeId: 'st-lifestyle-gach', stock: 6 },
    ]
  ),

  /* --------------------------------------------- Sweatshirts & jackets (6) */
  ...line(
    {
      line: 'w-sweat', brand: 'Bewakoof', bucket: 'outer', sizes: XS_XL,
      occasions: ['Casual', 'College', 'Streetwear'], tags: ['oversized', 'fleece', 'winter'],
      fabric: '300 GSM brushed fleece', fit: 'Oversized', rating: 4.2, reviews: 812, pop: 82,
      desc: 'Oversized fleece with a dropped shoulder and a kangaroo pocket that fits a phone and both hands.',
    },
    [
      { name: 'Oversized Fleece Sweatshirt', colors: ['Lavender'], price: 999, storeId: 'st-max-zoo', stock: 18 },
      { name: 'Oversized Fleece Sweatshirt', colors: ['Black'], price: 999, storeId: 'st-max-zoo', stock: 14 },
      { name: 'Oversized Fleece Sweatshirt', colors: ['Sage'], price: 999, storeId: 'st-trends-gs', stock: 10 },
    ]
  ),
  ...line(
    {
      line: 'w-sweat', brand: 'Vero Moda', bucket: 'outer', sizes: XS_L,
      occasions: ['Casual', 'Streetwear'], tags: ['denim', 'classic', 'layering'],
      fabric: 'Rigid cotton denim', fit: 'Cropped trucker', rating: 4.4, reviews: 489, pop: 85,
      desc: 'Cropped trucker jacket that sits at the waist, so it works over a dress as well as jeans.',
    },
    [
      { name: 'Cropped Denim Jacket', colors: ['Denim'], price: 1799, storeId: 'st-westside-jh', stock: 11 },
      { name: 'Cropped Denim Jacket', colors: ['Black'], price: 1799, storeId: 'st-westside-jh', stock: 6 },
      { name: 'Cropped Denim Jacket', colors: ['Ice Blue'], price: 1799, storeId: 'st-levis-gach', stock: 1 },
    ]
  ),
];

export default WOMEN;
