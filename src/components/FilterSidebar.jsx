/**
 * Left filter rail.
 *
 * Ordered the way shoppers actually narrow down: what it is, how fast it can get
 * here, will it fit, is it any good, who makes it — and price last, because a
 * price slider at the top makes people anchor before they know what things cost.
 * Counts come from the engine with each facet's own filter removed, so ticking
 * one box never zeroes out its neighbours.
 */

import { useState } from 'react';
import { ChevronDown, RotateCcw, Zap, Star } from 'lucide-react';
import { COLOR_SWATCHES, CATEGORIES, APPAREL_SIZES, SHOE_SIZES } from '@/data/seedData.js';
import { PRICE_FLOOR, PRICE_CEILING } from '@/lib/catalog.js';
import { inr, cx } from '@/lib/format.js';

function Section({ title, count, children, open: initial = true }) {
  const [open, setOpen] = useState(initial);
  return (
    <div className="border-b border-line py-3 last:border-b-0">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center justify-between gap-2 text-left">
        <span className="text-2xs font-black uppercase tracking-[0.08em]">
          {title}
          {count > 0 && <span className="num ml-1.5 rounded-full bg-primary px-1.5 py-px text-[10px] font-black text-white">{count}</span>}
        </span>
        <ChevronDown size={14} className={cx('text-muted transition-transform', open && 'rotate-180')} />
      </button>
      {open && <div className="mt-2.5">{children}</div>}
    </div>
  );
}

function Check({ checked, onChange, label, count, children }) {
  return (
    <label className="check">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="flex min-w-0 flex-1 items-center gap-2">
        {children}
        <span className="truncate">{label}</span>
      </span>
      {count != null && <span className="num shrink-0 text-2xs text-muted">{count}</span>}
    </label>
  );
}

const DELIVERY = [
  { id: 'under45', label: 'Under 45 mins' },
  { id: 'under60', label: 'Under 60 mins' },
];

