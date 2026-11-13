import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/auth.js';
import { inr } from '@/lib/format.js';
import PaymentModal from './PaymentModal.jsx';
import DeliveryEstimate from './DeliveryEstimate.jsx';
import OrderAnalytics from './OrderAnalytics.jsx';
import AccountSettings from './AccountSettings.jsx';
import AdminSetup from './AdminSetup.jsx';

const labels = { awaiting_payment: 'Awaiting payment', awaiting_verification: 'Awaiting payment verification', paid: 'Payment verified', accepted: 'Preparing your order', packed: 'Packed for pickup', dispatched: 'Out for delivery', delivered: 'Delivered', cancelled: 'Cancelled' };
export default function Marketplace({ user, role, activeTab, onTabChange }) {
  const [localTab, setLocalTab] = useState('shop');
  const tab = activeTab || localTab, setTab = onTabChange || setLocalTab;
  const [orders, setOrders] = useState([]);
  const [checkout, setCheckout] = useState(null), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const [proofs, setProofs] = useState({});
  const load = useCallback(async () => {
    if (tab !== 'orders') return;
    try {
      setOrders((await api('orders')).orders);
    } catch (error) { setMessage(error.message); }
  }, [tab]);
  useEffect(() => { load(); }, [load]);
  // Poll only while this signed-in workspace is visible; no fabricated progress.
  useEffect(() => {
    if (tab !== 'orders') return;
    const timer = setInterval(() => { if (document.visibilityState === 'visible') load(); }, 20000);
    return () => clearInterval(timer);
  }, [tab, load]);
  const run = async fn => { setBusy(true); setMessage(''); try { await fn(); } catch (error) { setMessage(error.message); } finally { setBusy(false); } };
  const send = (action, data) => run(async () => { await api(action, data); setMessage('Saved.'); await load(); });
  const privileged = ['admin', 'vendor', 'rider'].includes(role);
  return <section className="account-shop mx-auto max-w-[1440px] px-5 py-8">
    <div className="flex flex-wrap gap-5 justify-between items-end mb-6"><div><p className="eyebrow">YOUR Q FASHION</p><h1 className="font-editorial text-4xl">Hello, {user.displayName?.split(' ')[0] || 'you'}.</h1><p className="text-muted mt-2">Find your next favourite, closer to home.</p></div><nav className="flex gap-2 flex-wrap" aria-label="Your account"><button className={tab === 'profile' ? 'chip chip-on' : 'chip'} onClick={() => setTab('profile')}>My profile</button><button className={tab === 'shop' ? 'chip chip-on' : 'chip'} onClick={() => setTab('shop')}>Shop</button><button className={tab === 'orders' ? 'chip chip-on' : 'chip'} onClick={() => setTab('orders')}>{privileged ? 'Fulfillment' : 'My orders'}</button>{['admin', 'vendor'].includes(role) && <button className={tab === 'catalog' ? 'chip chip-on' : 'chip'} onClick={() => setTab('catalog')}>Catalog studio</button>}{role === 'admin' && <button className={tab === 'analytics' ? 'chip chip-on' : 'chip'} onClick={() => setTab('analytics')}>Order analysis</button>}{role === 'admin' && <button className={tab === 'setup' ? 'chip chip-on' : 'chip'} onClick={() => setTab('setup')}>Store setup</button>}</nav></div>
    <p role="status" className="notice mb-4">{message || 'Your Q Fashion account'}</p>
    {tab === 'shop' && <a className="btn-primary" href="#collection">Browse the collection</a>}
    {tab === 'orders' && <div className="space-y-4"><button className="btn-ghost" disabled={busy} onClick={load}>Refresh orders</button>{orders.length === 0 && <p>No orders to show.</p>}{orders.map(order => <article className="card p-5" key={order.id}><div className="flex flex-wrap justify-between gap-3"><div><p className="eyebrow">{order.vendorName}</p><h2 className="font-editorial text-2xl mt-1">{labels[order.status] || order.status}</h2><p className="text-xs text-muted mt-2 break-all">{order.id}</p></div><p className="font-bold">{inr(order.totalPaise / 100)}</p></div><p className="my-3">{order.items.map(i => `${i.name} · ${i.size} × ${i.qty}`).join(', ')}</p>
      <p className="text-sm">Delivery included in total · {inr((order.deliveryFeePaise || 0) / 100)}</p>
      <DeliveryEstimate order={order} />
      {order.uid === user.uid && order.status === 'delivered' && <p className="my-3 text-sm">For a return or exchange, contact us within 24 hours of delivery. Keep the original garment unwashed with tags intact. You pay the courier fee, which we confirm before pickup. <a className="underline" href={'mailto:qfashion.shop1@gmail.com?subject=' + encodeURIComponent('Return or exchange · ' + order.id)}>Email Q Fashion about this order ↗</a></p>}
      {order.paymentStatus === 'awaiting_verification' && <p className="mt-3 text-sm">Payment reference submitted. Q Fashion must confirm the bank credit before fulfillment.</p>}
      <div className="flex gap-2 flex-wrap mt-4">
        {order.uid === user.uid && order.status === 'awaiting_payment' && <button disabled={busy} className="btn-primary" onClick={() => run(async () => setCheckout(await api('resumePayment', { orderId: order.id })))}>Continue payment</button>}
        {(order.uid === user.uid && ['awaiting_payment', 'awaiting_verification'].includes(order.status) || role === 'admin' && ['awaiting_payment', 'awaiting_verification', 'paid', 'accepted', 'packed'].includes(order.status)) && <button disabled={busy} className="btn-ghost" onClick={() => send('cancel', { orderId: order.id })}>Cancel order</button>}
        {order.uid === user.uid && order.paymentStatus === 'verified' && order.status !== 'delivered' && <button className="btn-ghost" onClick={() => run(async () => { const result = await api('proof', { orderId: order.id }); setProofs(p => ({ ...p, [order.id]: result.otp })); })}>Show delivery code</button>}
        {proofs[order.id] && <span className="notice">Share only at delivery: {proofs[order.id]}</span>}
        {['admin', 'vendor'].includes(role) && ['paid', 'accepted'].includes(order.status) && <button disabled={busy} className="btn-primary" onClick={() => send('transition', { orderId: order.id, step: order.status === 'paid' ? 'accept' : 'pack' })}>{order.status === 'paid' ? 'Accept & prepare' : 'Mark packed'}</button>}
        {['admin', 'rider'].includes(role) && order.status === 'packed' && <button disabled={busy} className="btn-primary" onClick={() => send('transition', { orderId: order.id, step: 'pickup' })}>Confirm pickup</button>}

      </div>
      {role === 'admin' && order.status === 'awaiting_verification' && <form className="mt-4 space-y-3" onSubmit={e => { e.preventDefault(); const f = new FormData(e.currentTarget); send('verifyPayment', { orderId: order.id, bankReference: f.get('reference'), amountPaise: Math.round(Number(f.get('amount')) * 100), bankCreditConfirmed: f.get('confirmed') === 'on' }); }}><p className="font-bold">Bank verification · submitted reference {order.submittedReference}</p><label className="block">Reference from bank statement<input required name="reference" pattern="[0-9]{12}" className="field" /></label><label className="block">Credit amount (₹)<input required name="amount" type="number" min="1" step="0.01" className="field" /></label><label className="check"><input required name="confirmed" type="checkbox" /> I checked the actual credit in the bank account.</label><button disabled={busy} className="btn-primary">Confirm received payment</button></form>}
      {role === 'admin' && ['paid', 'accepted', 'packed'].includes(order.status) && <form className="mt-4 flex flex-wrap gap-2" onSubmit={e => { e.preventDefault(); const f = new FormData(e.currentTarget); send('assignRider', { orderId: order.id, name: f.get('name'), phone: f.get('phone') }); }}><label>Courier name<input required name="name" className="field" maxLength={80} /></label><label>Courier mobile<input required name="phone" pattern="[6-9][0-9]{9}" className="field" /></label><button disabled={busy} className="btn-outline self-end">Record courier called</button></form>}
      {['admin', 'rider'].includes(role) && order.status === 'dispatched' && <form className="mt-4 flex gap-2 flex-wrap" onSubmit={e => { e.preventDefault(); send('transition', { orderId: order.id, step: 'deliver', otp: new FormData(e.currentTarget).get('otp') }); }}><label>Customer delivery code<input required name="otp" inputMode="numeric" pattern="[0-9]{6}" className="field" /></label><button disabled={busy} className="btn-primary self-end">Confirm delivery</button></form>}
      {role === 'admin' && <details className="mt-4"><summary className="cursor-pointer font-bold">Complete order record</summary><pre className="text-xs overflow-auto max-h-80 mt-3 bg-canvas p-3 whitespace-pre-wrap break-all">{JSON.stringify(order, null, 2)}</pre></details>}
      {role === 'admin' && order.paymentStatus === 'refund_review' && order.paymentMethod === 'razorpay' && <form className="mt-4 space-y-3" onSubmit={e => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        send('recordGatewayRefund', { orderId: order.id, refundId: form.get('refundId'), note: form.get('note') });
      }}>
        <p className="font-bold">Verify a processed Razorpay refund</p>
        <label className="block">Razorpay refund ID<input required name="refundId" pattern="rfnd_[A-Za-z0-9]+" className="field" /></label>
        <label className="block">Reason<textarea required name="note" maxLength={500} className="field" /></label>
        <button disabled={busy} className="btn-ghost">Verify refund</button>
      </form>}
      {role === 'admin' && order.paymentStatus === 'refund_review' && order.paymentMethod !== 'razorpay' && <form className="mt-4 space-y-3" onSubmit={e => { e.preventDefault(); const f = new FormData(e.currentTarget); send('recordRefund', { orderId: order.id, amountPaise: Math.round(Number(f.get('amount')) * 100), bankReference: f.get('reference'), note: f.get('note') }); }}><p className="font-bold">Record a refund already sent from your bank</p><label className="block">Refund amount (₹)<input required name="amount" type="number" step="0.01" min="1" className="field" /></label><label className="block">Refund UPI reference<input required name="reference" pattern="[0-9]{12}" className="field" /></label><label className="block">Review notes<input required name="note" maxLength={500} className="field" /></label><button disabled={busy} className="btn-outline">Record completed refund</button><p className="text-xs">This records your bank transfer; it does not send money.</p></form>}
      <ol className="text-xs text-muted mt-4 space-y-1">{order.history.map((event, i) => <li key={i}>{labels[event.status] || event.status} · {new Date(event.ts).toLocaleString()}</li>)}</ol>
    </article>)}</div>}
    {tab === 'profile' && <AccountSettings user={user} />}
    {tab === 'setup' && role === 'admin' && <AdminSetup />}
    {tab === 'analytics' && role === 'admin' && <OrderAnalytics />}
    {tab === 'catalog' && <CatalogStudio role={role} busy={busy} send={send} />}
    <PaymentModal open={!!checkout} checkout={checkout} onClose={() => { setCheckout(null); setTab('orders'); }} onSuccess={(_, status) => { setCheckout(null); setTab('orders'); setMessage(status === 'paid' ? 'Payment verified.' : 'Check My orders for the latest payment status.'); load(); }} />
  </section>;
}

