/** Renderers for the typed blocks Q-Stylist returns. */

import { Plus, Zap, Star, ShieldCheck, Package, TrendingUp } from 'lucide-react';
import { ProductImage } from './ui.jsx';
import { TRACKER_STEPS } from '@/lib/orders.js';
import { inr, cx } from '@/lib/format.js';

/** Minimal inline markdown: **bold**, line breaks, bullets. */
export function RichText({ text }) {
  return (
    <div className="space-y-1.5">
      {String(text)
        .split('\n')
        .map((line, i) => {
          if (!line.trim()) return null;
          const bullet = /^[•\-]\s+/.test(line);
          const numbered = /^\d\.\s+/.test(line);
          const content = line.replace(/^[•\-]\s+/, '');
          return (
            <p key={i} className={cx('text-sm leading-relaxed', (bullet || numbered) && '-indent-3.5 pl-3.5')}>
              {bullet && <span className="text-primary">• </span>}
              {content.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
                part.startsWith('**') && part.endsWith('**') ? (
                  <strong key={j} className="font-extrabold">{part.slice(2, -2)}</strong>
                ) : (
                  <span key={j}>{part}</span>
                )
              )}
            </p>
          );
        })}
    </div>
  );
}

function MiniCard({ item, onAdd, onView }) {
  return (
    <article className="flex w-[10.5rem] shrink-0 flex-col overflow-hidden rounded-lg border border-line bg-surface">
      <button onClick={() => onView(item)} className="relative aspect-[3/4] w-full" aria-label={`View ${item.name}`}>
        <ProductImage src={item.image} colors={item.colors} category={item.category} id={item.id} angle="Front" alt={item.name} className="h-full w-full" />
        {item.etaLabel && (
          <span className="num absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded bg-speed px-1.5 py-0.5 text-2xs font-black text-speed-ink">
            <Zap size={9} strokeWidth={3} /> {item.etaLabel}
          </span>
        )}
      </button>
      <div className="flex flex-1 flex-col gap-1 p-2">
        <p className="truncate text-2xs font-extrabold">{item.brand}</p>
        <button onClick={() => onView(item)} className="truncate text-left text-2xs text-muted hover:text-ink">{item.name}</button>
        <div className="flex items-baseline gap-1">
          <span className="num text-sm font-black">{inr(item.price)}</span>
          {item.mrp > item.price && <span className="num text-2xs text-muted line-through">{inr(item.mrp)}</span>}
        </div>
        {/* the reason the ranker picked it — the same signal it actually scored on */}
        {item.reason && <p className="line-clamp-2 text-[10px] leading-tight text-muted">{item.reason}</p>}
        <button onClick={() => onAdd(item)} className="btn-primary mt-auto w-full px-2 py-1.5 text-2xs">
          <Plus size={11} strokeWidth={3} /> Add
        </button>
      </div>
    </article>
  );
}

export function ProductsBlock({ block, onAdd, onView }) {
  return (
    <div className="space-y-2">
      {block.title && <p className="text-2xs font-black uppercase tracking-wide text-muted">{block.title}</p>}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {block.items.map((i) => (
          <MiniCard key={i.id} item={i} onAdd={onAdd} onView={onView} />
        ))}
      </div>
      {block.note && <p className="text-2xs text-muted">{block.note}</p>}
    </div>
  );
}