export default function FilterSidebar({ filters, patch, reset, facets, activeCount }) {
  const f = filters;
  const toggle = (key, v) => {
    const cur = f[key] || [];
    patch({ [key]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] });
  };
  const n = (map, k) => map?.[k] || 0;

  return (
    <aside className="flex flex-col">
      <div className="flex items-center justify-between border-b border-line pb-2.5">
        <h2 className="text-sm font-black uppercase tracking-wide">Filters</h2>
        {activeCount > 0 && (
          <button onClick={reset} className="btn-quiet gap-1 text-2xs font-black uppercase text-primary hover:text-primary-dark">
            <RotateCcw size={11} /> Clear all
          </button>
        )}
      </div>

      {/* 1 — what it is */}
      <Section title="Categories" count={f.categories.length}>
        {CATEGORIES.map((c) => (
          <Check key={c} checked={f.categories.includes(c)} onChange={() => toggle('categories', c)} label={c} count={n(facets?.categories, c)} />
        ))}
      </Section>

      {/* 2 — how fast */}
      <Section title="Delivery speed" count={f.delivery !== 'any' ? 1 : 0}>
        {DELIVERY.map((d) => (
          <label key={d.id} className="check">
            <input type="checkbox" checked={f.delivery === d.id} onChange={() => patch({ delivery: f.delivery === d.id ? 'any' : d.id })} />
            <span className="flex items-center gap-1.5">
              <Zap size={12} className="text-speed-ink" strokeWidth={2.6} />
              {d.label}
            </span>
          </label>
        ))}
      </Section>

      {/* 3 — will it fit */}
      <Section title="Size" count={f.sizes.length}>
        <div className="flex flex-wrap gap-1.5">
          {APPAREL_SIZES.map((s) => (
            <button
              key={s}
              onClick={() => toggle('sizes', s)}
              aria-pressed={f.sizes.includes(s)}
              className={cx(
                'num h-9 w-11 rounded border text-xs font-bold transition-colors',
                f.sizes.includes(s) ? 'border-primary bg-primary-soft text-primary' : 'border-line-strong text-ink hover:border-ink',
                !n(facets?.sizes, s) && 'opacity-40'
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <p className="mb-1.5 mt-3 text-2xs font-bold text-muted">Footwear (UK)</p>
        <div className="flex flex-wrap gap-1.5">
          {SHOE_SIZES.map((s) => (
            <button
              key={s}
              onClick={() => toggle('sizes', s)}
              aria-pressed={f.sizes.includes(s)}
              className={cx(
                'num h-9 w-11 rounded border text-xs font-bold transition-colors',
                f.sizes.includes(s) ? 'border-primary bg-primary-soft text-primary' : 'border-line-strong text-ink hover:border-ink',
                !n(facets?.sizes, s) && 'opacity-40'
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </Section>

      {/* 4 — is it any good */}
      <Section title="Customer rating" count={f.minRating > 0 ? 1 : 0}>
        {[4.5, 4, 3.5].map((r) => (
          <label key={r} className="check">
            <input type="checkbox" checked={f.minRating === r} onChange={() => patch({ minRating: f.minRating === r ? 0 : r })} />
            <span className="flex items-center gap-1">
              <span className="num font-bold">{r}</span>
              <Star size={11} className="fill-success text-success" strokeWidth={0} />
              <span className="text-muted">&amp; above</span>
            </span>
          </label>
        ))}
      </Section>

      <Section title="Occasion" count={f.occasions.length} open={false}>
        {Object.keys(facets?.occasions || {}).sort().map((o) => (
          <Check key={o} checked={f.occasions.includes(o)} onChange={() => toggle('occasions', o)} label={o} count={n(facets?.occasions, o)} />
        ))}
      </Section>

      <Section title="Brand" count={f.brands.length} open={false}>
        <div className="max-h-56 overflow-y-auto pr-1">
          {Object.keys(facets?.brands || {}).sort().map((b) => (
            <Check key={b} checked={f.brands.includes(b)} onChange={() => toggle('brands', b)} label={b} count={n(facets?.brands, b)} />
          ))}
        </div>
      </Section>

      <Section title="Colour" count={f.colors.length} open={false}>
        <div className="max-h-60 overflow-y-auto pr-1">
          {Object.keys(facets?.colors || {}).sort().map((c) => (
            <Check key={c} checked={f.colors.includes(c)} onChange={() => toggle('colors', c)} label={c} count={n(facets?.colors, c)}>
              <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-line-strong" style={{ background: COLOR_SWATCHES[c] || '#ccc' }} />
            </Check>
          ))}
        </div>
      </Section>

      {/* last — price */}
      <Section title="Price range">
        <div className="space-y-3 pb-1">
          <div className="flex items-center gap-2">
            <span className="num rounded border border-line-strong px-2 py-1 text-xs font-bold">{inr(f.minPrice)}</span>
            <span className="h-px flex-1 bg-line" />
            <span className="num rounded border border-line-strong px-2 py-1 text-xs font-bold">{inr(f.maxPrice)}</span>
          </div>
          <label className="block">
            <span className="sr-only">Minimum price</span>
            <input type="range" min={PRICE_FLOOR} max={PRICE_CEILING} step={50} value={f.minPrice} onChange={(e) => patch({ minPrice: Math.min(Number(e.target.value), f.maxPrice - 100) })} />
          </label>
          <label className="block">
            <span className="sr-only">Maximum price</span>
            <input type="range" min={PRICE_FLOOR} max={PRICE_CEILING} step={50} value={f.maxPrice} onChange={(e) => patch({ maxPrice: Math.max(Number(e.target.value), f.minPrice + 100) })} />
          </label>
          {facets?.priceBounds && (
            <p className="text-2xs text-muted">
              Stock near you runs {inr(facets.priceBounds.min)} – {inr(facets.priceBounds.max)}
            </p>
          )}
        </div>
      </Section>
    </aside>
  );
}
