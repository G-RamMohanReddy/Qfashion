import { useEffect, useRef, useState } from 'react';
import products from '../data/bs-menz.json';
import darkwolves from '../data/darkwolves.json';
import { inr } from '../lib/format.js';
import PilotCheckout from './PilotCheckout.jsx';

const catalog = [...darkwolves, ...products];
const categories = {
  'T-shirts': ['Oversized tees', 'Boxy tees'],
  Vests: ['Vests'],
  Sweatshirts: ['Sweatshirts'],
  Hoodies: ['Hoodies'],
};
const productGroups = Object.entries(categories).map(([label, types]) => [
  label,
  catalog.filter(product => types.includes(product.type)),
]);
const mixedCatalog = Array.from(
  { length: Math.max(...productGroups.map(([, group]) => group.length)) },
  (_, index) => productGroups.flatMap(([, group]) => group.slice(index, index + 1)),
).flat();
const alternateCards = productGroups.flatMap(([, group]) => {
  const product = group.find(item => item.photos.front && (item.photos.angle || item.photos.back));
  return product ? [{ product, alternate: true }] : [];
});
const mixedCards = mixedCatalog.flatMap((product, index) => {
  const alternate = (index + 1) % 5 === 0 ? alternateCards[(index + 1) / 5 - 1] : undefined;
  const card = { product, alternate: false };
  return alternate ? [card, alternate] : [card];
});

const shops = {
  'BS Menz Shop': {
    description: 'A local clothing shop with oversized tees, dot knit vests and crewneck sweatshirts.',
    mapsUrl: 'https://maps.app.goo.gl/YTKYszPSDjZZ5Vpb9?g_st=iw',
  },
  Darkwolves: {
    description: 'A streetwear shop with boxy graphic tees and heavyweight clasp hoodies.',
    location: 'Khoka Market near IIT Guwahati, Amingaon, Kamrup 781039',
    mapsUrl: 'https://maps.app.goo.gl/boq2qafbLm5CFw4fA?g_st=iw',
  },
};

function estimate(items) {
  const itemPaise = items.reduce((sum, item) => sum + item.sellPrice * 100, 0);
  const gstPaise = Math.round(itemPaise * 0.05);
  const platformPaise = items.reduce((sum, item) => sum + (['Oversized tees', 'Boxy tees'].includes(item.type) ? 2250 : 1000), 0);
  const deliveryPaise = items.length > 0 ? 10000 : 0;
  const deliveryDiscountPaise = items.length >= 2 ? deliveryPaise : 0;
  const totalPaise = itemPaise + gstPaise + platformPaise + deliveryPaise - deliveryDiscountPaise;
  return { itemPaise, gstPaise, platformPaise, deliveryPaise, deliveryDiscountPaise, totalPaise };
}

function PriceBreakdown({ items }) {
  const { itemPaise, gstPaise, platformPaise, deliveryPaise, deliveryDiscountPaise, totalPaise } = estimate(items);
  return <dl className="space-y-2 border-t border-line pt-3 text-sm">
    <div className="flex justify-between"><dt>Selling price</dt><dd>{inr(itemPaise / 100)}</dd></div>
    <div className="flex justify-between"><dt>Delivery</dt><dd>{inr(deliveryPaise / 100)}</dd></div>
    {deliveryDiscountPaise > 0 && <div className="flex justify-between font-semibold"><dt>Free delivery discount</dt><dd>−{inr(deliveryDiscountPaise / 100)}</dd></div>}
    <div className="flex justify-between"><dt>Estimated apparel GST (5%)</dt><dd>{inr(gstPaise / 100)}</dd></div>
    <div className="flex justify-between"><dt>Platform fee</dt><dd>{inr(platformPaise / 100)}</dd></div>
    <div className="flex justify-between border-t border-line pt-2 font-semibold"><dt>Estimated total</dt><dd>{inr(totalPaise / 100)}</dd></div>
  </dl>;
}

const colourSwatches = {
  Beige: '#c5ad88', Black: '#242424', Blue: '#3266a1', Burgundy: '#602638',
  'Dark teal': '#164450', 'Light grey': '#b3b4b6', Cyan: '#008eae', Green: '#315c43', Grey: '#888888', Navy: '#242e4e',
  Red: '#b52632', White: '#ffffff', Yellow: '#e8b921',
};

