import { useEffect, useRef, useState } from 'react';
import products from '../data/bs-menz.json';
import { inr } from '../lib/format.js';

function StylePreview({ product, side, women }) {
  const vest = product.type === 'Vests';
  const index = Number(product.id.slice(-2)) - 1;
  const firstGroup = index < 4;
  const board = vest ? 'vests' : firstGroup ? 'tees-a' : 'tees-b';
  const columns = vest ? 5 : firstGroup ? 4 : 3;
  const column = vest || firstGroup ? index : index - 4;
  const ratio = vest ? 0.6 : !side ? 1 : firstGroup ? 0.667 : 0.89;
  return <div role="img" aria-label={product.name + ' AI styling preview'} className="w-full max-w-md mx-auto rounded-lg"
    style={{ aspectRatio: ratio, backgroundImage: 'url(/bs-menz/' + board + (side ? '-side' : '') + '.jpg)', backgroundSize: (columns * 100) + '% ' + (vest ? '100%' : '200%'), backgroundPosition: (column * 100 / (columns - 1)) + '% ' + (women ? '100%' : '0%'), backgroundRepeat: 'no-repeat' }} />;
}

function ProductDialog({ product, onClose }) {
  const ref = useRef(null);
  const [angle, setAngle] = useState('Front');
  const [size, setSize] = useState('M');
  useEffect(() => {
    const previous = document.activeElement;
    ref.current?.showModal();
    return () => previous?.focus?.();
  }, []);
  const itemGst = product.sellPrice * 0.05;
  const deliveryFee = 100;
  const platformFee = product.type === 'Vests' ? 10 : 22.5;
  const original = angle === 'Front' || angle === 'Back';
  return <dialog ref={ref} onClose={onClose} className="collection-dialog collection-dialog-wide" aria-label={product.name}>
    <div className="dialog-heading"><h2>{product.name}</h2><button type="button" onClick={() => ref.current.close()} className="btn-quiet">Close</button></div>
    <div className="grid gap-6 p-5 md:grid-cols-2">
      <div className="space-y-3">
        {original ? <img className="w-full max-h-[55vh] object-contain rounded-lg" src={product.photos[angle.toLowerCase()]} alt={product.name + ' ' + angle.toLowerCase()} /> :
          <StylePreview product={product} side={angle.includes('side')} women={angle.includes('Women')} />}
        <div className="flex flex-wrap gap-2" aria-label="Photo views">
          {['Front', 'Back', 'Men’s styling', 'Men’s side', ...(product.type === 'Vests' ? [] : ['Women’s styling', 'Women’s side'])].map(view =>
            <button key={view} type="button" aria-pressed={angle === view} onClick={() => setAngle(view)} className={angle === view ? 'chip chip-on' : 'chip'}>{view}</button>)}
        </div>
        {!original && <p className="text-sm text-muted">AI styling preview. See the original photos for the garment’s print and colour.</p>}
      </div>
      <div className="space-y-3">
        <p className="eyebrow">BS MENZ SHOP</p>
        <p>{product.fabric}</p>
        <label className="block">Size<select value={size} onChange={e => setSize(e.target.value)} className="field mt-1">
          {product.variants.map(variant => <option key={variant.sku}>{variant.size}</option>)}
        </select></label>
        <dl className="space-y-2 border-t border-line pt-3 text-sm">
          <div className="flex justify-between"><dt>Selling price</dt><dd>{inr(product.sellPrice)}</dd></div>
          <div className="flex justify-between"><dt>Delivery</dt><dd>{inr(deliveryFee)}</dd></div>
          <div className="flex justify-between"><dt>Estimated apparel GST (5%)</dt><dd>{inr(itemGst)}</dd></div>
          <div className="flex justify-between"><dt>Platform fee</dt><dd>{inr(platformFee)}</dd></div>
          <div className="flex justify-between border-t border-line pt-2 font-semibold"><dt>Estimated total</dt><dd>{inr(product.sellPrice + itemGst + deliveryFee + platformFee)}</dd></div>
        </dl>
        <p className="notice">Single-item estimate for Guwahati and Amingaon, within approximately 30 km of the shop. Final delivery eligibility and tax on fees will be confirmed before ordering opens.</p>
      </div>
    </div>
  </dialog>;
}

export default function BsMenzCollection() {
  const [type, setType] = useState('All');
  const [selected, setSelected] = useState(null);
  const shown = type === 'All' ? products : products.filter(product => product.type === type);
  return <section className="page-section collection-section" id="collection" aria-labelledby="bs-menz-title">
    <div className="section-heading"><div><p className="eyebrow">BS MENZ SHOP</p><h2 id="bs-menz-title">The streetwear <em>collection.</em></h2></div><p>Oversized tees and dot knit vests.<br />Sizes M–XXL.</p></div>
    <div className="flex flex-wrap gap-2 mb-5" aria-label="Filter products">
      {['All', 'Oversized tees', 'Vests'].map(option => <button type="button" key={option} aria-pressed={type === option} className={type === option ? 'chip chip-on' : 'chip'} onClick={() => setType(option)}>{option}</button>)}
    </div>
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      {shown.map(product => <button type="button" key={product.id} className="card overflow-hidden text-left hover:shadow-md" onClick={() => setSelected(product)}>
        <img className="aspect-[4/5] w-full object-contain bg-canvas" src={product.photos.front} alt={product.name} loading="lazy" />
        <div className="p-3"><p className="eyebrow">{product.type}</p><h3 className="font-bold my-1">{product.name}</h3><p>{inr(product.sellPrice)} <span className="text-xs text-muted">item price</span></p></div>
      </button>)}
    </div>
    {selected && <ProductDialog key={selected.id} product={selected} onClose={() => setSelected(null)} />}
  </section>;
}
