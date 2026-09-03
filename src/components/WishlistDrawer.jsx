/**
 * Wishlist.
 *
 * Holds both things people save for later and things they wanted that were out
 * of stock — which is why an unavailable row keeps its Notify Me instead of
 * being quietly dropped.
 */

import { X, Heart, ShoppingBag, BellRing, Trash2 } from 'lucide-react';
import { ProductImage, EmptyState, Badge } from './ui.jsx';
import { inr, cx, shelfState } from '@/lib/format.js';
import { useScrollLock } from '@/hooks/useSync.js';

export default function WishlistDrawer({ open, onClose, items, onOpen, onAdd, onNotify, onRemove }) {
  useScrollLock(open);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[85] flex justify-end" role="dialog" aria-modal="true" aria-label="Your wishlist">
      <button className="absolute inset-0 animate-fade bg-ink/50" onClick={onClose} aria-label="Close" tabIndex={-1} />

      <div className="relative flex h-full w-full max-w-md animate-rise flex-col bg-canvas shadow-pop">
        <header className="flex items-center justify-between border-b border-line bg-surface px-5 py-4">
          <h2 className="flex items-center gap-2 text-base font-extrabold">
            <Heart size={17} className="fill-primary text-primary" /> Wishlist
            {items.length > 0 && <span className="num text-sm font-medium text-muted">({items.length})</span>}
          </h2>
          <button onClick={onClose} className="text-muted hover:text-ink" aria-label="Close wishlist">
            <X size={18} />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex-1 p-5">
            <EmptyState icon={Heart} title="Nothing saved yet" hint="Tap the heart on anything you like — including pieces that are out of stock, so we can tell you when they are back." />
          </div>
        ) : (
          <div className="flex-1 space-y-2 overflow-y-auto p-4">
            {items.map((p) => {
              const shelf = shelfState(p.stock);
              const out = !shelf.available;
              return (
                <div key={p.id} className="flex gap-3 rounded-lg border border-line bg-surface p-3">
                  <button onClick={() => onOpen(p)} className="shrink-0" aria-label={`View ${p.name}`}>
                    <ProductImage
                      src={p.images?.front}
                      colors={p.colors}
                      category={p.category}
                      id={p.id}
                      angle="Front"
                      alt={p.name}
                      className={cx('h-24 w-20 rounded border border-line', out && 'opacity-60 grayscale')}
                    />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-extrabold">{p.brand}</p>
                        <button onClick={() => onOpen(p)} className="block w-full truncate text-left text-xs text-muted hover:text-ink">{p.name}</button>
                      </div>
                      <button onClick={() => onRemove(p.id)} className="shrink-0 text-muted hover:text-danger" aria-label="Remove from wishlist"><Trash2 size={14} /></button>
                    </div>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="num text-sm font-black">{inr(p.price)}</span>
                      <span className="num text-2xs text-muted line-through">{inr(p.mrp)}</span>
                    </div>
                    {out ? <Badge tone="danger" className="mt-1">Out of stock</Badge> : <p className="mt-1 text-2xs font-semibold text-muted">{shelf.label} · {p.store?.name}</p>}
                    <div className="mt-2">
                      {out ? (
                        <button onClick={() => onNotify(p)} className="btn w-full gap-1.5 rounded border border-line-strong py-1.5 text-2xs font-bold text-muted hover:border-ink hover:text-ink">
                          <BellRing size={12} /> Notify me when available
                        </button>
                      ) : (
                        <button onClick={() => onOpen(p)} className="btn-primary w-full py-1.5 text-2xs">
                          <ShoppingBag size={12} /> Move to bag
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