function CatalogStudio({ role, busy, send }) {
  const [drafts, setDrafts] = useState([]), [selected, setSelected] = useState(null), [error, setError] = useState('');
  const refresh = () => api('catalogDrafts').then(result => setDrafts(result.variants)).catch(error => setError(error.message));
  useEffect(() => { refresh(); }, [role]);
  const submit = event => {
    event.preventDefault(); const f = new FormData(event.currentTarget);
    const variant = Object.fromEntries(['id', 'vendorId', 'name', 'size', 'color', 'image'].map(k => [k, f.get(k)]));
    Object.assign(variant, { pricePaise: Math.round(Number(f.get('price')) * 100), stock: Number(f.get('stock') || 0), published: f.get('published') === 'on' });
    send('saveVariant', { variant });
  };
  return <div className="grid lg:grid-cols-2 gap-6"><section className="card p-5 lg:col-span-2"><label className="block">Existing variants<select className="field mt-2" value={selected?.id || ""} onChange={e => setSelected(drafts.find(d => d.id === e.target.value) || null)}><option value="">New variant</option>{drafts.map(d => <option key={d.id} value={d.id}>{d.name} · {d.size} · {d.color} · {d.published ? "Published" : "Draft"}</option>)}</select></label><button className="btn-quiet mt-2" onClick={refresh}>Refresh catalog records</button><p role="status">{error}</p></section><form key={selected?.id || "new"} className="card p-6 space-y-3" onSubmit={submit}><p className="eyebrow">CATALOG STUDIO</p><h2 className="font-editorial text-3xl">Curate the next edit.</h2><p className="text-sm text-muted">Each size/color combination is a distinct inventory record. Vendor changes return to draft for admin approval. WhatsApp import is deferred.</p>{[['id', 'Variant ID'], ['vendorId', 'Vendor ID'], ['name', 'Product name'], ['size', 'Size'], ['color', 'Color'], ['image', 'HTTPS image URL']].map(([name, label]) => <label key={name} className="block">{label}<input name={name} defaultValue={selected?.[name] || ""} required={name !== 'image'} className="field" maxLength={name === 'image' ? 2000 : 200} /></label>)}<label className="block">Tax-inclusive price (₹)<input required type="number" name="price" defaultValue={selected ? selected.pricePaise / 100 : ""} min="1" step="0.01" className="field" /></label>{role === 'admin' && <><label className="block">Available stock<input required name="stock" defaultValue={selected?.stock ?? 0} type="number" min="0" step="1" className="field" /></label><label className="check"><input type="checkbox" name="published" defaultChecked={selected?.published || false} /> Publish this variant</label></>}<button disabled={busy} className="btn-primary">Save {role === 'admin' ? 'variant' : 'draft'}</button></form>
    {role === 'admin' && <form className="card p-6 space-y-3" onSubmit={e => { e.preventDefault(); const f = new FormData(e.currentTarget); const vendor = { id: f.get('id'), name: f.get('name'), active: f.get('active') === 'on', pincodes: f.get('pincodes').split(',').map(p => p.trim()), radiusKm: Number(f.get('radiusKm')), deliveryFeePaise: Math.round(Number(f.get('deliveryFee')) * 100), pickup: Object.fromEntries(['line', 'phone', 'pincode', 'lat', 'lng'].map(k => [k, f.get(k)])) }; vendor.pickup.name = vendor.name; for (const k of ['prep', 'packaging', 'riderArrival', 'buffer']) vendor[k] = Number(f.get(k)); send('saveVendor', { vendor }); }}><p className="eyebrow">VENDOR OPERATIONS</p><h2 className="font-editorial text-3xl">Bring local stores closer.</h2>{[['id', 'Vendor ID'], ['name', 'Vendor name'], ['pincodes', 'Service pincodes, comma-separated'], ['radiusKm', 'Maximum road delivery distance (km, 1–50)'], ['line', 'Pickup address'], ['phone', 'Pickup mobile'], ['pincode', 'Pickup pincode'], ['lat', 'Pickup latitude'], ['lng', 'Pickup longitude']].map(([name, label]) => <label key={name} className="block">{label}<input required name={name} className="field" /></label>)}<label className="block">Customer delivery fee (₹)<input required name="deliveryFee" type="number" min="0.01" max="100000" step="0.01" className="field" /></label>{[['prep', 'Preparation'], ['packaging', 'Packaging'], ['riderArrival', 'Rider arrival estimate'], ['buffer', 'Buffer']].map(([name, label]) => <label key={name} className="block">{label} (min)<input required name={name} type="number" min="0" max="120" className="field" /></label>)}<label className="check"><input type="checkbox" name="active" /> Enable vendor</label><button disabled={busy} className="btn-primary">Save vendor</button></form>}
  </div>;
}
