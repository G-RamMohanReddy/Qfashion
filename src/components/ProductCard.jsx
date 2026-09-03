/**
 * Catalogue card.
 *
 * Out-of-stock SKUs are never removed from the grid. They render dimmed and
 * desaturated behind a NOT AVAILABLE tag, stay fully clickable through to the
 * product page, and swap Add to Bag for Notify Me — a catalogue with no gaps
 * looks fabricated, and a shopper who wanted that piece still wants telling
 * when it comes back.
 */

import { useState } from 'react';
import { Zap, Heart, BellRing, Check, ShoppingBag } from 'lucide-react';
import { ProductImage, Badge, RatingPill } from './ui.jsx';
import { inr, cx, shelfState } from '@/lib/format.js';

export default function ProductCard({ product, onOpen, onAdd, onNotify, onWishlist, wished }) {
  const p = product;
  const [size, setSize] = useState(null);
  const [notified, setNotified] = useState(false);
  const shelf = shelfState(p.stock);
  const out = !shelf.available;
  const fast = p.etaMax <= 45;
  const shortStore = (p.store?.name || '').replace(/^(Zara|Trends|FabIndia|Max Fashion|Sole House|Vishal Mega Mart|Snitch|Westside|Levi's|Lifestyle)\s*/, '') || p.store?.name;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-lg border border-line bg-surface transition-shadow hover:shadow-hover">
      <button onClick={() => onOpen(p)} className="relative block aspect-[3/4] w-full overflow-hidden text-left" aria-label={`View ${p.brand} ${p.name}`}>
        <ProductImage
          src={p.images?.front}
          colors={p.colors}
          category={p.category}
          id={p.id}
          angle="Front"
          alt={`${p.brand} ${p.name}`}
          className={cx('h-full w-full transition-transform duration-500 group-hover:scale-[1.03]', out && 'opacity-60 grayscale')}
        />

        {/* out-of-stock treatment */}
        {out && (
          <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 bg-ink/80 py-2 text-center text-xs font-black uppercase tracking-[0.18em] text-white">
            Out of stock
          </span>
        )}

        <div className="absolute inset-x-2 top-2 flex items-start justify-between gap-2">
          {p.isNew && !out ? <Badge tone="primary">NEW</Badge> : <span />}
        </div>

        {!out && (
          <span className={cx('num absolute bottom-2 left-2 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-2xs font-black', fast ? 'bg-speed text-speed-ink' : 'bg-surface/95 text-ink')}>
            {fast && <Zap size={10} strokeWidth={3} />}
            {p.etaMin}–{p.etaMax} MINS
          </span>
        )}
      </button>

      {/* wishlist — always available, in stock or not */}
      <button
        onClick={() => onWishlist(p)}
        aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
        aria-pressed={wished}
        className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-surface/95 shadow-card transition-colors hover:bg-surface"
      >
        <Heart size={15} className={cx(wished ? 'fill-primary text-primary' : 'text-muted')} strokeWidth={2} />
      </button>

      <div className={cx('flex flex-1 flex-col gap-1.5 p-3', out && 'opacity-75')}>
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-extrabold">{p.brand}</p>
          <RatingPill value={p.rating} reviews={p.reviews} />
        </div>
        <button onClick={() => onOpen(p)} className="truncate text-left text-xs font-medium text-muted hover:text-ink">
          {p.name}
        </button>

        <div className="flex flex-wrap items-baseline gap-1.5">
          <span className="num text-base font-black">{inr(p.price)}</span>
          <span className="num text-xs text-muted line-through">{inr(p.mrp)}</span>
          <span className="num text-xs font-bold text-primary">({p.discount}% OFF)</span>
        </div>

        <p className={cx('truncate text-2xs font-semibold', out ? 'text-danger' : shelf.key === 'in' ? 'text-muted' : 'text-speed-ink')}>
          {out ? `Sold out at ${shortStore}` : `${shelf.label} · ${shortStore}`}
        </p>

        <div className="mt-auto space-y-2 pt-1.5">
          {!out && (
            <div className="flex flex-wrap gap-1">
              {p.sizes.slice(0, 6).map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s === size ? null : s)}
                  aria-pressed={s === size}
                  className={cx(
                    'num min-w-[2rem] rounded border px-1.5 py-1 text-2xs font-bold transition-colors',
                    s === size ? 'border-primary bg-primary text-white' : 'border-line-strong text-muted hover:border-ink hover:text-ink'
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {out ? (
            <div className="flex gap-1.5">
              <button
                onClick={() => {
                  setNotified(true);
                  onNotify?.(p);
                }}
                disabled={notified}
                className="btn flex-1 gap-1.5 rounded border border-line-strong bg-surface py-2 text-2xs font-bold text-muted hover:border-ink hover:text-ink disabled:opacity-60"
              >
                {notified ? <Check size={12} /> : <BellRing size={12} />}
                {notified ? 'We’ll notify you' : 'Notify Me'}
              </button>
              <button onClick={() => onWishlist(p)} className={cx('btn rounded border px-2.5 py-2', wished ? 'border-primary text-primary' : 'border-line-strong text-muted hover:border-ink')} aria-label="Add to wishlist">
                <Heart size={13} className={wished ? 'fill-primary' : ''} />
              </button>
            </div>
          ) : (
            <button onClick={() => onAdd(p, size)} className="btn-primary w-full py-2 text-xs">
              <ShoppingBag size={13} strokeWidth={2.6} />
              Add to bag
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
