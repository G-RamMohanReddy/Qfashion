import { useRef, useState } from 'react';
import { api } from '@/lib/auth.js';
import { inr } from '@/lib/format.js';

export default function PilotCheckout({ user, basket, onAccount, onPayment }) {
  const [address, setAddress] = useState({ name: user?.displayName || '', phone: '', line: '', pincode: '' });
  const [pin, setPin] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [quote, setQuote] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const checkoutId = useRef(null);
  const lines = basket.map(({ sku }) => ({ variantId: sku, qty: 1 }));
  const mixed = new Set(basket.map(item => item.sku.startsWith('DW-') ? 'dw' : 'bs')).size > 1;
  const addressReady = address.line.trim().length > 0 && /^[1-9][0-9]{5}$/.test(address.pincode);

  function update(field, value) {
    setAddress(current => ({ ...current, [field]: value }));
    setQuote(null);
    if (field === 'line' || field === 'pincode') {
      setPin(null);
      setCandidates([]);
    }
  }

  async function run(operation) {
    setBusy(true);
    setMessage('');
    try { await operation(); } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }

  function locate() {
    if (!navigator.geolocation) {
      setMessage('Location is unavailable on this device. Search for your address instead.');
      return;
    }
    run(async () => {
      const coords = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(
        ({ coords }) => resolve(coords),
        () => reject(new Error('Could not read your current location. Search for your address instead.')),
        { enableHighAccuracy: true, timeout: 10000 },
      ));
      if (coords.accuracy > 150) throw new Error('Your location is too approximate. Try address search or move somewhere with better reception.');
      setPin({ label: 'Current device location', lat: coords.latitude, lng: coords.longitude });
      setCandidates([]);
      setQuote(null);
    });
  }

  function findAddress() {
    run(async () => {
      setCandidates([]);
      const { candidates: results } = await api('findDeliveryPin', { line: address.line, pincode: address.pincode });
      setCandidates(results);
      if (!results.length) setMessage('No precise match. Check the address or use your current location at the delivery address.');
    });
  }

  const payload = () => ({ lines, address: { ...address, lat: pin.lat, lng: pin.lng } });

  if (!user) return <button type="button" className="btn-primary" onClick={onAccount}>Sign in to check delivery</button>;
  if (mixed) return <p role="status">For this pilot, check out items from one shop at a time. Remove one shop’s items to continue.</p>;
  return <form onSubmit={event => {
    event.preventDefault();
    if (!pin) return;
    run(async () => {
      setQuote(null);
      const result = await api('deliveryQuote', payload());
      if (quote?.quoteKey !== result.quoteKey) checkoutId.current = null;
      setQuote(result);
    });
  }} className="space-y-3">
    <fieldset disabled={busy} className="space-y-3">
      <label className="block">Recipient name<input required maxLength={80} autoComplete="name" className="field" value={address.name} onChange={e => update('name', e.target.value)} /></label>
      <label className="block">Mobile number<input required inputMode="tel" autoComplete="tel-national" pattern="[6-9][0-9]{9}" maxLength={10} className="field" value={address.phone} onChange={e => update('phone', e.target.value)} /></label>
      <label className="block">Full address and landmark<textarea required maxLength={300} autoComplete="street-address" className="field" value={address.line} onChange={e => update('line', e.target.value)} /></label>
      <label className="block">PIN code<input required inputMode="numeric" autoComplete="postal-code" pattern="[1-9][0-9]{5}" maxLength={6} className="field" value={address.pincode} onChange={e => update('pincode', e.target.value)} /></label>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={!addressReady} className="btn-quiet" onClick={findAddress}>Find my address</button>
        <button type="button" className="btn-quiet" onClick={locate}>Use current location</button>
      </div>
      {candidates.map(candidate => <button type="button" key={candidate.label} className="btn-quiet block" onClick={() => {
        setPin(candidate);
        setCandidates([]);
        setQuote(null);
      }}>{candidate.label}</button>)}
      {pin && <p>Delivery pin: <a className="underline" target="_blank" rel="noreferrer" href={'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(pin.lat + ',' + pin.lng)}>{pin.label}</a></p>}
      <button type="submit" className="btn-primary" disabled={!pin}>Check delivery and price</button>
      {quote && <section className="space-y-2 border-t border-line pt-3" aria-label="Delivery quote">
        <p>Estimated delivery: {quote.eta.total} min after payment</p>
        <p className="text-sm text-muted">Prep {quote.eta.components.prep} + packing {quote.eta.components.packaging} + courier arrival {quote.eta.components.riderArrival} + travel {quote.eta.components.travelDelivery} + buffer {quote.eta.components.buffer} min</p>
        <dl className="space-y-1">
          {Object.entries({ Items: quote.itemsTotalPaise, 'Estimated apparel GST': quote.apparelTaxPaise, 'Platform fee': quote.platformFeePaise, Delivery: quote.deliveryFeePaise, Total: quote.totalPaise }).map(([label, amount]) =>
            <div className="flex justify-between" key={label}><dt>{label}</dt><dd>{inr(amount / 100)}</dd></div>
          )}
        </dl>
        <button type="button" className="btn-primary" onClick={() => run(async () => {
          checkoutId.current ||= crypto.randomUUID();
          onPayment(await api('checkout', { ...payload(), quoteKey: quote.quoteKey, checkoutId: checkoutId.current }));
        })}>Continue to online payment</button>
      </section>}
    </fieldset>
    {busy && <p role="status">Checking your details…</p>}
    {message && <p role="alert">{message}</p>}
  </form>;
}