const productTypes = {
  'Oversized tees': 'Oversized T-shirt',
  'Boxy tees': 'Boxy T-shirt',
  Hoodies: 'Clasp hoodie',
  Vests: 'Sleeveless vest',
  Sweatshirts: 'Crewneck sweatshirt',
};

const sizeLabels = { S: 'Small', M: 'Medium', L: 'Large', XL: 'Extra large', XXL: 'Double extra large' };

function productDescription(product) {
  if (product.description) return product.description;
  const colour = product.color.toLowerCase();
  if (product.type === 'Oversized tees') {
    const graphic = product.name.includes('Motorsport') ? 'motorsport graphic' : 'graphic print';
    return `This ${colour} short-sleeve tee has a ${graphic} and a roomy, oversized cut.`;
  }
  if (product.type === 'Vests') {
    const graphic = product.name.includes('Football') ? 'football graphic' : 'number 23 graphic';
    return `A ${colour} sleeveless dot-knit vest with a ${graphic}. Wear it on its own or layer it over a tee.`;
  }
  return `A ${colour} long-sleeve crewneck sweatshirt for casual layering.`;
}

function SizeChart({ product }) {
  return <details className="rounded-lg border border-line bg-white px-3 py-2">
    <summary className="cursor-pointer py-1 text-sm font-semibold">Size chart</summary>
    <table className="mt-2 w-full text-left text-sm">
      <thead className="border-b border-line"><tr><th scope="col" className="py-1">Label</th><th scope="col" className="py-1">Size</th></tr></thead>
      <tbody>{product.variants.map(({ sku, size }) => <tr key={sku} className="border-b border-line">
        <th scope="row" className="py-1.5 font-semibold">{size}</th><td className="py-1.5">{sizeLabels[size] || size}</td>
      </tr>)}</tbody>
    </table>
    <p className="mt-3 text-xs text-muted">Size labels are from {product.retailer || 'BS Menz Shop'}. Ask Q Fashion for chest width and garment length before choosing a size.</p>
  </details>;
}

function StylePreview({ product, side, women }) {
  const vest = product.type === 'Vests';
  const index = Number(product.id.slice(-2)) - 1;
  const firstGroup = index < 4;
  const board = vest ? 'vests' : firstGroup ? 'tees-a' : 'tees-b';
  const columns = vest ? 5 : firstGroup ? 4 : 3;
  const column = vest || firstGroup ? index : index - 4;
  const ratio = vest ? 0.6 : !side ? 1 : firstGroup ? 0.667 : 0.89;
  return <div role="img" aria-label={product.name + ' AI styling preview'} className="mx-auto w-full"
    style={{ aspectRatio: ratio, maxWidth: `min(100%, ${ratio * 100}cqh)`, backgroundImage: 'url(/bs-menz/' + board + (side ? '-side' : '') + '-white.jpg)', backgroundSize: (columns * 100) + '% ' + (vest ? '100%' : '200%'), backgroundPosition: (column * 100 / (columns - 1)) + '% ' + (women ? '100%' : '0%'), backgroundRepeat: 'no-repeat' }} />;
}

