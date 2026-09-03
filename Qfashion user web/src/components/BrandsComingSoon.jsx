/**
 * "Brands Landing Soon" rail.
 *
 * Upcoming tie-ups with a notify button. It fills the shelf-space problem every
 * young marketplace has, and the notify taps are the cheapest demand signal you
 * can collect before signing a partner contract.
 */

import { useState } from 'react';
import { BellRing, Check, ChevronRight, Sparkles } from 'lucide-react';
import { UPCOMING_BRANDS } from '@/data/seedData.js';
import { cx } from '@/lib/format.js';

export default function BrandsComingSoon({ cityName, onNotify }) {
  const [subscribed, setSubscribed] = useState({});

  const brands = [...UPCOMING_BRANDS].sort((a, b) => (a.city === cityName ? -1 : 0) - (b.city === cityName ? -1 : 0));

  return (
    <section className="rounded-lg border border-line bg-surface" aria-labelledby="brands-soon">
      <header className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
        <Sparkles size={16} className="text-primary" />
        <h2 id="brands-soon" className="text-sm font-black uppercase tracking-wide">
          Brands landing soon
        </h2>
        <span className="text-2xs font-semibold text-muted">Get notified for early drops</span>
        <span className="ml-auto hidden items-center gap-1 text-2xs font-bold text-muted sm:flex">
          Scroll <ChevronRight size={12} />
        </span>
      </header>

      <div className="flex gap-3 overflow-x-auto p-4">
        {brands.map((b) => {
          const on = !!subscribed[b.id];
          return (
            <article key={b.id} className="flex w-56 shrink-0 flex-col overflow-hidden rounded-lg border border-line bg-canvas">
              <div className="flex h-20 items-center justify-center px-3 text-center text-lg font-black text-white" style={{ background: b.accent }}>
                {b.name}
              </div>
              <div className="flex flex-1 flex-col gap-1.5 p-3">
                <p className="text-2xs font-bold uppercase tracking-wide text-muted">{b.kind}</p>
                <p className="text-xs leading-relaxed text-ink">{b.blurb}</p>
                <p className="mt-auto pt-2 text-2xs font-semibold text-muted">
                  {b.hub}, {b.city} · <span className="font-bold text-ink">{b.eta}</span>
                </p>
                <button
                  onClick={() => {
                    setSubscribed((s) => ({ ...s, [b.id]: true }));
                    onNotify?.(b);
                  }}
                  disabled={on}
                  className={cx('btn w-full gap-1.5 rounded py-2 text-2xs font-bold', on ? 'border border-success bg-success-soft text-success' : 'border border-primary text-primary hover:bg-primary hover:text-white')}
                >
                  {on ? <Check size={12} /> : <BellRing size={12} />}
                  {on ? 'You’re on the list' : 'Get notified'}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
