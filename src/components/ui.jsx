/** Shared presentational primitives. */

import { useEffect } from 'react';
import { useMemo, useState } from 'react';
import { Star, X, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { COLOR_SWATCHES, FALLBACK_IMAGE } from '@/data/seedData.js';
import { cx } from '@/lib/format.js';
import { useScrollLock } from '@/hooks/useSync.js';

/* ------------------------------------------------------------- imagery */

const SHAPES = {
  Topwear: 'M32 20 L44 13 Q50 20 56 13 L68 20 L80 28 L72 43 L64 38 V87 H36 V38 L28 43 L20 28 Z',
  Bottomwear: 'M35 12 H65 L69 88 H56 L50 45 L44 88 H31 Z',
  'Dresses & Sets': 'M36 16 L44 11 Q50 17 56 11 L64 16 L70 34 L62 32 L66 86 H34 L38 32 L30 34 Z',
  Ethnic: 'M33 18 L44 11 Q50 17 56 11 L67 18 L75 32 L66 36 V90 H34 V36 L25 32 Z',
  Footwear: 'M16 64 Q28 59 37 62 L54 49 Q63 46 67 55 L82 65 Q88 70 85 77 H21 Q12 72 16 64 Z',
  Accessories: 'M29 41 H71 L75 85 H25 Z M41 41 V33 Q50 22 59 33 V41',
};

/** The platform-wide image error handler, applied to every <img> in the app. */
export const onImageError = (e) => {
  e.target.onerror = null;
  e.target.src = FALLBACK_IMAGE;
};

/** Lighten (amt > 0) or darken (amt < 0) a hex colour. Used for the drawn tile. */
function shade(hex, amt) {
  const h = String(hex).replace('#', '');
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) || 0);
  const mix = (c) => clamp(amt > 0 ? c + (255 - c) * amt : c * (1 + amt));
  return `#${[mix(r), mix(g), mix(b)].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * The drawn tile — what a product shows when its photograph will not load
 * (offline, a dead URL, or a host that blocks external images). It is built
 * from the SKU's own colourway and category, and it changes with the angle, so
 * a four-shot gallery still reads as four different views of the same garment
 * rather than the same grey square four times.
 */
function drawTile({ colors = [], category = 'Topwear', id = '', angle }) {
  const a = COLOR_SWATCHES[colors[0]] || '#b9c0c7';
  const dark = shade(a, -0.3);
  const light = shade(a, 0.28);
  const path = SHAPES[category] || SHAPES.Topwear;
  const seed = id.charCodeAt(id.length - 1) || 40;
  const wearable = ['Topwear', 'Ethnic', 'Dresses & Sets'].includes(category);

  const defs = `<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#eef0f3"/></linearGradient>
<linearGradient id="cloth" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${light}"/><stop offset="55%" stop-color="${a}"/><stop offset="100%" stop-color="${dark}"/></linearGradient>
<pattern id="weave" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(${35 + (seed % 20)})"><rect width="5" height="5" fill="${a}"/><rect width="5" height="2.4" fill="${dark}" fill-opacity="0.55"/><rect width="1.1" height="5" fill="${light}" fill-opacity="0.35"/></pattern>
<radialGradient id="vig"><stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="0.22"/></radialGradient>`;

  const shadow = '<ellipse cx="50" cy="91" rx="25" ry="3.2" fill="#282c3f" fill-opacity="0.13"/>';
  const garment = (fill) => `<path d="${path}" fill="${fill}"/><path d="${path}" fill="none" stroke="${dark}" stroke-opacity="0.55" stroke-width="0.7"/>`;
  const collar = wearable ? `<path d="M44 13 Q50 20 56 13" fill="none" stroke="${dark}" stroke-opacity="0.5" stroke-width="0.8"/>` : '';
  // Tiles are square but their frames are portrait, and `slice` crops the sides.
  // Insetting the subject keeps the whole garment inside the visible window.
  const inset = (inner, k = 0.78) => `<g transform="translate(50,52) scale(${k}) translate(-50,-50)">${inner}</g>`;

  let body;
  if (angle === 'Fabric') {
    // A close-up: the weave fills the frame, cropped and vignetted like a macro shot.
    body = `<rect width="100" height="100" fill="url(#weave)"/><rect width="100" height="100" fill="url(#vig)"/>