function ProductGallery({ product }) {
  const track = useRef(null);
  const [index, setIndex] = useState(0);
  const slides = Object.entries(product.photos).map(([angle, src]) => ({
    label: { front: 'Front photo', back: 'Back photo', angle: 'Garment angle', detail: 'Garment detail' }[angle], src,
  }));
  if (product.stylingPhoto) {
    slides.push({ label: product.stylingLabel || 'AI styling · front and side', src: product.stylingPhoto, generated: true });
  } else if (product.styling !== false) {
    slides.push({ label: 'Men’s styling' }, { label: 'Men’s side' });
    if (product.type === 'Oversized tees') slides.push({ label: 'Women’s styling' }, { label: 'Women’s side' });
  }
  function move(next) {
    const position = Math.max(0, Math.min(slides.length - 1, next));
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    track.current.scrollTo({ left: track.current.clientWidth * position, behavior: reduceMotion ? 'instant' : 'smooth' });
  }
  return <section className="space-y-3" aria-label="Product photo gallery">
    <div ref={track} tabIndex={0} aria-label="Swipe or use arrow keys to see photos"
      className="mx-auto flex aspect-[4/5] max-h-[min(52svh,24rem)] w-[min(100%,41.6svh,19.2rem)] snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-lg border border-line bg-white [scrollbar-width:none]"
      onScroll={e => {
        const el = e.currentTarget;
        setIndex(Math.max(0, Math.min(slides.length - 1, Math.round(el.scrollLeft / el.clientWidth))));
      }}
      onKeyDown={e => {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        e.preventDefault();
        move(index + (e.key === 'ArrowRight' ? 1 : -1));
      }}>
      {slides.map(slide => <div key={slide.label} className="flex h-full w-full shrink-0 snap-start items-center justify-center overflow-hidden [container-type:size]">
        {slide.src ? <img className="h-full w-full object-contain" src={slide.src} loading="lazy" draggable={false} alt={product.name + ' · ' + slide.label} /> :
          <StylePreview product={product} side={slide.label.includes('side')} women={slide.label.includes('Women')} />}
      </div>)}
    </div>
    <div className="flex items-center justify-between gap-2">
      <button type="button" className="btn-ghost min-h-11" onClick={() => move(index - 1)} disabled={index === 0} aria-label="Previous photo">←</button>
      <p className="text-sm text-center" aria-live="polite">{slides[index].label} · {index + 1} / {slides.length}</p>
      <button type="button" className="btn-ghost min-h-11" onClick={() => move(index + 1)} disabled={index === slides.length - 1} aria-label="Next photo">→</button>
    </div>
    <p className="text-xs text-muted">{slides.length > 1 ? 'Swipe to see more. ' : ''}{slides[index].src && !slides[index].generated ? 'Original product photo.' : 'AI styling preview. Original photos show the actual print and colour.'}</p>
  </section>;
}

