/** Standard marketplace header: logo, location, search, wishlist, cart, profile. */

import { Search, ShoppingBag, Heart, User, X } from 'lucide-react';
import LocationPicker from './LocationPicker.jsx';

export default function Header({ hubId, onHub, search, onSearch, cartCount, wishCount, onCart, onWishlist }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface shadow-card">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2.5 sm:px-5">
        <a href="/" className="flex shrink-0 items-center gap-2" aria-label="Q Fashion home">
          <span className="flex h-9 w-9 items-center justify-center rounded bg-primary text-xl font-black leading-none text-white">Q</span>
          <span className="hidden text-lg font-black uppercase tracking-tight sm:inline">Fashion</span>
        </a>

        <div className="order-3 w-full lg:order-none lg:w-auto">
          <LocationPicker hubId={hubId} onHub={onHub} />
        </div>

        <div className="relative min-w-0 flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search for tees, kurtis, sneakers, brands…"
            aria-label="Search the catalogue"
            className="w-full rounded border border-line bg-canvas py-2.5 pl-9 pr-9 text-sm font-medium placeholder:text-muted focus:border-primary focus:bg-surface focus:outline-none"
          />
          {search && (
            <button onClick={() => onSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink" aria-label="Clear search">
              <X size={15} />
            </button>
          )}
        </div>

        <nav className="flex shrink-0 items-center gap-1 sm:gap-3">
          <button onClick={onWishlist} className="relative flex flex-col items-center px-2 text-muted transition-colors hover:text-ink" aria-label="Open your wishlist">
            <Heart size={19} strokeWidth={1.9} />
            <span className="mt-0.5 hidden text-2xs font-bold sm:block">Wishlist</span>
            {wishCount > 0 && (
              <span className="num absolute -right-0.5 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-black text-white">{wishCount}</span>
            )}
          </button>

          <button onClick={onCart} className="relative flex flex-col items-center px-2 text-muted transition-colors hover:text-ink" aria-label="Open your bag">
            <ShoppingBag size={19} strokeWidth={1.9} />
            <span className="mt-0.5 hidden text-2xs font-bold sm:block">Bag</span>
            {cartCount > 0 && (
              <span className="num absolute -right-0.5 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-black text-white">{cartCount}</span>
            )}
          </button>

          <span className="hidden flex-col items-center px-2 text-muted sm:flex" title="Signed in as Pragathi">
            <User size={19} strokeWidth={1.9} />
            <span className="mt-0.5 text-2xs font-bold">Profile</span>
          </span>
        </nav>
      </div>
    </header>
  );
}
