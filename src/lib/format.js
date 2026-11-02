/** Display formatting. */

export const inr = (n) => '₹' + (Number(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
export const cx = (...p) => p.filter(Boolean).join(' ');

export function timeAgo(ts) {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h} hr ago` : `${Math.floor(h / 24)} d ago`;
}

export const clockTime = (ts) =>
  new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

export function mmss(ms) {
  if (ms <= 0) return '00:00';
  const t = Math.floor(ms / 1000);
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}

export function distanceLabel(km) {
  if (km == null) return '';
  if (km < 0.5) return 'in your area';
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  return `${km.toFixed(1)} km away`;
}

/**
 * Shelf state. Out-of-stock items are never hidden from the grid — they are
 * rendered dimmed with an overlay and stay fully clickable, because a catalogue
 * with no gaps looks fake and a shopper still wants to be told when it is back.
 */
export function shelfState(stock) {
  if (stock <= 0) return { key: 'out', label: 'Out of stock', tone: 'danger', available: false };
  if (stock === 1) return { key: 'last', label: 'Only 1 left', tone: 'speed', available: true };
  if (stock <= 4) return { key: 'low', label: `Only ${stock} left`, tone: 'speed', available: true };
  return { key: 'in', label: 'In stock', tone: 'success', available: true };
}

export const pluralise = (n, one, many) => `${n} ${n === 1 ? one : many || `${one}s`}`;
