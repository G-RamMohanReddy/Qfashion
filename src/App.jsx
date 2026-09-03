/**
 * Q Fashion — consumer storefront.
 *
 * Flow: pick a neighbourhood → the catalogue re-scopes to stores that can reach
 * it → add to bag → the bill is computed by the shared pricing module → payment
 * sheet → the order is written to shared state, which persists locally and
 * mirrors to Firestore when Firebase is configured (see src/lib/sync.js).
 */

import { useCallback, useMemo, useState } from 'react';
import { SlidersHorizontal, PackageSearch, X, Zap, Store, ShieldCheck, Sparkles } from 'lucide-react';
import Header from './components/Header.jsx';
import CategoryChips from './components/CategoryChips.jsx';
import FilterSidebar from './components/FilterSidebar.jsx';
import ProductCard from './components/ProductCard.jsx';
import ProductDetails from './components/ProductDetails.jsx';
import BrandsComingSoon from './components/BrandsComingSoon.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import WishlistDrawer from './components/WishlistDrawer.jsx';
import PaymentModal from './components/PaymentModal.jsx';
import OrderTracking from './components/OrderTracking.jsx';
import QStylist from './components/QStylist.jsx';
import { Toaster, EmptyState, Badge } from './components/ui.jsx';
import SyncBadge from './components/SyncBadge.jsx';

import { searchCatalog, similarProducts, getProduct, countActiveFilters, DEFAULT_FILTERS, SORT_OPTIONS } from '@/lib/catalog.js';
import { placeOrder, addFeedback, requestNotify, advanceOrder } from '@/lib/platform.js';
import { HUBS, CITIES, PLATFORM } from '@/data/seedData.js';
import { storesForHub } from '@/lib/geo.js';
import { inr, cx } from '@/lib/format.js';
import { useSyncState, useLocalState, useToasts } from '@/hooks/useSync.js';
import { useCart, useWishlist } from '@/hooks/useCart.js';

