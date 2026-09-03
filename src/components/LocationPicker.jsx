/**
 * Location detector + manual neighbourhood selector.
 *
 * The hyperlocal promise hangs off this control, so it does three things rather
 * than one: asks the browser for a fix, reverse-geocodes it to the nearest
 * serviceable hub, then states the consequence in numbers — which store packs
 * your order, how far it is, how long it takes.
 */

import { useEffect, useRef, useState } from 'react';
import { MapPin, ChevronDown, Check, LocateFixed, Zap, TriangleAlert, Store as StoreIcon } from 'lucide-react';
import { CITIES, HUBS } from '@/data/seedData.js';
import { detectLocation, storesForHub, deliveryWindow } from '@/lib/geo.js';
import { cx, distanceLabel } from '@/lib/format.js';

export default function LocationPicker({ hubId, onHub }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);
  const ref = useRef(null);

  const hub = HUBS.find((h) => h.id === hubId);
  const city = CITIES.find((c) => c.id === hub?.cityId);
  const stores = storesForHub(hubId);
  const nearest = stores[0];
  const eta = nearest ? deliveryWindow({ prepMins: nearest.prepMins, km: nearest.km }) : null;

  useEffect(() => {
    const onDoc = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const onEsc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);

  async function detect() {
    setBusy(true);
    setStatus(null);
    const res = await detectLocation();
    setBusy(false);
    if (res.ok) {
      onHub(res.hub.id);
      setStatus({ ok: true, km: res.km, accuracy: res.accuracy, hub: res.hub.name });
      setTimeout(() => setOpen(false), 1000);
    } else {
      setStatus({ ok: false, message: res.message });
      setOpen(true);
    }
  }

  const shortStore = (name) => name.replace(/^(Zara|Trends|FabIndia|Max Fashion|Sole House|Vishal Mega Mart|Snitch|Westside|Levi's|Lifestyle)\s*/, '') || name;

  return (
    <div className="relative" ref={ref}>
      <div className="flex items-stretch gap-1.5">
        <button
          onClick={detect}
          disabled={busy}
          title="Use my current location"
          className="btn shrink-0 gap-1.5 rounded border border-primary bg-primary-soft px-2.5 py-2 text-xs font-bold text-primary hover:bg-primary hover:text-white"
        >
          <LocateFixed size={14} className={busy ? 'animate-spin-slow' : ''} strokeWidth={2.5} />
          <span className="hidden md:inline">{busy ? 'Locating…' : 'Detect my location'}</span>
          <span className="md:hidden">📍</span>
        </button>

        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-haspopup="listbox"
          className="flex min-w-0 items-center gap-2 rounded border border-line-strong bg-surface px-3 py-2 text-left hover:border-ink"
        >
          <MapPin size={14} className="shrink-0 text-primary" strokeWidth={2.4} />
          <span className="min-w-0">
            <span className="block text-2xs uppercase tracking-wide text-muted">Deliver to</span>
            <span className="block truncate text-sm font-extrabold leading-tight">
              {hub?.name} <span className="font-normal text-muted">· {city?.name}</span>
            </span>
          </span>
          <ChevronDown size={14} className={cx('shrink-0 text-muted transition-transform', open && 'rotate-180')} />
        </button>
      </div>

      {nearest && (
        <p className="mt-1 flex items-center gap-1 text-2xs font-bold text-success">
          <Zap size={11} strokeWidth={3} className="text-speed-ink" />
          Delivering in {eta.mid} mins from {shortStore(nearest.name)} Hub
          <span className="font-medium text-muted">({distanceLabel(nearest.km)})</span>
        </p>
      )}

      {open && (
        <div className="absolute left-0 z-50 mt-2 w-[min(23rem,calc(100vw-2rem))] animate-rise overflow-hidden rounded-lg border border-line bg-surface shadow-lift">
          {status && (
            <div className={cx('flex items-start gap-2 border-b border-line px-3 py-2.5 text-2xs font-semibold', status.ok ? 'text-success' : 'text-speed-ink')}>
              {status.ok ? <Check size={13} className="mt-px shrink-0" /> : <TriangleAlert size={13} className="mt-px shrink-0" />}
              <span>
                {status.ok
                  ? `Located you ${distanceLabel(status.km)} from ${status.hub}${status.accuracy ? ` · accurate to ±${status.accuracy} m` : ''}.`
                  : status.message}
              </span>
            </div>
          )}

          <div className="flex gap-1 border-b border-line p-2">
            {CITIES.map((c) => {
              const on = c.id === hub?.cityId;
              return (
                <button
                  key={c.id}
                  onClick={() => onHub(HUBS.find((h) => h.cityId === c.id).id)}
                  className={cx('flex-1 rounded px-3 py-2 text-sm font-extrabold transition-colors', on ? 'bg-ink text-white' : 'text-muted hover:bg-soft')}
                >
                  {c.name}
                  <span className="mt-0.5 block text-2xs font-semibold opacity-70">{c.primary ? 'Launch city' : 'Now live'}</span>
                </button>
              );
            })}
          </div>

          <ul className="max-h-72 overflow-y-auto p-1.5" role="listbox" aria-label="Neighbourhoods">
            {HUBS.filter((h) => h.cityId === hub?.cityId).map((h) => {
              const reach = storesForHub(h.id);
              const selected = h.id === hubId;
              const w = reach[0] ? deliveryWindow({ prepMins: reach[0].prepMins, km: reach[0].km }) : null;
              return (
                <li key={h.id}>
                  <button
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      onHub(h.id);
                      setOpen(false);
                    }}
                    className={cx('flex w-full items-center gap-3 rounded px-2.5 py-2 text-left transition-colors', selected ? 'bg-primary-soft' : 'hover:bg-soft')}
                  >
                    <span className="flex-1">
                      <span className="flex items-center gap-2 text-sm font-bold">
                        {h.name}
                        {h.busy && <span className="rounded bg-speed-soft px-1.5 py-px text-2xs font-bold text-speed-ink">busy</span>}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1 text-2xs text-muted">
                        <StoreIcon size={10} /> {reach.length} store{reach.length === 1 ? '' : 's'} in range
                        {w && <> · ~{w.mid} min</>} · {h.pincode}
                      </span>
                    </span>
                    {selected && <Check size={15} className="text-primary" />}
                  </button>
                </li>
              );
            })}
          </ul>

          <p className="border-t border-line bg-canvas px-3 py-2 text-2xs leading-relaxed text-muted">
            We only show stock sitting inside a partner store's delivery radius of your neighbourhood — never a warehouse three days away.
          </p>
        </div>
      )}
    </div>
  );
}