<path d="M0 62 Q26 52 50 62 T100 60 V100 H0 Z" fill="${dark}" fill-opacity="0.16"/>
<path d="M0 62 Q26 52 50 62 T100 60" fill="none" stroke="${light}" stroke-opacity="0.5" stroke-width="0.6"/>`;
  } else if (angle === 'Model' && wearable) {
    // Worn: head and legs behind, the garment scaled onto the figure.
    body = inset(`${shadow}<circle cx="50" cy="12" r="6.6" fill="#dfe1e5"/><rect x="47" y="17" width="6" height="6" fill="#dfe1e5"/>
<rect x="42" y="58" width="6.4" height="36" rx="3" fill="#d8dade"/><rect x="51.6" y="58" width="6.4" height="36" rx="3" fill="#d0d3d8"/>
<g transform="translate(14,18) scale(0.72)">${garment('url(#cloth)')}</g>`, 0.94);
  } else if (angle === 'Model') {
    // Shoes and accessories get the styled shot instead: backdrop and plinth.
    body = `<path d="M0 66 Q50 58 100 66 V100 H0 Z" fill="#e7e9ec"/>
<rect x="22" y="72" width="56" height="4" rx="2" fill="#dcdee2"/>
${inset(`${shadow}${garment('url(#cloth)')}`, 0.72)}`;
  } else if (angle === 'Back') {
    // Mirrored, with the centre seam and yoke a back view actually shows.
    const seam = wearable
      ? `<path d="M50 24 V84" stroke="${dark}" stroke-opacity="0.4" stroke-width="0.6" stroke-dasharray="2 1.6"/><path d="M38 28 Q50 33 62 28" fill="none" stroke="${dark}" stroke-opacity="0.4" stroke-width="0.7"/>`
      : `<path d="M30 66 Q50 60 72 66" fill="none" stroke="${dark}" stroke-opacity="0.4" stroke-width="0.7" stroke-dasharray="2 1.6"/>`;
    body = inset(`${shadow}<g transform="translate(100,0) scale(-1,1)">${garment('url(#cloth)')}</g>${seam}`);
  } else {
    body = inset(`${shadow}${garment('url(#cloth)')}${collar}`);
  }

  // No caption is drawn into the tile: the gallery already labels each angle in
  // the UI, and a caption baked into the SVG magnifies with the frame.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice"><defs>${defs}</defs><rect width="100" height="100" fill="url(#bg)"/>${body}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * Product image with a two-stage fallback: the catalogue URL, then the
 * platform fallback shot via `onError`, then a tile drawn from the SKU's own
 * colourway. The drawn tile carries the angle label, so a gallery still reads
 * as Front / Back / Fabric / Model even with every network image blocked.
 */
export function ProductImage({ src, colors, category, id = '', angle, alt = '', className = '', imgClassName = '', eager = false }) {
  const [stage, setStage] = useState(0);
  const tile = useMemo(() => drawTile({ colors, category, id, angle }), [colors, category, id, angle]);

  const handleError = (e) => {
    if (stage === 0) {
      setStage(1);
      onImageError(e);
    } else {
      setStage(2);
    }
  };

  return (
    <div className={cx('relative overflow-hidden bg-soft', className)} style={{ backgroundImage: `url("${tile}")`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      {src && stage < 2 && (
        <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" onError={handleError} className={cx('h-full w-full object-cover', imgClassName)} />
      )}
      {(!src || stage === 2) && <span className="sr-only">{alt}</span>}
    </div>
  );
}

/* ---------------------------------------------------------- primitives */

const TONES = {
  neutral: 'bg-soft text-muted border-line',
  success: 'bg-success-soft text-success border-transparent',
  speed: 'bg-speed-soft text-speed-ink border-transparent',
  danger: 'bg-danger-soft text-danger border-transparent',
  info: 'bg-info-soft text-info border-transparent',
  primary: 'bg-primary-soft text-primary border-transparent',
  solid: 'bg-ink text-white border-transparent',
};

export function Badge({ children, tone = 'neutral', icon: Icon, className = '' }) {
  return (
    <span className={cx('inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-2xs font-bold', TONES[tone], className)}>
      {Icon && <Icon size={11} strokeWidth={2.6} />}
      {children}
    </span>
  );
}

/** The rating pill Indian marketplaces use — number, star, then review count. */
export function RatingPill({ value = 0, reviews, size = 'sm' }) {
  return (
    <span className={cx('inline-flex items-center gap-1 rounded border border-line bg-surface px-1.5 py-0.5', size === 'lg' && 'px-2 py-1')}>
      <span className={cx('num font-bold', size === 'lg' ? 'text-sm' : 'text-2xs')}>{Number(value).toFixed(1)}</span>
      <Star size={size === 'lg' ? 12 : 10} className="fill-success text-success" strokeWidth={0} />
      {reviews != null && (
        <>
          <span className="h-3 w-px bg-line" />
          <span className="num text-2xs text-muted">{reviews > 999 ? `${(reviews / 1000).toFixed(1)}k` : reviews}</span>
        </>
      )}
    </span>
  );
}

export function Spinner({ size = 16, className = '' }) {
  return <span className={cx('inline-block animate-spin-slow rounded-full border-2 border-line border-t-primary', className)} style={{ width: size, height: size }} role="status" aria-label="Loading" />;
}

export function Modal({ open, onClose, children, label, wide = false }) {
  useScrollLock(open);
  useEffect(() => {
    if (!open) return undefined;
    const onEsc = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={label}>
      <button className="absolute inset-0 animate-fade bg-ink/50" onClick={onClose} aria-label="Close" tabIndex={-1} />
      <div className={cx('relative flex max-h-[94vh] w-full animate-rise flex-col overflow-hidden rounded-t-xl bg-surface shadow-pop sm:rounded-xl', wide ? 'sm:max-w-5xl' : 'sm:max-w-lg')}>
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({ title, sub, onClose, right }) {
  return (
    <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-3.5">
      <div className="min-w-0">
        {sub && <p className="eyebrow">{sub}</p>}
        <h2 className="truncate text-lg font-extrabold leading-tight">{title}</h2>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {right}
        {onClose && (
          <button onClick={onClose} className="rounded p-1 text-muted hover:text-ink" aria-label="Close">
            <X size={18} />
          </button>
        )}
      </div>
    </header>
  );
}

export function EmptyState({ icon: Icon, title, hint, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-line-strong bg-surface px-6 py-14 text-center">
      {Icon && <Icon size={24} className="text-faint" />}
      <div>
        <p className="text-base font-bold">{title}</p>
        {hint && <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

export function Toaster({ toasts, onDismiss }) {
  const icons = { success: CheckCircle2, error: AlertTriangle, warn: AlertTriangle, info: Info };
  const tone = { success: 'text-success', error: 'text-danger', warn: 'text-speed-ink', info: 'text-info' };
  return (
    <div className="pointer-events-none fixed bottom-5 left-1/2 z-[95] flex w-[min(26rem,calc(100vw-2rem))] -translate-x-1/2 flex-col gap-2">
      {toasts.map((t) => {
        const Icon = icons[t.tone] || Info;
        return (
          <div key={t.id} role="status" className="pointer-events-auto flex animate-rise items-start gap-2.5 rounded-lg border border-line bg-surface px-3.5 py-3 shadow-lift">
            <Icon size={16} className={cx('mt-0.5 shrink-0', tone[t.tone])} />
            <p className="flex-1 text-sm font-semibold">{t.message}</p>
            <button onClick={() => onDismiss(t.id)} className="text-faint hover:text-ink" aria-label="Dismiss">
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return (
    <div className={cx('relative overflow-hidden rounded bg-soft', className)}>
      <div className="absolute inset-y-0 -left-1/3 w-1/3 animate-shimmer bg-gradient-to-r from-transparent via-white to-transparent" />
    </div>
  );
}

export { cx };
