/**
 * Size Guide & Fit Chart.
 *
 * Size-related returns are the single biggest cost line in Indian online
 * fashion, so this does more than print a table: it switches between inches and
 * centimetres from one source of truth, gives the brand's own fit quirk, and
 * takes a height and weight to suggest a size outright.
 */

import { useMemo, useState } from 'react';
import { Ruler, X, Info, Sparkles } from 'lucide-react';
import { Modal } from './ui.jsx';
import { SIZE_CHARTS, BRAND_FIT_NOTES, toCm } from '@/data/seedData.js';
import { cx } from '@/lib/format.js';

const MATRIX = [
  { maxKg: 55, Men: 'S', Women: 'XS' },
  { maxKg: 63, Men: 'M', Women: 'S' },
  { maxKg: 72, Men: 'L', Women: 'M' },
  { maxKg: 82, Men: 'XL', Women: 'L' },
  { maxKg: 95, Men: 'XXL', Women: 'XL' },
  { maxKg: 999, Men: 'XXL', Women: 'XXL' },
];

export default function SizeGuideModal({ open, onClose, category = 'Topwear', brand, gender = 'Men', onPickSize }) {
  const [unit, setUnit] = useState('in');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');

  const chart = SIZE_CHARTS[category] || SIZE_CHARTS.Topwear;
  const brandNote = BRAND_FIT_NOTES[brand];

  const suggestion = useMemo(() => {
    const kg = parseInt(weight, 10);
    if (!kg || kg < 30 || kg > 200) return null;
    const g = gender === 'Women' ? 'Women' : 'Men';
    let size = MATRIX.find((r) => kg <= r.maxKg)[g];
    const cm = parseInt(height, 10);
    if (cm && cm >= 180) {
      const order = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
      size = order[Math.min(order.length - 1, order.indexOf(size) + 1)];
    }
    return size;
  }, [height, weight, gender]);

  const show = (row, col) => {
    const v = row[col.key];
    if (v == null) return '—';
    if (!col.convert) return v;
    return unit === 'in' ? `${v}"` : `${toCm(v)} cm`;
  };

  return (
    <Modal open={open} onClose={onClose} label="Size guide and fit chart">
      <header className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 className="flex items-center gap-2 text-lg font-extrabold">
          <Ruler size={17} className="text-primary" /> Size Guide &amp; Fit Chart
        </h2>
        <button onClick={onClose} className="text-muted hover:text-ink" aria-label="Close">
          <X size={18} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* find my size */}
        <section className="border-b border-line bg-canvas px-5 py-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-black uppercase tracking-wide">
            <Sparkles size={13} className="text-primary" /> Find my size
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex-1">
              <span className="mb-1 block text-2xs font-bold text-muted">Height (cm)</span>
              <input value={height} onChange={(e) => setHeight(e.target.value.replace(/\D/g, '').slice(0, 3))} inputMode="numeric" placeholder="175" className="field num py-2" />
            </label>
            <label className="flex-1">
              <span className="mb-1 block text-2xs font-bold text-muted">Weight (kg)</span>
              <input value={weight} onChange={(e) => setWeight(e.target.value.replace(/\D/g, '').slice(0, 3))} inputMode="numeric" placeholder="72" className="field num py-2" />
            </label>
            <div className="min-w-[9rem] flex-1">
              {suggestion ? (
                <div className="rounded border border-success bg-success-soft px-3 py-2">
                  <p className="text-2xs font-bold text-success">We recommend</p>
                  <p className="num text-lg font-black leading-tight text-success">{suggestion}</p>
                </div>
              ) : (
                <p className="text-2xs text-muted">Enter your weight and we will suggest a size.</p>
              )}
            </div>
            {suggestion && onPickSize && (
              <button onClick={() => { onPickSize(suggestion); onClose(); }} className="btn-primary py-2 text-xs">
                Select {suggestion}
              </button>
            )}
          </div>
        </section>

        {/* the chart */}
        <section className="px-5 py-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs font-black uppercase tracking-wide">{category} · {chart.unit}</p>
            {chart.columns.some((c) => c.convert) && (
              <div className="flex overflow-hidden rounded border border-line-strong text-2xs font-bold">
                {['in', 'cm'].map((u) => (
                  <button key={u} onClick={() => setUnit(u)} className={cx('px-3 py-1.5 transition-colors', unit === u ? 'bg-ink text-white' : 'bg-surface text-muted hover:text-ink')}>
                    {u === 'in' ? 'Inches' : 'Cm'}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="overflow-x-auto rounded border border-line">
            <table className="w-full min-w-[24rem] border-collapse text-sm">
              <thead>
                <tr className="bg-canvas">
                  {chart.columns.map((c) => (
                    <th key={c.key} className="border-b border-line px-3 py-2 text-left text-2xs font-black uppercase tracking-wide text-muted">
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chart.rows.map((row) => (
                  <tr key={row.size} className={cx('border-b border-line last:border-b-0', suggestion === row.size && 'bg-success-soft')}>
                    {chart.columns.map((c, i) => (
                      <td key={c.key} className={cx('num px-3 py-2', i === 0 ? 'font-black' : 'text-muted')}>
                        {show(row, c)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* fit advice */}
        <section className="border-t border-line bg-canvas px-5 py-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-black uppercase tracking-wide">
            <Info size={13} className="text-info" /> How this fits
          </p>
          <ul className="space-y-1.5 text-xs leading-relaxed text-ink">
            {brandNote && (
              <li className="font-bold">
                • {brand}: {brandNote}
              </li>
            )}
            {chart.fitAdvice.map((a) => (
              <li key={a}>• {a}</li>
            ))}
          </ul>
        </section>
      </div>
    </Modal>
  );
}
