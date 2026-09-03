/** The primary category rail across the top of the storefront. */

import { DEPARTMENTS } from '@/data/seedData.js';
import { cx } from '@/lib/format.js';

export default function CategoryChips({ value, onChange, counts = {} }) {
  return (
    <nav aria-label="Shop by category" className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-[1440px] gap-2 overflow-x-auto px-3 py-2.5 sm:px-5">
        <button onClick={() => onChange(null)} className={cx('chip', !value && 'chip-on')}>
          All
        </button>
        {DEPARTMENTS.map((d) => (
          <button key={d.id} onClick={() => onChange(value === d.id ? null : d.id)} className={cx('chip', value === d.id && 'chip-on')}>
            <span aria-hidden="true">{d.icon}</span>
            {d.label}
            {counts[d.id] != null && <span className="num text-2xs font-medium text-muted">{counts[d.id]}</span>}
          </button>
        ))}
      </div>
    </nav>
  );
}
