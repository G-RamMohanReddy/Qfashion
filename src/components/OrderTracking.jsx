/**
 * Live order tracker.
 *
 * Reads the same order record shared state holds, so a tap on
 * "Accept" in the store dashboard moves this bar within one broadcast tick.
 */

import { Package, CheckCircle2, ShoppingBag, Bike, Home, Phone, ShieldCheck, Receipt, Store } from 'lucide-react';
import { ProductImage, Badge } from './ui.jsx';
import { TRACKER_STEPS, trackerStep, STATUS } from '@/lib/orders.js';
import { useTick } from '@/hooks/useSync.js';
import { inr, cx, clockTime } from '@/lib/format.js';

const ICONS = [Package, CheckCircle2, ShoppingBag, Bike, Home];

export default function OrderTracking({ order, onSimulate }) {
  useTick(1000);
  if (!order) return null;

  const step = trackerStep(order);
  const done = order.status === 'delivered';
  const cancelled = order.status === 'cancelled';
  const minsLeft = Math.max(0, Math.round((order.promisedAt - Date.now()) / 60000));

  return (
    <section className={cx('overflow-hidden rounded-lg border bg-surface', done ? 'border-success' : cancelled ? 'border-danger' : 'border-line')}>
      <header className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-2xs font-black uppercase tracking-wide text-muted">
            Live order
            {!done && !cancelled && (
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping2 rounded-full bg-success" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
              </span>
            )}
          </p>
          <h2 className="text-base font-extrabold leading-tight">
            <span className="num font-mono text-sm">{order.id}</span> <span className="font-medium text-muted">from {order.storeName}</span>
          </h2>
        </div>
        {done ? (
          <Badge tone="success">Delivered in {order.actualMins} min</Badge>
        ) : cancelled ? (
          <Badge tone="danger">Cancelled</Badge>
        ) : (
          <div className="text-right">
            <p className="num text-xl font-black leading-none">{minsLeft > 0 ? `${minsLeft} min` : 'Any moment'}</p>
            <p className="num text-2xs text-muted">by {clockTime(order.promisedAt)}</p>
          </div>
        )}
      </header>

      {!cancelled && (
        <div className="px-4 py-5">
          <ol className="relative flex justify-between gap-1">
            <span className="absolute left-[1.1rem] right-[1.1rem] top-4 h-0.5 bg-line" aria-hidden="true" />
            <span className="absolute left-[1.1rem] top-4 h-0.5 bg-success transition-all duration-700" style={{ width: `calc((100% - 2.2rem) * ${step / (TRACKER_STEPS.length - 1)})` }} aria-hidden="true" />
            {TRACKER_STEPS.map((s, i) => {
              const Icon = ICONS[i];
              const reached = i <= step;
              const current = i === step;
              return (
                <li key={s.key} className="relative flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center">
                  <span className={cx('z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors', reached ? 'border-success bg-success text-white' : 'border-line bg-surface text-muted', current && !done && 'ring-4 ring-success/15')}>
                    <Icon size={14} strokeWidth={2.5} />
                  </span>
                  <span className={cx('text-2xs font-bold leading-tight', reached ? 'text-ink' : 'text-muted')}>{s.label}</span>
                  {current && <span className="hidden text-2xs text-muted sm:block">{s.hint}</span>}
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {order.partner && !done && (
        <div className="flex items-center gap-3 border-t border-line bg-canvas px-4 py-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-success-soft text-success"><Bike size={16} /></span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{order.partner.name}</p>
            <p className="truncate text-2xs text-muted">{order.partner.vehicle}</p>
          </div>
          <a href={`tel:${order.partner.phone}`} className="btn-ghost px-2.5 py-1.5 text-xs"><Phone size={12} /> Call</a>
        </div>
      )}

      {!done && !cancelled && (
        <div className="flex flex-wrap items-center gap-2 border-t border-line px-4 py-2.5">
          <ShieldCheck size={13} className="text-success" />
          <p className="text-xs text-muted">
            Handover OTP <span className="num font-mono text-sm font-black text-ink">{order.otp}</span> — only share it at the door.
          </p>
          {onSimulate && (
            <button onClick={() => onSimulate(order.id)} className="btn-quiet ml-auto gap-1 text-2xs font-bold text-primary" title="Advance this order the way the store would">
              <Store size={11} /> Simulate store action
            </button>
          )}
        </div>
      )}

      <div className="border-t border-line px-4 py-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {order.items.map((i, idx) => (
            <div key={idx} className="flex shrink-0 items-center gap-2 rounded border border-line py-1 pl-1 pr-2.5">
              <ProductImage src={i.image} colors={i.colors} category={i.category} id={i.productId} angle="Front" alt={i.name} className="h-9 w-8 rounded-xs" />
              <div>
                <p className="max-w-[10rem] truncate text-2xs font-bold">{i.name}</p>
                <p className="num text-2xs text-muted">{i.size} · ×{i.qty}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-line pt-2 text-2xs text-muted">
          <span className="flex items-center gap-1.5">
            <Receipt size={11} /> {order.payment.mode}
            {order.payment.txnId && <span className="num font-mono">· {order.payment.txnId}</span>}
          </span>
          <span className="num font-black text-ink">{inr(order.bill.total)}</span>
        </div>
      </div>
    </section>
  );
}
