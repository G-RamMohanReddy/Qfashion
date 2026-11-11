import { useEffect, useRef, useState } from 'react';
import products from '../data/bs-menz.json';
import { inr } from '../lib/format.js';

function estimate(items) {
  const itemPaise = items.reduce((sum, item) => sum + item.sellPrice * 100, 0);
  const gstPaise = Math.round(itemPaise * 0.05);
  const platformPaise = items.reduce((sum, item) => sum + (item.type === 'Oversized tees' ? 2250 : 1000), 0);
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

function StylePreview({ product, side, women }) {
  const vest = product.type === 'Vests';
  const index = Number(product.id.slice(-2)) - 1;
  const firstGroup = index < 4;
  const board = vest ? 'vests' : firstGroup ? 'tees-a' : 'tees-b';
  const columns = vest ? 5 : firstGroup ? 4 : 3;
  const column = vest || firstGroup ? index : index - 4;
  const ratio = vest ? 0.6 : !side ? 1 : firstGroup ? 0.667 : 0.89;
  return <div role="img" aria-label={product.name + ' AI styling preview'} className="w-full max-w-md mx-auto rounded-lg"
    style={{ aspectRatio: ratio, maxWidth: `min(100%, ${ratio * 50}vh, ${ratio * 25}rem)`, backgroundImage: 'url(/bs-menz/' + board + (side ? '-side' : '') + '.jpg)', backgroundSize: (columns * 100) + '% ' + (vest ? '100%' : '200%'), backgroundPosition: (column * 100 / (columns - 1)) + '% ' + (women ? '100%' : '0%'), backgroundRepeat: 'no-repeat' }} />;
}

function ProductGallery({ product }) {
  const track = useRef(null);
  const [index, setIndex] = useState(0);
  const slides = Object.entries(product.photos).map(([angle, src]) => ({
    label: angle === 'front' ? 'Front photo' : 'Back photo', src,
  }));
  if (product.styling !== false) {
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
      className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-lg bg-canvas"
      onScroll={e => {
        const el = e.currentTarget;
        setIndex(Math.max(0, Math.min(slides.length - 1, Math.round(el.scrollLeft / el.clientWidth))));
      }}
      onKeyDown={e => {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        e.preventDefault();
        move(index + (e.key === 'ArrowRight' ? 1 : -1));
      }}>
      {slides.map(slide => <div key={slide.label} className="flex h-[min(50vh,25rem)] w-full shrink-0 snap-start items-center justify-center overflow-hidden">
        {slide.src ? <img className="h-full w-full object-contain" src={slide.src} loading="lazy" draggable={false} alt={product.name + ' · ' + slide.label} /> :
          <div className="w-full max-w-[16rem] h-full flex items-center">
            <StylePreview product={product} side={slide.label.includes('side')} women={slide.label.includes('Women')} />
          </div>}
      </div>)}
    </div>
    <div className="flex items-center justify-between gap-2">
      <button type="button" className="btn-ghost min-h-11" onClick={() => move(index - 1)} disabled={index === 0} aria-label="Previous photo">←</button>
      <p className="text-sm text-center" aria-live="polite">{slides[index].label} · {index + 1} / {slides.length}</p>
      <button type="button" className="btn-ghost min-h-11" onClick={() => move(index + 1)} disabled={index === slides.length - 1} aria-label="Next photo">→</button>
    </div>
    <p className="text-xs text-muted">{slides.length > 1 ? 'Swipe to see more. ' : ''}{slides[index].src ? 'Original product photo.' : 'AI styling preview. Original photos show the actual print and colour.'}</p>
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
  return <dialog ref={ref} onClose={onClose} className="collection-dialog collection-dialog-wide" aria-label={product.name}>
    <div className="dialog-heading"><h2>{product.name}</h2><button type="button" onClick={() => ref.current.close()} className="btn-quiet">Close</button></div>
    <div className="grid gap-6 p-5 md:grid-cols-2">
      <ProductGallery product={product} />
      <div className="space-y-3">
        <p className="eyebrow">BS MENZ SHOP</p>
        {product.fabric && <p>{product.fabric}</p>}
        {sku ? <label className="block">Size<select value={size} onChange={e => setSize(e.target.value)} className="field mt-1">
          {product.variants.map(variant => <option key={variant.sku}>{variant.size}</option>)}
        </select></label> : <p className="notice">Sizes and stock are being confirmed.</p>}
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

export default function BsMenzCollection() {
  const [type, setType] = useState('All');
  const [selected, setSelected] = useState(null);
  const [basket, setBasket] = useState([]);
  const shown = type === 'All' ? products : products.filter(product => product.type === type);
  return <section className="page-section collection-section" id="collection" aria-labelledby="bs-menz-title">
    <div className="section-heading"><div><p className="eyebrow">BS MENZ SHOP</p><h2 id="bs-menz-title">The streetwear <em>collection.</em></h2></div><p>Oversized tees, dot knit vests and sweatshirts.</p></div>
    <p className="mb-4 text-sm">₹100 delivery for one item. Free delivery on orders of two or more items.</p>
    {basket.length > 0 && <section className="card p-4 mb-5" aria-labelledby="bs-estimate-title">
      <h3 className="font-bold mb-2" id="bs-estimate-title">Basket estimate ({basket.length})</h3>
      <ul className="space-y-2 mb-3">{basket.map(item => <li key={item.sku} className="flex gap-3 justify-between text-sm">
        <span>{item.name} · {item.size}</span>
        <button type="button" className="underline" aria-label={'Remove ' + item.name + ' size ' + item.size}
          onClick={() => setBasket(current => current.filter(row => row.sku !== item.sku))}>Remove</button>
      </li>)}</ul>
      <PriceBreakdown items={basket} />
      <p className="text-xs text-muted mt-2">Price estimate only. Ordering opens after final tax and delivery checks.</p>
    </section>}
    <div className="flex flex-wrap gap-2 mb-5" aria-label="Filter products">
      {['All', 'Oversized tees', 'Vests', 'Sweatshirts'].map(option => <button type="button" key={option} aria-pressed={type === option} className={type === option ? 'chip chip-on' : 'chip'} onClick={() => setType(option)}>{option}</button>)}
    </div>
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      {shown.map(product => <button type="button" key={product.id} className="card overflow-hidden text-left hover:shadow-md" onClick={() => setSelected(product)}>
        <img className="aspect-[4/5] w-full object-contain bg-canvas" src={product.photos.front || product.photos.back} alt={product.name} loading="lazy" />
        <div className="p-3"><p className="eyebrow">{product.type}</p><h3 className="font-bold my-1">{product.name}</h3><p>{inr(product.sellPrice)} <span className="text-xs text-muted">item price</span></p></div>
      </button>)}
    </div>
    {selected && <ProductDialog key={selected.id} product={selected} basket={basket}
      onAdd={item => setBasket(current => current.some(row => row.sku === item.sku) ? current : [...current, item])}
      onClose={() => setSelected(null)} />}
  </section>;
}

