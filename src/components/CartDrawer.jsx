/**
 * The bag and the bill.
 *
 * The bill panel is the honest part: MRP, the discount, the ₹40 delivery fee
 * (and when it is waived), the ₹15 platform fee and GST at the real slab, each
 * printed as its own row that adds up to the number on the button.
 */

import { useMemo } from 'react';
import { X, ShoppingBag, Minus, Plus, Trash2, Store, MapPin, Zap, ShieldCheck, ArrowRight, Tag } from 'lucide-react';
import { ProductImage, EmptyState, Badge } from './ui.jsx';
import { billRows } from '@/lib/pricing.js';
import { ADDRESSES, HUBS, PLATFORM } from '@/data/seedData.js';
import { inr, cx } from '@/lib/format.js';
import { useScrollLock } from '@/hooks/useSync.js';

export default function CartDrawer({ open, onClose, cart, hubId, addressId, onAddress, onCheckout, busy }) {
  const { lines, setQty, remove, bill } = cart;
  useScrollLock(open);

  const groups = useMemo(() => {
    const m = new Map();
    lines.forEach((l) => {
      if (!m.has(l.storeId)) m.set(l.storeId, { storeId: l.storeId, storeName: l.storeName, lines: [] });
      m.get(l.storeId).lines.push(l);
    });
    return [...m.values()];
  }, [lines]);

  const hub = HUBS.find((h) => h.id === hubId);
  const cityAddresses = ADDRESSES.filter((a) => a.cityId === hub?.cityId);
  const address = cityAddresses.find((a) => a.id === addressId) || cityAddresses.find((a) => a.hubId === hubId) || cityAddresses[0];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[85] flex justify-end" role="dialog" aria-modal="true" aria-label="Your bag">
      <button className="absolute inset-0 animate-fade bg-ink/50" onClick={onClose} aria-label="Close" tabIndex={-1} />

      <div className="relative flex h-full w-full max-w-md animate-rise flex-col bg-canvas shadow-pop">
        <header className="flex items-center justify-between border-b border-line bg-surface px-5 py-4">
          <h2 className="flex items-center gap-2 text-base font-extrabold">
            <ShoppingBag size={17} className="text-primary" /> Your bag
            {bill.itemCount > 0 && <span className="num text-sm font-medium text-muted">({bill.itemCount})</span>}
          </h2>
          <button onClick={onClose} className="text-muted hover:text-ink" aria-label="Close bag">
            <X size={18} />
          </button>
        </header>

        {lines.length === 0 ? (
          <div className="flex-1 p-5">
            <EmptyState icon={ShoppingBag} title="Your bag is empty" hint="Add something from a store near you and it can be at your door inside the hour." />
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {groups.map((g) => (
                <div key={g.storeId} className="rounded-lg border border-line bg-surface">
                  <p className="flex items-center gap-1.5 border-b border-line px-3 py-2 text-2xs font-bold text-muted">
                    <Store size={11} /> {g.storeName}
                    <span className="font-normal">· packs &amp; dispatches separately</span>
                  </p>
                  <div className="divide-y divide-line">
                    {g.lines.map((l) => (
                      <div key={l.key} className="flex gap-3 p-3">
                        <ProductImage src={l.image} colors={l.colors} category={l.category} id={l.productId} angle="Front" alt={l.name} className="h-24 w-20 shrink-0 rounded border border-line" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-extrabold">{l.brand}</p>
                          <p className="truncate text-xs text-muted">{l.name}</p>
                          <p className="mt-0.5 text-2xs text-muted">Size: <span className="font-bold text-ink">{l.size}</span> · {l.color}</p>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <div className="flex items-center rounded border border-line-strong">
                              <button onClick={() => setQty(l.key, l.qty - 1)} className="px-2 py-1 text-muted hover:text-ink" aria-label="Decrease quantity"><Minus size={12} /></button>
                              <span className="num w-6 text-center text-xs font-bold">{l.qty}</span>
                              <button onClick={() => setQty(l.key, l.qty + 1)} className="px-2 py-1 text-muted hover:text-ink" aria-label="Increase quantity"><Plus size={12} /></button>
                            </div>
                            <span className="num text-sm font-black">{inr(l.price * l.qty)}</span>
                            <button onClick={() => remove(l.key)} className="text-muted hover:text-danger" aria-label={`Remove ${l.name}`}><Trash2 size={14} /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* address */}
              <section className="rounded-lg border border-line bg-surface p-3">
                <p className="mb-2 text-2xs font-black uppercase tracking-wide">Deliver to</p>
                <div className="space-y-2">
                  {cityAddresses.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => onAddress(a.id)}
                      className={cx('flex w-full gap-3 rounded border p-2.5 text-left transition-colors', address?.id === a.id ? 'border-primary bg-primary-soft' : 'border-line hover:border-line-strong')}
                    >
                      <MapPin size={14} className="mt-0.5 shrink-0 text-primary" />
                      <span className="min-w-0">
                        <span className="flex items-center gap-2 text-sm font-bold">
                          {a.label}
                          <Badge tone="neutral">{HUBS.find((h) => h.id === a.hubId)?.name}</Badge>
                        </span>
                        <span className="mt-0.5 block text-xs text-muted">{a.line}</span>
                        <span className="block text-2xs text-muted">{a.landmark} · {a.pincode}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </section>

              {/* bill */}
              <section className="rounded-lg border border-line bg-surface p-3">
                <p className="mb-2 text-2xs font-black uppercase tracking-wide">Price details</p>
                <dl className="space-y-1.5 text-sm">
                  {billRows(bill).map((row) => (
                    <div key={row.key} className={cx('flex items-baseline justify-between gap-3', row.strong && 'border-t border-line pt-1.5')}>
                      <dt className={cx('text-muted', row.strong && 'font-bold text-ink')}>
                        {row.label}
                        {row.note && <span className="ml-1.5 text-2xs font-bold text-success">{row.note}</span>}
                      </dt>
                      <dd className={cx('num shrink-0 font-bold', row.tone === 'success' && 'text-success')}>
                        {row.strike != null && <span className="mr-1 text-2xs font-normal text-muted line-through">{inr(row.strike)}</span>}
                        {row.value === 0 && row.key === 'delivery' ? 'FREE' : `${row.value < 0 ? '− ' : ''}${inr(Math.abs(row.value))}`}
                      </dd>
                    </div>
                  ))}
                  <div className="flex items-baseline justify-between border-t border-line pt-2 text-base font-black">
                    <dt>Total amount</dt>
                    <dd className="num">{inr(bill.total)}</dd>
                  </div>
                </dl>
                {bill.savings > 0 && (
                  <p className="mt-2 flex items-center gap-1.5 rounded bg-success-soft px-2 py-1.5 text-2xs font-black text-success">
                    <Tag size={11} /> You are saving {inr(bill.savings)} on this order
                  </p>
                )}
                {!bill.freeDelivery && bill.amountToFreeDelivery > 0 && (
                  <p className="mt-2 text-2xs font-bold text-speed-ink">Add {inr(bill.amountToFreeDelivery)} more to get free delivery</p>
                )}
              </section>
            </div>

            <footer className="border-t border-line bg-surface p-4">
              <button onClick={() => onCheckout(address)} disabled={busy || !address} className="btn-primary w-full py-3.5 text-base">
                {busy ? 'Placing…' : <>Place order · {inr(bill.total)} <ArrowRight size={16} /></>}
              </button>
              <p className="mt-2 flex items-center justify-center gap-3 text-2xs font-semibold text-muted">
                <span className="flex items-center gap-1"><Zap size={10} className="text-speed-ink" /> {PLATFORM.deliveryPromise}</span>
                <span className="flex items-center gap-1"><ShieldCheck size={10} className="text-success" /> {PLATFORM.returnWindow} returns</span>
              </p>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
