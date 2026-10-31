import { useMemo, useState } from 'react';
import Header from './components/Header.jsx';
import CategoryChips from './components/CategoryChips.jsx';
import ProductCard from './components/ProductCard.jsx';
import ProductDetails from './components/ProductDetails.jsx';
import Marketplace from './components/Marketplace.jsx';
import AboutUs from './components/AboutUs.jsx';
import { Toaster } from './components/ui.jsx';
import { searchCatalog, similarProducts, DEFAULT_FILTERS, SORT_OPTIONS } from '@/lib/catalog.js';
import { useLocalState, useToasts } from '@/hooks/useSync.js';
import { useWishlist } from '@/hooks/useCart.js';

export default function App({ user, role, onAccount, onLogout }) {
  const [hubId, setHubId] = useLocalState('qfashion.hub', 'gs-road');
  const [search, setSearch] = useState(''), [dept, setDept] = useState(null), [sort, setSort] = useState('relevance');
  const [product, setProduct] = useState(null);
  const wishlist = useWishlist(), { toasts, toast, dismiss } = useToasts();
  const result = useMemo(() => searchCatalog({ ...DEFAULT_FILTERS, hubId, q: search, dept, sort }), [hubId, search, dept, sort]);
  const preview = () => toast('This is a sample collection. Published products will appear in your account shop.', 'info');
  const notify = () => toast('Stock notifications will open with the real catalog.', 'info');
  return <div className="min-h-screen bg-canvas">
    <Header user={user} onAccount={onAccount} onLogout={onLogout} hubId={hubId} onHub={setHubId} search={search} onSearch={setSearch} cartCount={0} wishCount={wishlist.count} onCart={preview} onWishlist={() => toast('Use the hearts to save preview styles on this device.', 'info')} />
    {user && <Marketplace user={user} role={role} />}
    <main className="mx-auto max-w-[1440px] px-4 sm:px-6 py-7">
      <section className="editorial-hero mb-8"><div><p className="eyebrow">THE NEIGHBOURHOOD EDIT · Q FASHION</p><h1>Wear your city.<br /><em>Make it your own.</em></h1><p>Local discoveries. A fresh perspective.<br />A wardrobe that feels like you.</p><a href="#preview-collection" className="btn-primary mt-6">Explore the mood →</a></div><div className="hero-type" aria-hidden="true"><span>Q</span><small>CURATED WITH A LOCAL POINT OF VIEW</small></div></section>
      <section id="preview-collection"><div className="flex flex-wrap items-end justify-between gap-4 mb-5"><div><p className="eyebrow">DESIGN PREVIEW · SAMPLE PRODUCTS · NOT FOR SALE</p><h2 className="font-editorial text-4xl mt-2">The everyday, reimagined.</h2><p className="text-muted text-sm mt-2">Our real catalog is being curated. Sample prices, stock and estimates below are for preview only.</p></div><label className="text-xs font-bold">Sort preview<select value={sort} onChange={e => setSort(e.target.value)} className="field mt-1">{SORT_OPTIONS.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label></div>
        <CategoryChips value={dept} onChange={setDept} counts={{}} />
        {result.items.length === 0 ? <p className="p-10 text-muted">No preview styles match. Try another search or category.</p> : <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 mt-5">{result.items.map(p => <ProductCard key={p.id} product={p} onOpen={setProduct} onAdd={preview} onNotify={notify} onWishlist={item => wishlist.toggle(item.id)} wished={wishlist.has(p.id)} />)}</div>}
      </section>
    </main>
    {product && <ProductDetails product={product} similar={similarProducts(product, hubId, {}, 6)} onClose={() => setProduct(null)} onAdd={preview} onNotify={notify} onWishlist={p => wishlist.toggle(p.id)} wished={wishlist.has(product.id)} onAskStylist={() => toast('Personal styling will open with the real catalog.', 'info')} onOpen={setProduct} />}
    <AboutUs /><Toaster toasts={toasts} onDismiss={dismiss} />
  </div>;
}
