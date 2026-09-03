/**
 * Product details page (as a modal over the grid).
 *
 * The gallery is the point: four labelled angles — Front, Back, Fabric,
 * Model — belonging to this SKU and only this SKU. They are allocated per
 * product line in `catalogBase.js`, never sampled at render, so a shopper never
 * sees another product's photograph on this page.
 */

import { useEffect, useState } from 'react';
import {
  X, Ruler, Store, Zap, ShieldCheck, RotateCcw, Sparkles, Heart, BellRing, Check,
  ShoppingBag, ChevronRight, Truck, Tag,
} from 'lucide-react';
import { Modal, ProductImage, Badge, RatingPill } from './ui.jsx';
import SizeGuideModal from './SizeGuideModal.jsx';
import { COLOR_SWATCHES, PLATFORM, BRAND_FIT_NOTES } from '@/data/seedData.js';
import { inr, cx, shelfState, distanceLabel } from '@/lib/format.js';

export default function ProductDetails({ product, similar = [], onClose, onAdd, onNotify, onWishlist, wished, onAskStylist, onOpen }) {
  const [size, setSize] = useState(null);
  const [angle, setAngle] = useState(0);
  const [guide, setGuide] = useState(false);
  const [notified, setNotified] = useState(false);

  useEffect(() => {
    setSize(null);
    setAngle(0);
    setNotified(false);
  }, [product?.id]);

  if (!product) return null;
  const p = product;
  const shelf = shelfState(p.stock);
  const out = !shelf.available;
  const fitNote = BRAND_FIT_NOTES[p.brand];

  return (
    <>
      <Modal open onClose={onClose} wide label={p.name}>
        <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-3">
          <div className="min-w-0">
            <p className="text-2xs font-bold uppercase tracking-wide text-muted">{p.lineLabel} · {p.sku}</p>
            <h2 className="truncate text-lg font-extrabold leading-tight">
              {p.brand} <span className="font-medium text-muted">{p.name}</span>
            </h2>
          </div>
          <button onClick={onClose} className="mt-1 shrink-0 text-muted hover:text-ink" aria-label="Close">
            <X size={18} />
          </button>
        </header>

        <div className="grid flex-1 gap-6 overflow-y-auto p-5 md:grid-cols-2">
          {/* ------------------------------------------------ gallery */}
          <div className="space-y-2">
            <div className="relative">
              <ProductImage
                src={p.gallery[angle].url}
                colors={p.colors}
                category={p.category}
                id={`${p.id}-${angle}`}
                angle={p.gallery[angle].label}
                alt={`${p.name} — ${p.gallery[angle].label} view`}
                eager
                className={cx('aspect-[3/4] w-full rounded-lg border border-line', out && 'opacity-70 grayscale')}
              />
              <span className="absolute left-3 top-3 rounded bg-ink/80 px-2 py-1 text-2xs font-black uppercase tracking-wide text-white">
                {p.gallery[angle].label} view
              </span>
              {out && (
                <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 bg-ink/80 py-2.5 text-center text-sm font-black uppercase tracking-[0.2em] text-white">
                  Not available
                </span>
              )}
            </div>

            <div className="grid grid-cols-4 gap-2">
              {p.gallery.map((g, i) => (
                <button
                  key={g.label}
                  onClick={() => setAngle(i)}
                  aria-label={`${g.label} view`}
                  aria-pressed={i === angle}
                  className={cx('overflow-hidden rounded border-2 transition-colors', i === angle ? 'border-primary' : 'border-line hover:border-line-strong')}
                >
                  <ProductImage src={g.url} colors={p.colors} category={p.category} id={`${p.id}-t${i}`} angle={g.label} alt="" className="aspect-square w-full" />
                  <span className="block bg-surface py-1 text-center text-[10px] font-bold uppercase tracking-wide text-muted">{g.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ------------------------------------------------ details */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <RatingPill value={p.rating} reviews={p.reviews} size="lg" />
              <span className="text-2xs text-muted">{p.gender}</span>
              {p.isNew && <Badge tone="primary">NEW</Badge>}
            </div>

            <div>
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="num text-3xl font-black">{inr(p.price)}</span>
                <span className="num text-base text-muted line-through">{inr(p.mrp)}</span>
                <span className="num text-base font-bold text-primary">({p.discount}% OFF)</span>
              </div>
              <p className="mt-0.5 text-2xs font-bold text-success">inclusive of all taxes · GST {p.gstRate}% applied at checkout</p>
            </div>

            {/* delivery promise */}
            <div className="rounded-lg border border-line bg-canvas p-3">
              {!out ? (
                <p className="flex items-center gap-2 text-sm font-black text-success">
                  <Zap size={15} className="text-speed-ink" strokeWidth={2.6} /> Delivered in {p.etaMin}–{p.etaMax} minutes
                </p>
              ) : (
                <p className="text-sm font-black text-danger">Currently out of stock at this outlet</p>
              )}
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                <Store size={12} /> {p.store?.name} · {distanceLabel(p.km)}
              </p>
              <p className={cx('mt-1 text-xs font-bold', out ? 'text-danger' : shelf.key === 'in' ? 'text-success' : 'text-speed-ink')}>
                {out ? 'We will alert you the moment it is back on the shelf' : `${shelf.label} at this outlet`}
              </p>
            </div>

            {/* colour */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-2xs font-black uppercase tracking-wide">Colour</span>
                <span className="text-2xs font-semibold text-muted">{p.colors.join(' · ')}</span>
              </div>
              <div className="flex gap-2">
                {p.colors.map((c) => (
                  <span key={c} title={c} className="h-8 w-8 rounded-full border-2 border-line-strong" style={{ background: COLOR_SWATCHES[c] || '#ccc' }} />
                ))}
              </div>
            </div>

            {/* size */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-2xs font-black uppercase tracking-wide">Select size</span>
                <button onClick={() => setGuide(true)} className="btn-quiet gap-1 text-2xs font-black uppercase text-primary hover:text-primary-dark">
                  <Ruler size={12} /> Size guide &amp; fit chart
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {p.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    disabled={out}
                    aria-pressed={s === size}
                    className={cx(
                      'num min-w-[3rem] rounded-full border px-3 py-2 text-sm font-bold transition-colors disabled:opacity-40',
                      s === size ? 'border-primary bg-primary text-white' : 'border-line-strong text-ink hover:border-ink'
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {fitNote && <p className="mt-2 text-2xs font-semibold text-muted">Fit note — {fitNote}</p>}
            </div>

            {/* actions */}
            <div className="flex gap-2">
              {out ? (
                <button
                  onClick={() => {
                    setNotified(true);
                    onNotify?.(p);
                  }}
                  disabled={notified}
                  className="btn flex-1 gap-2 rounded border border-line-strong bg-surface py-3 font-bold text-muted hover:border-ink hover:text-ink disabled:opacity-60"
                >
                  {notified ? <Check size={16} /> : <BellRing size={16} />}
                  {notified ? 'We will notify you' : 'Notify me when available'}
                </button>
              ) : (
                <button onClick={() => onAdd(p, size)} className="btn-primary flex-1 py-3 text-base">
                  <ShoppingBag size={16} strokeWidth={2.6} /> Add to bag
                </button>
              )}
              <button
                onClick={() => onWishlist(p)}
                className={cx('btn rounded border px-5 py-3 font-bold', wished ? 'border-primary bg-primary-soft text-primary' : 'border-line-strong text-ink hover:border-ink')}
              >
                <Heart size={16} className={wished ? 'fill-primary' : ''} />
                <span className="hidden sm:inline">{wished ? 'Wishlisted' : 'Wishlist'}</span>
              </button>
            </div>

            <button
              onClick={() => {
                onClose();
                onAskStylist(`What goes with the ${p.colors[0]} ${p.name}?`);
              }}
              className="btn w-full gap-2 rounded border border-line-strong bg-surface py-2.5 text-sm font-bold hover:border-ink"
            >
              <Sparkles size={14} className="text-primary" /> Ask Q-Stylist what to pair it with
              <ChevronRight size={14} />
            </button>

            {/* specs */}
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-line pt-3 text-xs">
              <div>
                <dt className="font-bold text-muted">Fabric</dt>
                <dd className="mt-0.5">{p.fabric}</dd>
              </div>
              <div>
                <dt className="font-bold text-muted">Fit</dt>
                <dd className="mt-0.5">{p.fit}</dd>
              </div>
              <div className="col-span-2">
                <dt className="font-bold text-muted">Care</dt>
                <dd className="mt-0.5">{p.care}</dd>
              </div>
            </dl>

            <p className="text-sm leading-relaxed text-muted">{p.description}</p>

            <ul className="space-y-1.5 border-t border-line pt-3 text-xs text-muted">
              <li className="flex items-center gap-2"><RotateCcw size={13} className="text-success" /> {PLATFORM.returnWindow} easy returns and size exchange</li>
              <li className="flex items-center gap-2"><Truck size={13} className="text-success" /> Free delivery above {inr(PLATFORM.freeDeliveryAbove)}</li>
              <li className="flex items-center gap-2"><ShieldCheck size={13} className="text-success" /> Checked by the store before dispatch</li>
              <li className="flex items-center gap-2"><Tag size={13} className="text-success" /> Sold by {p.store?.name}</li>
            </ul>
          </div>
        </div>

        {/* similar */}
        {similar.length > 0 && (
          <div className="border-t border-line bg-canvas px-5 py-4">
            <p className="mb-3 text-xs font-black uppercase tracking-wide">You may also like</p>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {similar.map((s) => (
                <button key={s.id} onClick={() => onOpen(s)} className="w-32 shrink-0 text-left">
                  <ProductImage
                    src={s.images?.front}
                    colors={s.colors}
                    category={s.category}
                    id={s.id}
                    angle="Front"
                    alt={s.name}
                    className={cx('aspect-[3/4] w-full rounded border border-line', !s.inStock && 'opacity-60 grayscale')}
                  />
                  <p className="mt-1.5 truncate text-2xs font-extrabold">{s.brand}</p>
                  <p className="truncate text-2xs text-muted">{s.name}</p>
                  <p className="num text-xs font-black">{inr(s.price)}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <SizeGuideModal open={guide} onClose={() => setGuide(false)} category={p.sizeChart} brand={p.brand} gender={p.gender} onPickSize={setSize} />
    </>
  );
}
