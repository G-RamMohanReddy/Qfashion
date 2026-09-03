/** Men's buying sheet — 70 SKUs across 8 product lines. */

import { line, APPAREL_SIZES } from './catalogBase.js';

const S_XXL = APPAREL_SIZES;
const S_XL = ['S', 'M', 'L', 'XL'];

export const MEN = [
  /* ------------------------------------------------------------ T-shirts (18) */
  ...line(
    {
      line: 'm-tee', brand: 'Bewakoof', bucket: 'tee', sizes: S_XXL,
      occasions: ['Casual', 'Streetwear', 'College'], tags: ['oversized', '240 gsm', 'trending', 'cotton'],
      fabric: '240 GSM combed cotton', fit: 'Oversized, drop shoulder', rating: 4.3, reviews: 812, pop: 92,
      desc: 'Heavyweight 240 GSM cotton with a proper drop shoulder. Holds its boxy shape through a Guwahati monsoon of washes instead of collapsing after three.',
      care: 'Machine wash cold inside out. Do not iron the print.',
    },
    [
      { name: 'Acid Wash Oversized T-Shirt', colors: ['Black'], price: 599, storeId: 'st-max-zoo', stock: 16, isNew: true, age: 6 },
      { name: 'Acid Wash Oversized T-Shirt', colors: ['Ecru'], price: 599, storeId: 'st-max-zoo', stock: 11 },
      { name: 'Acid Wash Oversized T-Shirt', colors: ['Olive'], price: 599, storeId: 'st-trends-gs', stock: 9 },
      { name: 'Acid Wash Oversized T-Shirt', colors: ['Sage'], price: 599, storeId: 'st-trends-gs', stock: 0 },
    ]
  ),
  ...line(
    {
      line: 'm-tee', brand: 'The Souled Store', bucket: 'tee', sizes: ['XS', 'S', 'M', 'L', 'XL'], gender: 'Unisex',
      occasions: ['Casual', 'Streetwear', 'College'], tags: ['printed', 'graphic', 'trending'],
      fabric: '190 GSM bio-washed cotton', fit: 'Relaxed', rating: 4.4, reviews: 1204, pop: 95,
      desc: 'Screen print that survives the wash, on bio-washed cotton that stops pilling after the third cycle.',
    },
    [
      { name: 'Northeast Riders Graphic Tee', colors: ['Black', 'Charcoal'], price: 649, storeId: 'st-max-zoo', stock: 21, isNew: true, age: 9 },
      { name: 'Brahmaputra Skyline Tee', colors: ['Navy'], price: 599, storeId: 'st-trends-gs', stock: 14 },
      { name: 'Retro Cassette Print Tee', colors: ['Ecru'], price: 549, storeId: 'st-vishal-pb', stock: 0 },
      { name: 'Vinyl Club Print Tee', colors: ['Charcoal'], price: 599, storeId: 'st-vishal-pb', stock: 7 },
    ]
  ),
  ...line(
    {
      line: 'm-tee', brand: 'Snitch', bucket: 'tee', sizes: S_XL,
      occasions: ['Streetwear', 'Party', 'Casual'], tags: ['premium', 'oversized', 'terry', 'trending'],
      fabric: '260 GSM terry cotton', fit: 'Boxy oversized', rating: 4.5, reviews: 645, pop: 90,
      desc: 'Terry-backed cotton with a raw-edge neck rib. Reads expensive without a logo anywhere on it.',
    },
    [
      { name: 'Washed Terry Boxy Tee', colors: ['Charcoal'], price: 799, storeId: 'st-snitch-bh', stock: 13, isNew: true, age: 4 },
      { name: 'Washed Terry Boxy Tee', colors: ['Sand'], price: 799, storeId: 'st-snitch-bh', stock: 1 },
      { name: 'Washed Terry Boxy Tee', colors: ['Teal'], price: 799, storeId: 'st-snitch-bh', stock: 8 },
    ]
  ),
  ...line(
    {
      line: 'm-tee', brand: 'Roadster', bucket: 'tee', sizes: S_XXL,
      occasions: ['Casual', 'College'], tags: ['basics', 'value', 'everyday'],
      fabric: '180 GSM cotton jersey', fit: 'Regular', rating: 4.1, reviews: 2310, pop: 78,
      desc: 'The ₹349 workhorse. Buy three, wear them until they fade, buy three more.',
    },
    [
      { name: 'Essential Cotton Tee', colors: ['White'], price: 349, storeId: 'st-trends-gs', stock: 42 },
      { name: 'Essential Cotton Tee', colors: ['Black'], price: 349, storeId: 'st-trends-gs', stock: 38 },
      { name: 'Essential Cotton Tee', colors: ['Navy'], price: 349, storeId: 'st-max-zoo', stock: 29 },
      { name: 'Essential Cotton Tee', colors: ['Grey'], price: 349, storeId: 'st-max-zoo', stock: 24 },
    ]
  ),
  ...line(
    {
      line: 'm-tee', brand: 'Bonkers Corner', bucket: 'tee', sizes: S_XL, gender: 'Unisex',
      occasions: ['Streetwear', 'College'], tags: ['oversized', 'y2k', 'trending', 'unisex'],
      fabric: '220 GSM cotton', fit: 'Oversized', rating: 4.2, reviews: 498, pop: 86,
      desc: 'The fit that made the brand — shoulder seam halfway down the arm, hem stopping at the hip.',
    },
    [
      { name: 'Y2K Wash Oversized Tee', colors: ['Lavender'], price: 699, storeId: 'st-vishal-pb', stock: 6 },
      { name: 'Y2K Wash Oversized Tee', colors: ['Mint'], price: 699, storeId: 'st-vishal-pb', stock: 5 },
      { name: 'Y2K Wash Oversized Tee', colors: ['Stone'], price: 699, storeId: 'st-max-zoo', stock: 12 },
    ]
  ),

  /* -------------------------------------------------------------- Shirts (12) */
  ...line(
    {
      line: 'm-shirt', brand: 'Snitch', bucket: 'shirt', sizes: S_XL,
      occasions: ['Party', 'Casual', 'Work'], tags: ['linen', 'breathable', 'summer', 'trending'],
      fabric: '55% linen, 45% cotton', fit: 'Relaxed camp collar', rating: 4.5, reviews: 732, pop: 91,
      desc: 'Camp collar, boxy body, and enough linen in the blend to actually breathe through August humidity.',
      care: 'Machine wash cold. Linen creases — that is the fabric working.',
    },
    [
      { name: 'Linen Blend Cuban Shirt', colors: ['Sage'], price: 1299, storeId: 'st-snitch-bh', stock: 11, isNew: true, age: 8 },
      { name: 'Linen Blend Cuban Shirt', colors: ['Ecru'], price: 1299, storeId: 'st-snitch-bh', stock: 0 },
      { name: 'Linen Blend Cuban Shirt', colors: ['Rust'], price: 1299, storeId: 'st-westside-jh', stock: 6 },
    ]
  ),
  ...line(
    {
      line: 'm-shirt', brand: 'Zara', bucket: 'shirt', sizes: S_XL,
      occasions: ['Work', 'Party'], tags: ['premium', 'linen', 'formal'],
      fabric: '100% European linen', fit: 'Regular', rating: 4.6, reviews: 289, pop: 84,
      desc: 'Pure linen with mother-of-pearl buttons. Reads formal tucked in and easy left out.',
    },
    [
      { name: 'Pure Linen Long Sleeve Shirt', colors: ['White'], price: 1799, storeId: 'st-zara-gs', stock: 9 },
      { name: 'Pure Linen Long Sleeve Shirt', colors: ['Stone'], price: 1799, storeId: 'st-zara-gs', stock: 1 },
      { name: 'Pure Linen Long Sleeve Shirt', colors: ['Navy'], price: 1799, storeId: 'st-zara-gs', stock: 5 },
    ]
  ),
  ...line(
    {
      line: 'm-shirt', brand: 'Max Fashion', bucket: 'shirt', sizes: ['M', 'L', 'XL', 'XXL'],
      occasions: ['Casual', 'College'], tags: ['value', 'slub', 'breathable'],
      fabric: 'Cotton-linen slub', fit: 'Slim', rating: 4.0, reviews: 921, pop: 71,
      desc: 'Slub-textured cotton-linen at a price that makes owning three of them sensible.',
    },
    [
      { name: 'Slub Textured Casual Shirt', colors: ['Ice Blue'], price: 799, storeId: 'st-max-zoo', stock: 22 },
      { name: 'Slub Textured Casual Shirt', colors: ['Olive'], price: 799, storeId: 'st-max-zoo', stock: 17 },
      { name: 'Slub Textured Casual Shirt', colors: ['Sand'], price: 799, storeId: 'st-trends-gs', stock: 13 },
    ]
  ),
  ...line(
    {
      line: 'm-shirt', brand: 'Reliance Trends', bucket: 'shirt', sizes: S_XXL,
      occasions: ['Work'], tags: ['formal', 'office', 'wrinkle-resistant'],
      fabric: 'Wrinkle-resistant cotton poplin', fit: 'Slim', rating: 4.1, reviews: 640, pop: 68,
      desc: 'Office poplin treated to come out of a bag looking like it came off a hanger.',
    },
    [
      { name: 'Wrinkle-Free Formal Shirt', colors: ['White'], price: 999, storeId: 'st-trends-gs', stock: 26 },
      { name: 'Wrinkle-Free Formal Shirt', colors: ['Ice Blue'], price: 999, storeId: 'st-trends-gs', stock: 19 },
      { name: 'Wrinkle-Free Formal Shirt', colors: ['Charcoal'], price: 999, storeId: 'st-lifestyle-gach', stock: 11 },
    ]
  ),

  /* --------------------------------------------------------------- Polos (6) */
  ...line(
    {
      line: 'm-polo', brand: 'Snitch', bucket: 'tee', sizes: S_XXL,
      occasions: ['Casual', 'Party', 'Work'], tags: ['textured', 'knit', 'trending'],
      fabric: 'Textured cotton knit', fit: 'Slim', rating: 4.5, reviews: 743, pop: 96,
      desc: 'Waffle-textured knit with a ribbed collar that stays up all evening. Snitch’s best seller for a reason.',
    },
    [
      { name: 'Textured Knit Polo', colors: ['Beige'], price: 1199, storeId: 'st-snitch-bh', stock: 21, isNew: true, age: 7 },
      { name: 'Textured Knit Polo', colors: ['Navy'], price: 1199, storeId: 'st-snitch-bh', stock: 15 },
      { name: 'Textured Knit Polo', colors: ['Black'], price: 1199, storeId: 'st-westside-jh', stock: 9 },
    ]
  ),
  ...line(
    {
      line: 'm-polo', brand: 'Lifestyle', bucket: 'tee', sizes: S_XXL,
      occasions: ['Casual', 'Work'], tags: ['pique', 'everyday', 'value'],
      fabric: 'Cotton pique', fit: 'Regular', rating: 4.0, reviews: 512, pop: 66,
      desc: 'Classic pique polo with a two-button placket. Nothing clever, everything correct.',
    },
    [
      { name: 'Cotton Pique Polo', colors: ['White'], price: 599, storeId: 'st-lifestyle-gach', stock: 28 },
      { name: 'Cotton Pique Polo', colors: ['Maroon'], price: 599, storeId: 'st-lifestyle-gach', stock: 18 },
      { name: 'Cotton Pique Polo', colors: ['Forest'], price: 599, storeId: 'st-lifestyle-gach', stock: 2 },
    ]
  ),

  /* ------------------------------------------------------------- Hoodies (8) */
  ...line(
    {
      line: 'm-hoodie', brand: 'Bewakoof', bucket: 'outer', sizes: S_XXL, gender: 'Unisex',
      occasions: ['Casual', 'Streetwear', 'College'], tags: ['fleece', 'winter', 'oversized'],
      fabric: '320 GSM brushed fleece', fit: 'Oversized', rating: 4.3, reviews: 1442, pop: 90,
      desc: 'Brushed inside, boxy outside. The one you live in from November to February.',
    },
    [
      { name: 'Heavyweight Fleece Hoodie', colors: ['Black'], price: 1199, storeId: 'st-max-zoo', stock: 17 },
      { name: 'Heavyweight Fleece Hoodie', colors: ['Grey'], price: 1199, storeId: 'st-max-zoo', stock: 2 },
      { name: 'Heavyweight Fleece Hoodie', colors: ['Maroon'], price: 1199, storeId: 'st-trends-gs', stock: 10 },
    ]
  ),
  ...line(
    {
      line: 'm-hoodie', brand: 'Snitch', bucket: 'outer', sizes: S_XL,
      occasions: ['Streetwear', 'Party'], tags: ['premium', 'varsity', 'trending'],
      fabric: 'Wool-blend body, PU sleeves', fit: 'Regular', rating: 4.5, reviews: 421, pop: 87,
      desc: 'Chenille chest patch, ribbed trims, snap front. Photographs far above its price.',
    },
    [
      { name: 'Varsity Bomber Jacket', colors: ['Cream', 'Black'], price: 1899, storeId: 'st-snitch-bh', stock: 6, isNew: true, age: 3 },
      { name: 'Varsity Bomber Jacket', colors: ['Navy', 'Cream'], price: 1899, storeId: 'st-snitch-bh', stock: 0 },
    ]
  ),
  ...line(
    {
      line: 'm-hoodie', brand: 'Westside', bucket: 'outer', sizes: S_XL,
      occasions: ['Casual', 'College'], tags: ['zip', 'fleece', 'layering'],
      fabric: '280 GSM cotton fleece', fit: 'Regular', rating: 4.2, reviews: 706, pop: 72,
      desc: 'Full-zip fleece with a lined hood and deep side pockets. The layer you keep in the bag.',
    },
    [
      { name: 'Zip-Through Hooded Sweatshirt', colors: ['Navy'], price: 1399, storeId: 'st-westside-jh', stock: 14 },
      { name: 'Zip-Through Hooded Sweatshirt', colors: ['Olive'], price: 1399, storeId: 'st-westside-jh', stock: 9 },
      { name: 'Zip-Through Hooded Sweatshirt', colors: ['Charcoal'], price: 1399, storeId: 'st-lifestyle-gach', stock: 7 },
    ]
  ),

  /* -------------------------------------------------------------- Cargos (8) */
  ...line(
    {
      line: 'm-cargo', brand: 'Snitch', bucket: 'bottom', sizes: S_XXL,
      occasions: ['Streetwear', 'College'], tags: ['six-pocket', 'baggy', 'trending', 'ripstop'],
      fabric: 'Cotton ripstop', fit: 'Baggy with bungee hem', rating: 4.2, reviews: 1105, pop: 89,
      desc: 'Six real pockets, bungee-cinched hem, and enough volume to be obvious about it.',
    },
    [
      { name: 'Ripstop Parachute Cargo', colors: ['Olive'], price: 1499, storeId: 'st-snitch-bh', stock: 15, isNew: true, age: 11 },
      { name: 'Ripstop Parachute Cargo', colors: ['Black'], price: 1499, storeId: 'st-snitch-bh', stock: 9 },
      { name: 'Ripstop Parachute Cargo', colors: ['Sand'], price: 1499, storeId: 'st-westside-jh', stock: 0 },
    ]
  ),
  ...line(
    {
      line: 'm-cargo', brand: 'Max Fashion', bucket: 'bottom', sizes: S_XL, gender: 'Unisex',
      occasions: ['Casual', 'Streetwear'], tags: ['stretch', 'utility', 'value'],
      fabric: 'Poly-cotton with 2% elastane', fit: 'Straight utility', rating: 4.1, reviews: 640, pop: 76,
      desc: 'Utility cut with a touch of stretch, so you can actually sit on a scooter in them.',
    },
    [
      { name: 'Stretch Utility Cargo', colors: ['Charcoal'], price: 1099, storeId: 'st-max-zoo', stock: 19 },
      { name: 'Stretch Utility Cargo', colors: ['Navy'], price: 1099, storeId: 'st-max-zoo', stock: 12 },
      { name: 'Stretch Utility Cargo', colors: ['Stone'], price: 1099, storeId: 'st-trends-gs', stock: 8 },
    ]
  ),
  ...line(
    {
      line: 'm-cargo', brand: 'Reliance Trends', bucket: 'bottom', sizes: S_XXL,
      occasions: ['Casual', 'Streetwear'], tags: ['jogger', 'cropped', 'value'],
      fabric: 'Brushed twill', fit: 'Tapered jogger', rating: 4.0, reviews: 388, pop: 64,
      desc: 'Cropped above the ankle so it stacks on a sneaker instead of pooling on the floor.',
    },
    [
      { name: 'Cropped Cargo Jogger', colors: ['Black'], price: 899, storeId: 'st-trends-gs', stock: 24 },
      { name: 'Cropped Cargo Jogger', colors: ['Grey'], price: 899, storeId: 'st-vishal-pb', stock: 16 },
    ]
  ),

  /* -------------------------------------------------------------- Jeans (10) */
  ...line(
    {
      line: 'm-jeans', brand: "Levi's", bucket: 'denim', sizes: S_XXL,
      occasions: ['Casual', 'College', 'Work'], tags: ['classic', 'slim', 'trending'],
      fabric: '99% cotton, 1% elastane', fit: 'Slim straight', rating: 4.6, reviews: 3120, pop: 97,
      desc: 'The default slim jean. Sits below the waist, slim through the thigh, straight to the ankle.',
      care: 'Wash inside out, cold, as rarely as you can stand.',
    },
    [
      { name: '511 Slim Fit Jeans', colors: ['Denim'], price: 2299, storeId: 'st-levis-gach', stock: 18 },
      { name: '511 Slim Fit Jeans', colors: ['Black'], price: 2299, storeId: 'st-levis-gach', stock: 11 },
      { name: '511 Slim Fit Jeans', colors: ['Ice Blue'], price: 2299, storeId: 'st-levis-gach', stock: 4 },
    ]
  ),
  ...line(
    {
      line: 'm-jeans', brand: "Levi's", bucket: 'denim', sizes: S_XL,
      occasions: ['Casual', 'Streetwear'], tags: ['classic', 'rigid', 'straight'],
      fabric: 'Rigid 100% cotton denim', fit: 'Original straight', rating: 4.5, reviews: 1870, pop: 88,
      desc: 'Rigid denim, straight leg, unchanged since 1873. It fades to your own pattern in about a year.',
    },
    [
      { name: '501 Original Straight Jeans', colors: ['Denim'], price: 2199, storeId: 'st-levis-gach', stock: 8 },
      { name: '501 Original Straight Jeans', colors: ['Stone'], price: 2199, storeId: 'st-levis-gach', stock: 0 },
    ]
  ),
  ...line(
    {
      line: 'm-jeans', brand: 'Reliance Trends', bucket: 'denim', sizes: S_XL,
      occasions: ['Streetwear', 'College'], tags: ['baggy', 'trending', 'skater'],
      fabric: 'Non-stretch denim', fit: 'Baggy', rating: 4.3, reviews: 512, pop: 88,
      desc: 'Wide through the thigh with a full break at the ankle. Pair with chunky sneakers.',
    },
    [
      { name: 'Baggy Skater Jeans', colors: ['Ice Blue'], price: 1499, storeId: 'st-trends-gs', stock: 8, isNew: true, age: 5 },
      { name: 'Baggy Skater Jeans', colors: ['Denim'], price: 1499, storeId: 'st-trends-gs', stock: 6 },
      { name: 'Baggy Skater Jeans', colors: ['Grey'], price: 1499, storeId: 'st-vishal-pb', stock: 13 },
    ]
  ),
  ...line(
    {
      line: 'm-jeans', brand: 'Max Fashion', bucket: 'denim', sizes: S_XXL,
      occasions: ['Casual', 'Work'], tags: ['stretch', 'value', 'everyday'],
      fabric: 'Stretch denim', fit: 'Slim tapered', rating: 4.0, reviews: 1875, pop: 74,
      desc: 'Stretch denim that recovers instead of bagging out at the knee by lunchtime.',
    },
    [
      { name: 'Stretch Slim Jeans', colors: ['Navy'], price: 999, storeId: 'st-max-zoo', stock: 26 },
      { name: 'Stretch Slim Jeans', colors: ['Denim'], price: 999, storeId: 'st-max-zoo', stock: 21 },
    ]
  ),

  /* ------------------------------------------------------------- Shorts (4) */
  ...line(
    {
      line: 'm-shorts', brand: 'Zara', bucket: 'bottom', sizes: S_XL,
      occasions: ['Casual'], tags: ['linen', 'summer', 'breathable'],
      fabric: '55% linen, 45% cotton', fit: 'Relaxed, above the knee', rating: 4.1, reviews: 187, pop: 63,
      desc: 'Breathable linen blend cut just above the knee. Built for Guwahati humidity.',
    },
    [
      { name: 'Linen Blend Shorts', colors: ['Beige'], price: 999, storeId: 'st-zara-gs', stock: 11 },
      { name: 'Linen Blend Shorts', colors: ['Olive'], price: 999, storeId: 'st-zara-gs', stock: 7 },
    ]
  ),
  ...line(
    {
      line: 'm-shorts', brand: 'Max Fashion', bucket: 'bottom', sizes: S_XXL,
      occasions: ['Casual', 'College'], tags: ['jersey', 'value', 'lounge'],
      fabric: 'Cotton jersey', fit: 'Regular', rating: 3.9, reviews: 640, pop: 58,
      desc: 'Cotton jersey shorts with a drawcord waist and real pockets. Home to shop and back.',
    },
    [
      { name: 'Cotton Jersey Shorts', colors: ['Black'], price: 399, storeId: 'st-max-zoo', stock: 34 },
      { name: 'Cotton Jersey Shorts', colors: ['Navy'], price: 399, storeId: 'st-vishal-pb', stock: 27 },
    ]
  ),

  /* ------------------------------------------------------------- Ethnic (4) */
  ...line(
    {
      line: 'm-ethnic', brand: 'FabIndia', bucket: 'ethnicM', sizes: S_XXL,
      occasions: ['Festive', 'Casual'], tags: ['handloom', 'cotton', 'breathable', 'traditional'],
      fabric: 'Handloom cotton', fit: 'Regular, side slits', rating: 4.6, reviews: 412, pop: 89,
      desc: 'Woven on handlooms and softened by every wash. Mandarin collar, wooden buttons, side slits.',
      care: 'Hand wash separately the first time — handloom bleeds a little.',
    },
    [
      { name: 'Handloom Cotton Kurta', colors: ['White'], price: 1899, storeId: 'st-fabindia-cb', stock: 16 },
      { name: 'Handloom Cotton Kurta', colors: ['Ecru'], price: 1899, storeId: 'st-fabindia-cb', stock: 12 },
    ]
  ),
  ...line(
    {
      line: 'm-ethnic', brand: 'FabIndia', bucket: 'ethnicM', sizes: S_XL,
      occasions: ['Festive', 'Party'], tags: ['layering', 'wedding', 'traditional'],
      fabric: 'Cotton silk', fit: 'Tailored', rating: 4.4, reviews: 96, pop: 68,
      desc: 'Layer it over a kurta or a plain shirt. Five buttons, welt pockets, fully lined.',
    },
    [
      { name: 'Nehru Jacket', colors: ['Black'], price: 2499, storeId: 'st-fabindia-cb', stock: 6 },
      { name: 'Nehru Jacket', colors: ['Olive'], price: 2499, storeId: 'st-fabindia-cb', stock: 1 },
    ]
  ),
];

export default MEN;