export function OutfitBlock({ block, onAdd, onView, onAddAll }) {
  return (
    <div className="space-y-2 rounded-lg border border-line bg-canvas p-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-2xs font-black uppercase tracking-wide text-muted">{block.title}</p>
        <span className="num text-xs font-black">{inr(block.total)}</span>
      </div>
      <div className="space-y-2">
        {block.slots.map((slot) => (
          <div key={slot.label} className="flex gap-2.5 rounded border border-line bg-surface p-2">
            <ProductImage src={slot.item.image} colors={slot.item.colors} category={slot.item.category} id={slot.item.id} angle="Front" alt={slot.item.name} className="h-16 w-14 shrink-0 rounded" />
            <div className="min-w-0 flex-1">
              <p className="text-2xs font-black uppercase tracking-wide text-muted">{slot.label}</p>
              <button onClick={() => onView(slot.item)} className="block w-full truncate text-left text-xs font-bold hover:text-primary">{slot.item.name}</button>
              <p className="truncate text-2xs text-muted">{slot.item.brand} · {slot.item.storeName}</p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="num text-xs font-black">{inr(slot.item.price)}</span>
                <button onClick={() => onAdd(slot.item)} className="chip px-2 py-1 text-2xs"><Plus size={10} strokeWidth={3} /> Add</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => onAddAll(block.slots.map((s) => s.item))} className="btn-primary w-full py-2 text-xs">
        Add the whole look · {inr(block.total)}
      </button>
    </div>
  );
}

export function OrderBlock({ order }) {
  return (
    <div className="rounded-lg border border-line bg-canvas p-3">
      <div className="flex items-center justify-between">
        <span className="num font-mono text-xs font-black">{order.id}</span>
        <span className="num text-2xs text-muted">{inr(order.total)}</span>
      </div>
      <ol className="mt-2.5 flex gap-1">
        {TRACKER_STEPS.map((s, i) => (
          <li key={s.key} className="flex-1">
            <span className={cx('block h-1 rounded-full', i <= order.step ? 'bg-success' : 'bg-line')} />
            <span className={cx('mt-1 block text-[9px] leading-tight', i <= order.step ? 'text-ink' : 'text-muted')}>{s.label}</span>
          </li>
        ))}
      </ol>
      {order.otp && order.status !== 'delivered' && (
        <p className="mt-2.5 flex items-center gap-1.5 text-2xs text-muted">
          <ShieldCheck size={11} className="text-success" /> OTP <span className="num font-mono text-xs font-black text-ink">{order.otp}</span>
        </p>
      )}
      <p className="mt-1 flex items-center gap-1.5 text-2xs text-muted">
        <Package size={11} /> {order.itemCount} item{order.itemCount > 1 ? 's' : ''} from {order.storeName}
      </p>
    </div>
  );
}

export function RatingBlock({ onRate }) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-line bg-canvas p-2.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} onClick={() => onRate(n)} aria-label={`Rate ${n} out of 5`} className="group rounded p-1 transition-transform hover:scale-110">
          <Star size={20} className="text-muted transition-colors group-hover:fill-success group-hover:text-success" />
        </button>
      ))}
      <span className="ml-1 text-2xs text-muted">Tap a star</span>
    </div>
  );
}

export function SizeChartBlock({ block }) {
  if (!block.chart) return null;
  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-surface">
      <table className="w-full border-collapse text-2xs">
        <thead>
          <tr className="bg-canvas">
            {block.chart.columns.map((c) => (
              <th key={c.key} className="border-b border-line px-2 py-1.5 text-left font-black uppercase tracking-wide text-muted">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.chart.rows.map((r) => (
            <tr key={r.size} className="border-b border-line last:border-b-0">
              {block.chart.columns.map((c, i) => (
                <td key={c.key} className={cx('num px-2 py-1.5', i === 0 ? 'font-black' : 'text-muted')}>
                  {r[c.key] == null ? '—' : c.convert ? `${r[c.key]}"` : r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Small transparency strip: what the ranker weighted, for the curious. */
export function WeightsNote({ weights }) {
  if (!weights) return null;
  return (
    <p className="flex items-center gap-1.5 px-1 text-[10px] text-muted">
      <TrendingUp size={10} />
      Ranked by {Math.round(weights.similarity * 100)}% match · {Math.round(weights.availability * 100)}% in-stock · {Math.round(weights.proximity * 100)}% distance
    </p>
  );
}