function ProductDialog({ product, basket, onAdd, onClose }) {
  const ref = useRef(null);
  const [size, setSize] = useState(product.variants[0]?.size || '');
  useEffect(() => {
    const previous = document.activeElement;
    ref.current?.showModal();
    return () => previous?.focus?.();
  }, []);
  const sku = product.variants.find(variant => variant.size === size)?.sku;
  const inBasket = basket.some(item => item.sku === sku);
  const shopName = product.retailer || 'BS Menz Shop';
  const shop = shops[shopName];
  return <dialog ref={ref} onClose={onClose} className="collection-dialog collection-dialog-wide" aria-label={product.name}>
    <div className="dialog-heading"><h2>{product.name}</h2><button type="button" onClick={() => ref.current.close()} className="btn-quiet">Close</button></div>
    <div className="grid gap-6 p-5 md:grid-cols-2">
      <ProductGallery product={product} />
      <div className="space-y-3">
        <p className="text-sm leading-relaxed">{productDescription(product)}</p>
        {shop && <section aria-label="About the shop" className="rounded-lg border border-line bg-white p-3 text-sm">
          <h3 className="font-semibold">{shopName}</h3>
          <p className="mt-1">{shop.description}</p>
          {shop.location && <p className="mt-1 text-muted">{shop.location}</p>}
          <a href={shop.mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block underline underline-offset-4">
            View shop location on Google Maps
          </a>
        </section>}
        <dl className="grid grid-cols-2 gap-2 rounded-lg border border-line bg-white p-3 text-sm">
          <dt className="text-muted">Type</dt><dd className="font-medium">{productTypes[product.type]}</dd>
          <dt className="text-muted">Colour</dt><dd className="font-medium">{product.color}</dd>
          <dt className="text-muted">Fabric</dt><dd className="font-medium">{product.fabric || 'Awaiting retailer confirmation'}</dd>
        </dl>
        {sku ? <label className="block">Size<select value={size} onChange={e => setSize(e.target.value)} className="field mt-1">
          {product.variants.map(variant => <option key={variant.sku}>{variant.size}</option>)}
        </select></label> : <p className="notice">Sizes and stock are being confirmed.</p>}
        <SizeChart product={product} />
        <PriceBreakdown items={[product]} />
        <p className="text-sm">Free delivery on orders of two or more items.</p>
        <button type="button" className="btn-primary" disabled={inBasket || !sku} onClick={() => {
          onAdd({ sku, size, name: product.name, type: product.type, sellPrice: product.sellPrice });
          ref.current.close();
        }}>{!sku ? 'Sizes coming soon' : inBasket ? 'Size already in estimate' : 'Add to basket estimate'}</button>
        <p className="notice">Final delivery eligibility and tax on fees will be confirmed before ordering opens.</p>
      </div>
    </div>
  </dialog>;
}

const combos = [
  { name: 'Tee + vest', ids: ['BSM-TEE01', 'BSM-VEST01'] },
  { name: 'Tee + sweatshirt', ids: ['BSM-TEE02', 'BSM-SWEAT01'] },
  { name: 'Two different tees', ids: ['BSM-TEE03', 'BSM-TEE04'] },
];

function ComboCard({ combo, basket, onAdd }) {
  const pieces = combo.ids.map(id => products.find(product => product.id === id));
  const [sizes, setSizes] = useState(() => pieces.map(piece => piece.variants[0].size));
  const choices = pieces.map((piece, index) => {
    const variant = piece.variants.find(row => row.size === sizes[index]);
    return { sku: variant.sku, size: variant.size, name: piece.name, type: piece.type, sellPrice: piece.sellPrice };
  });
  const alreadyAdded = choices.some(choice => basket.some(item => item.sku === choice.sku));
  const { totalPaise, deliveryDiscountPaise } = estimate(choices);
  return <article className="card p-4 space-y-3">
    <h3 className="font-bold">{combo.name}</h3>
    <div className="grid grid-cols-2 gap-3">
      {pieces.map((piece, index) => <div className="min-w-0" key={piece.id}>
        <img className="aspect-square w-full object-contain bg-canvas rounded-lg" src={piece.photos.front || piece.photos.back} alt={piece.name} loading="lazy" />
        <label className="block text-xs mt-2">{piece.name}
          <select className="field mt-1" aria-label={piece.name + ' size in ' + combo.name} value={sizes[index]}
            onChange={event => { const size = event.target.value; setSizes(current => current.map((value, i) => i === index ? size : value)); }}>
            {piece.variants.map(variant => <option key={variant.sku}>{variant.size}</option>)}
          </select>
        </label>
      </div>)}
    </div>
    <p className="text-sm"><s className="text-muted">{inr((totalPaise + deliveryDiscountPaise) / 100)}</s> <strong>{inr(totalPaise / 100)}</strong> estimated total</p>
    <p className="text-xs">Save {inr(deliveryDiscountPaise / 100)} on delivery</p>
    <button type="button" disabled={alreadyAdded} className="btn-primary w-full" onClick={() => onAdd(choices)}>
      {alreadyAdded ? 'One of these sizes is in the basket' : 'Add combo to basket estimate'}
    </button>
  </article>;
}

const basketKey = 'qfashion.bs-menz.basket.v1';

function readBasket() {
  try {
    const skus = JSON.parse(sessionStorage.getItem(basketKey) || '[]');
    if (!Array.isArray(skus)) return [];
    return catalog.flatMap(product => product.variants
      .filter(variant => variant.stock !== 0 && skus.includes(variant.sku))
      .map(({ sku, size }) => ({ sku, size, name: product.name, type: product.type, sellPrice: product.sellPrice })));
  } catch {
    return [];
  }
}

function BasketDialog({ basket, onRemove, onClose, user, onAccount, onPayment }) {
  const ref = useRef(null);
  const [step, setStep] = useState('bag');
  const [address, setAddress] = useState(null);
  useEffect(() => {
    const previous = document.activeElement;
    ref.current?.showModal();
    return () => previous?.focus?.();
  }, []);
  function reviewDelivery(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setAddress(Object.fromEntries([...data].map(([key, value]) => [key, value.trim()])));
    setStep('review');
  }
  return <dialog ref={ref} onClose={onClose} className="collection-dialog" aria-labelledby="bs-basket-heading">
    <div className="dialog-heading">
      <h2 id="bs-basket-heading">{step === 'bag' ? 'Your bag' : step === 'delivery' ? 'Delivery address' : 'Review delivery'}</h2>
      <button type="button" className="btn-quiet" onClick={() => ref.current.close()}>Close</button>
    </div>
    <div className="space-y-4 p-5">
      {step === 'bag' && (basket.length ? <>
        <ul className="space-y-3">{basket.map(item => <li key={item.sku} className="flex items-center justify-between gap-3 text-sm">
          <span>{item.name} · {item.size}</span>
          <button type="button" className="underline" aria-label={'Remove ' + item.name + ' size ' + item.size} onClick={() => onRemove(item.sku)}>Remove</button>
        </li>)}</ul>
        <PriceBreakdown items={basket} />
        <button type="button" className="btn-primary w-full" onClick={() => setStep('delivery')}>Enter delivery address</button>
      </> : <>
        <p className="text-sm">Choose a size on an item in the collection to add it to your bag.</p>
        <a href="#collection" className="btn-primary" onClick={onClose}>Browse the collection</a>
      </>)}
      {step === 'delivery' && import.meta.env.VITE_QF_PILOT_CHECKOUT === 'true' && <PilotCheckout
        user={user} basket={basket} onAccount={onAccount} onPayment={onPayment} />}
      {step === 'delivery' && import.meta.env.VITE_QF_PILOT_CHECKOUT !== 'true' && <form onSubmit={reviewDelivery} className="space-y-4">
        <label className="block text-sm font-medium">Flat or house number, building and street
          <input name="street" required pattern=".*\S.*" maxLength={160} autoComplete="address-line1" className="field mt-1" defaultValue={address?.street} />
        </label>
        <label className="block text-sm font-medium">Area and nearby landmark
          <input name="area" required pattern=".*\S.*" maxLength={120} autoComplete="address-line2" className="field mt-1" defaultValue={address?.area} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-medium">City or town
            <input name="city" required pattern=".*\S.*" maxLength={80} autoComplete="address-level2" className="field mt-1" defaultValue={address?.city || 'Guwahati'} />
          </label>
          <label className="block text-sm font-medium">PIN code
            <input name="pincode" required pattern="[1-9][0-9]{5}" maxLength={6} inputMode="numeric" autoComplete="postal-code" className="field mt-1" placeholder="6 digits" defaultValue={address?.pincode} />
          </label>
        </div>
        <p className="text-sm text-muted">Delivery coverage and the final total will be confirmed when checkout opens.</p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" className="btn-quiet" onClick={() => setStep('bag')}>Back to bag</button>
          <button type="submit" className="btn-primary">Review delivery</button>
        </div>
      </form>}
      {step === 'review' && <>
        <address className="rounded-lg border border-line bg-white p-3 text-sm not-italic">
          <p>{address.street}</p><p>{address.area}</p><p>{address.city} · {address.pincode}</p>
        </address>
        <PriceBreakdown items={basket} />
        <p className="notice" role="status">This is a preview. Online ordering and payment are coming soon.</p>
        <button type="button" className="btn-quiet" onClick={() => setStep('delivery')}>Edit address</button>
      </>}
    </div>
  </dialog>;
}

function ProductCards({ cards, onSelect }) {
  return <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      {cards.map(({ product, alternate }) => <button type="button" key={product.id + (alternate ? '-angle' : '')} className="card flex min-w-0 flex-col overflow-hidden text-left transition-shadow hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" onClick={() => onSelect(product)}>
        <img className="aspect-[4/5] w-full border-b border-line bg-white object-contain" src={(alternate && (product.photos.angle || product.photos.back)) || product.photos.front || product.photos.back} alt="" loading="lazy" />
        <div className="flex flex-1 flex-col p-3 sm:p-4">
          <p className="mb-2 flex items-center gap-2 text-xs text-muted">
            <span aria-hidden="true" className="h-4 w-4 shrink-0 rounded-full border border-black/25" style={{ backgroundColor: colourSwatches[product.color] }} />
            {product.color}
          </p>
          <h3 className="text-sm font-semibold leading-snug sm:text-base">{product.name}</h3>
          <p className="mb-2 mt-1 text-xs leading-relaxed text-muted">
            {product.fabric || productTypes[product.type]} · {product.variants.map(variant => variant.size).join(', ')}
          </p>
          {alternate && <p className="mb-2 text-xs text-muted">Another view</p>}
          <p className="mt-auto text-xl font-bold leading-tight tracking-tight sm:text-2xl">{inr(product.sellPrice)}</p>
          <p className="mt-1 text-xs font-semibold">Free delivery on 2+ items</p>
          <p className="text-xs text-muted">₹100 delivery for one item</p>
        </div>
      </button>)}
    </div>;
}

export default function BsMenzCollection({ bagOpen, onOpenBag, onCloseBag, onBagCount, user, onAccount, onPayment }) {
  const [type, setType] = useState('All');
  const [selected, setSelected] = useState(null);
  const [basket, setBasket] = useState(readBasket);
  useEffect(() => {
    onBagCount(basket.length);
    try { sessionStorage.setItem(basketKey, JSON.stringify(basket.map(item => item.sku))); } catch { /* The bag works without storage. */ }
  }, [basket, onBagCount]);
  const removeItem = sku => setBasket(current => current.filter(row => row.sku !== sku));
  function addItems(items) {
    setBasket(current => current.some(row => items.some(item => item.sku === row.sku)) ? current : [...current, ...items]);
  }
  const shown = type === 'All' ? mixedCards : catalog
    .filter(product => categories[type].includes(product.type))
    .map(product => ({ product, alternate: false }));
  return <section className="page-section collection-section" id="collection" aria-labelledby="collection-title">
    <span id="darkwolves" className="block scroll-mt-24" aria-hidden="true" />
    <div className="section-heading">
      <div><h2 id="collection-title">Shop the <em>collection.</em></h2></div>
      <p>Tees, vests, sweatshirts and hoodies from Guwahati’s local shops.</p>
    </div>
    <p className="mb-4 text-sm">₹100 delivery for one item. Free delivery on orders of two or more items.</p>
    {basket.length > 0 && <section className="card p-4 mb-5" aria-labelledby="bs-estimate-title">
      <h3 className="font-bold mb-2" id="bs-estimate-title">Basket estimate ({basket.length})</h3>
      <ul className="space-y-2 mb-3">{basket.map(item => <li key={item.sku} className="flex gap-3 justify-between text-sm">
        <span>{item.name} · {item.size}</span>
        <button type="button" className="underline" aria-label={'Remove ' + item.name + ' size ' + item.size}
          onClick={() => removeItem(item.sku)}>Remove</button>
      </li>)}</ul>
      <PriceBreakdown items={basket} />
      <button type="button" className="btn-primary mt-3" onClick={onOpenBag}>Review bag and delivery</button>
    </section>}
    <div className="flex flex-wrap gap-2 mb-5" aria-label="Filter products">
      {['All', ...Object.keys(categories)].map(option => <button type="button" key={option} aria-pressed={type === option} className={type === option ? 'chip chip-on' : 'chip'} onClick={() => setType(option)}>{option}</button>)}
    </div>
    <ProductCards cards={shown} onSelect={setSelected} />
    <section className="mt-10" aria-labelledby="bs-combos">
      <h3 id="bs-combos" className="font-editorial text-3xl mb-2">Build a combo</h3>
      <p className="text-sm mb-4">Choose a size for each piece. Every combo saves ₹100 on delivery.</p>
      <div className="grid gap-4 md:grid-cols-3">
        {combos.map(combo => <ComboCard key={combo.name} combo={combo} basket={basket} onAdd={addItems} />)}
      </div>
    </section>
    {bagOpen && <BasketDialog basket={basket} onRemove={removeItem} onClose={onCloseBag}
      user={user} onAccount={() => { onCloseBag(); onAccount(); }}
      onPayment={checkout => { onCloseBag(); onPayment(checkout, () => setBasket([])); }} />}
    {selected && <ProductDialog key={selected.id} product={selected} basket={basket}
      onAdd={item => addItems([item])}
      onClose={() => setSelected(null)} />}
  </section>;
}

