import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X } from 'lucide-react';
import { api } from '@/lib/auth.js';
import { inr } from '@/lib/format.js';
import { useScrollLock } from '@/hooks/useSync.js';

export default function PaymentModal({ open, checkout, onClose, onSuccess }) {
  const [qr, setQr] = useState(''), [reference, setReference] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('');
  useScrollLock(open);
  useEffect(() => {
    let active = true; setQr(''); setReference(''); setError('');
    if (checkout?.upiUri) QRCode.toDataURL(checkout.upiUri, { width: 240, margin: 2, errorCorrectionLevel: 'M' }).then(url => { if (active) setQr(url); }).catch(() => { if (active) setError('QR unavailable. Use the UPI link or ID.'); });
    return () => { active = false; };
  }, [checkout]);
  if (!open || !checkout) return null;
  const { order, upiUri } = checkout;
  const submit = async event => {
    event.preventDefault(); setBusy(true); setError('');
    try { await api('submitPayment', { orderId: order.id, reference }); onSuccess(order); }
    catch (error) { setError(error.message); } finally { setBusy(false); }
  };
  return <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/60" role="dialog" aria-modal="true" aria-label="Pay with UPI">
    <section className="payment-card bg-surface rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-auto">
      <header className="flex justify-between items-center"><p className="eyebrow">Q FASHION · ONLINE PAYMENT</p><button disabled={busy} onClick={onClose} aria-label="Close payment"><X size={20} /></button></header>
      <h2 className="font-editorial text-3xl mt-4">Your edit, almost yours.</h2><p className="text-2xl num mt-3">{inr(order.totalPaise / 100)}</p><p className="text-sm text-muted mt-2">Pay the exact amount once. We’ll verify the credit before preparing your order.</p>
      {qr && <img src={qr} alt={'UPI payment QR for ' + order.payee} className="mx-auto my-4 w-52 h-52" />}
      <p className="text-center font-bold break-all">{order.payee}</p><a href={upiUri} className="btn-primary w-full my-3">Open UPI app</a>
      <p className="notice">Check the recipient in your UPI app. If the name is unexpected, stop and contact Q Fashion. Closing this sheet does not cancel a bank payment.</p>
      <form onSubmit={submit} className="mt-4 space-y-3"><label className="block text-sm">12-digit UPI transaction reference<input required inputMode="numeric" pattern="[0-9]{12}" maxLength={12} value={reference} onChange={e => setReference(e.target.value)} className="field mt-2" autoComplete="off" /></label><p role="alert" className="text-sm text-danger">{error}</p><button disabled={busy} className="btn-outline w-full">{busy ? 'Submitting…' : 'Submit for payment verification'}</button></form>
      <p className="text-xs text-muted mt-3">Submitting a reference does not confirm payment. No cash on delivery. If you paid after the payment window closed, contact support before paying again.</p>
    </section>
  </div>;
}