export default function App() {
  const shared = useSyncState();
  const { toasts, toast, dismiss } = useToasts();
  const cart = useCart();
  const wishlist = useWishlist();

  const [hubId, setHubId] = useLocalState('qfashion.hub', 'gs-road');
  const [addressId, setAddressId] = useLocalState('qfashion.address', null);
  const [lastGroup, setLastGroup] = useLocalState('qfashion.lastGroup', null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sort, setSort] = useState('relevance');
  const [search, setSearch] = useState('');

  const [product, setProduct] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [wishOpen, setWishOpen] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [gateway, setGateway] = useState(null);
  const [stylistOpen, setStylistOpen] = useState(false);
  const [stylistPrompt, setStylistPrompt] = useState(null);

  const patch = useCallback((p) => setFilters((f) => ({ ...f, ...p })), []);
  const reset = useCallback(() => setFilters(DEFAULT_FILTERS), []);
  const activeCount = useMemo(() => countActiveFilters(filters), [filters]);

  const result = useMemo(
    () => searchCatalog({ ...filters, q: search, sort, hubId, stockOverrides: shared.stockOverrides }),
    [filters, search, sort, hubId, shared.stockOverrides]
  );

  /** Counts for the top chip row, computed without the department filter. */
  const deptCounts = useMemo(() => {
    const all = searchCatalog({ ...filters, dept: null, q: search, sort, hubId, stockOverrides: shared.stockOverrides }).items;
    const out = {};
    all.forEach((p) => {
      out[p.dept] = (out[p.dept] || 0) + 1;
      if (p.occasions.includes('Streetwear')) out.streetwear = (out.streetwear || 0) + 1;
      if (p.category === 'Ethnic') out.ethnic = (out.ethnic || 0) + 1;
    });
    return out;
  }, [filters, search, sort, hubId, shared.stockOverrides]);

  const hub = HUBS.find((h) => h.id === hubId);
  const city = CITIES.find((c) => c.id === hub?.cityId);
  const stores = storesForHub(hubId);

  const tracked = useMemo(() => {
    const group = lastGroup ? shared.orders.filter((o) => o.groupId === lastGroup) : [];
    return group.find((o) => !['delivered', 'cancelled'].includes(o.status)) || group[0] || null;
  }, [shared.orders, lastGroup]);

  const wishlistItems = useMemo(
    () => wishlist.ids.map((id) => getProduct(id, hubId, shared.stockOverrides)).filter(Boolean),
    [wishlist.ids, hubId, shared.stockOverrides]
  );

  /* ------------------------------------------------------------- actions */

  const addToBag = useCallback(
    (p, size) => {
      const chosen = size || (p.sizes.length === 1 ? p.sizes[0] : null);
      if (!chosen) {
        setProduct(p);
        toast('Pick a size to add this to your bag', 'warn');
        return;
      }
      cart.add(p, chosen, p.colors[0]);
      toast(`${p.brand} · size ${chosen} added to bag`, 'success');
      setProduct(null);
    },
    [cart, toast]
  );

  const notifyMe = useCallback(
    (p) => {
      requestNotify(p);
      toast(`We will alert you when ${p.name} is back at ${p.store?.name || 'the store'}`, 'info');
    },
    [toast]
  );

  const toggleWish = useCallback(
    (p) => {
      const added = wishlist.toggle(p.id);
      toast(added ? `${p.brand} saved to your wishlist` : 'Removed from wishlist', added ? 'success' : 'info', 2400);
    },
    [wishlist, toast]
  );

  const startCheckout = (address) => {
    if (!cart.lines.length || !address) return;
    setAddressId(address.id);
    setGateway({ address, ref: `QF-${Date.now().toString().slice(-6)}` });
  };

  const onPaid = (payment) => {
    const res = placeOrder({
      lines: cart.lines,
      address: gateway.address,
      hubId,
      cityId: hub.cityId,
      payment,
      customer: { name: 'Pragathi R', phone: gateway.address.phone },
    });
    setGateway(null);
    if (res.error) {
      toast(res.problems?.[0] || res.error, 'error', 6000);
      return;
    }
    setLastGroup(res.groupId);
    cart.clear();
    setCartOpen(false);
    toast(
      res.orders.length > 1
        ? `${res.orders.length} orders placed — one per store, each on its own delivery clock.`
        : `Order ${res.orders[0].id} sent to ${res.orders[0].storeName}`,
      'success',
      6000
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ---------------------------------------------------------------- view */

  return (
    <div className="min-h-screen bg-canvas">
      <Header
        hubId={hubId}
        onHub={setHubId}
        search={search}
        onSearch={setSearch}
        cartCount={cart.count}
        wishCount={wishlist.count}
        onCart={() => setCartOpen(true)}
        onWishlist={() => setWishOpen(true)}
      />
      <CategoryChips value={filters.dept} onChange={(d) => patch({ dept: d })} counts={deptCounts} />

      <main className="mx-auto max-w-[1440px] px-3 pb-16 pt-4 sm:px-5">
        {/* live order or the value proposition */}
        {tracked ? (
          <div className="mb-4">
            <OrderTracking order={tracked} onSimulate={(id) => { const r = advanceOrder(id); if (r.error) toast(r.error, 'warn'); }} />
          </div>
        ) : (
          <section className="mb-4 overflow-hidden rounded-lg border border-line bg-surface">
            <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
              <div className="min-w-0 flex-1">
                <p className="text-2xs font-black uppercase tracking-wide text-muted">
                  {hub?.name}, {city?.name} · {stores.length} partner stores in range
                </p>
                <h1 className="mt-1 text-xl font-black leading-tight sm:text-2xl">
                  Fashion from the shops around you, delivered in {PLATFORM.deliveryPromise}.
                </h1>
                <p className="mt-1.5 max-w-2xl text-sm text-muted">
                  Every piece below is stock a partner store within {stores[0]?.radiusKm || 10} km of {hub?.name} has on the shelf right now.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge tone="speed" icon={Zap}>⚡ 45 Mins Delivery</Badge>
                  <Badge tone="neutral" icon={Store}>{result.poolSize} styles live near you</Badge>
                  <Badge tone="success" icon={ShieldCheck}>{PLATFORM.returnWindow} easy returns</Badge>
                </div>
              </div>
              <button onClick={() => setStylistPrompt('Suggest an outfit under ₹1500 for a college fest in Guwahati')} className="btn-primary shrink-0 px-4 py-3">
                <Sparkles size={15} /> Style me
              </button>
            </div>
          </section>
        )}

        <div className="flex gap-5">
          {/* left rail */}
          <div className="hidden w-64 shrink-0 lg:block">
            <div className="sticky top-[8.5rem] max-h-[calc(100vh-10rem)] overflow-y-auto rounded-lg border border-line bg-surface px-3 pb-3">
              <FilterSidebar filters={filters} patch={patch} reset={reset} facets={result.facets} activeCount={activeCount} />
            </div>
          </div>

          <section className="min-w-0 flex-1">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="min-w-0 sm:flex-1">
                <h2 className="text-base font-black">
                  {result.total} {result.total === 1 ? 'item' : 'items'} near {hub?.name}
                </h2>
                <p className="mt-0.5 text-2xs text-muted">
                  {stores.length} partner stores in range
                  {result.facets.outOfStock > 0 && <> · {result.facets.outOfStock} currently out of stock, shown greyed</>}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setDrawer(true)} className="btn-ghost lg:hidden">
                  <SlidersHorizontal size={14} /> Filters
                  {activeCount > 0 && <span className="num rounded-full bg-primary px-1.5 py-px text-2xs font-black text-white">{activeCount}</span>}
                </button>
                <label className="flex min-w-0 flex-1 items-center gap-2 sm:flex-none">
                  <span className="hidden text-2xs font-black uppercase tracking-wide text-muted sm:inline">Sort by</span>
                  <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort results" className="field w-full py-2 pr-8 text-xs font-bold sm:w-auto">
                    {SORT_OPTIONS.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            {result.total === 0 ? (
              <EmptyState
                icon={PackageSearch}
                title="No matches in this neighbourhood"
                hint="Every filter is scoped to stores that can physically reach here. Widen the price range, or switch neighbourhoods from the top bar."
                action={<button onClick={reset} className="btn-outline">Clear all filters</button>}
              />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {result.items.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onOpen={setProduct}
                    onAdd={addToBag}
                    onNotify={notifyMe}
                    onWishlist={toggleWish}
                    wished={wishlist.has(p.id)}
                  />
                ))}
              </div>
            )}

            <div className="mt-6">
              <BrandsComingSoon cityName={city?.name} onNotify={(b) => toast(`We will tell you the day ${b.name} goes live in ${b.hub}`, 'success')} />
            </div>

            <SyncBadge />
          </section>
        </div>
      </main>

      {/* mobile filters */}
      {drawer && (
        <div className="fixed inset-0 z-[75] flex lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <button className="absolute inset-0 bg-ink/50" onClick={() => setDrawer(false)} aria-label="Close filters" tabIndex={-1} />
          <div className="relative flex h-full w-[min(20rem,88vw)] animate-rise flex-col bg-surface">
            <header className="flex items-center justify-between border-b border-line px-4 py-3">
              <h2 className="text-base font-black">Filters</h2>
              <button onClick={() => setDrawer(false)} className="text-muted hover:text-ink" aria-label="Close"><X size={18} /></button>
            </header>
            <div className="flex-1 overflow-y-auto px-4">
              <FilterSidebar filters={filters} patch={patch} reset={reset} facets={result.facets} activeCount={activeCount} />
            </div>
            <footer className="border-t border-line p-3">
              <button onClick={() => setDrawer(false)} className="btn-primary w-full py-3">Show {result.total} items</button>
            </footer>
          </div>
        </div>
      )}

      {product && (
        <ProductDetails
          product={product}
          similar={similarProducts(product, hubId, shared.stockOverrides, 8)}
          onClose={() => setProduct(null)}
          onAdd={addToBag}
          onNotify={notifyMe}
          onWishlist={toggleWish}
          wished={wishlist.has(product.id)}
          onAskStylist={(q) => setStylistPrompt(q)}
          onOpen={setProduct}
        />
      )}

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        hubId={hubId}
        addressId={addressId}
        onAddress={setAddressId}
        onCheckout={startCheckout}
      />

      <WishlistDrawer
        open={wishOpen}
        onClose={() => setWishOpen(false)}
        items={wishlistItems}
        onOpen={(p) => {
          setWishOpen(false);
          setProduct(p);
        }}
        onNotify={notifyMe}
        onRemove={wishlist.remove}
      />

      <PaymentModal
        open={!!gateway}
        amount={cart.bill.total}
        orderRef={gateway?.ref}
        customer={{ name: 'Pragathi R', phone: gateway?.address?.phone }}
        onClose={() => setGateway(null)}
        onSuccess={onPaid}
      />

      <QStylist
        open={stylistOpen}
        setOpen={setStylistOpen}
        hubId={hubId}
        stockOverrides={shared.stockOverrides}
        orders={shared.orders}
        addFeedback={addFeedback}
        onAdd={addToBag}
        onView={setProduct}
        prompt={stylistPrompt}
        onConsumePrompt={() => setStylistPrompt(null)}
      />

      <Toaster toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
