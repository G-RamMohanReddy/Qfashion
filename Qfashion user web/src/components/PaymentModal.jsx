/**
 * Checkout payment sheet.
 *
 * Models a real Indian gateway end to end — method list, UPI app handoff with a
 * collect-request wait, a QR with an expiry clock, card entry with network
 * detection from the BIN, a bank OTP screen, a processing state, and a captured
 * reference like TXN_QF_98234 — with no network call anywhere.
 *
 * It runs in TEST MODE and says so, the way Razorpay and Cashfree label their
 * sandboxes. A payment surface that hides being a sandbox is one somebody
 * eventually mistakes for the real thing. No card data leaves this component.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  X, Lock, ShieldCheck, ChevronRight, Smartphone, CreditCard, Landmark, Banknote,
  QrCode, Loader2, CheckCircle2, AlertTriangle, ArrowLeft, Clock,
} from 'lucide-react';
import { makeTxnId } from '@/lib/orders.js';
import { PLATFORM } from '@/data/seedData.js';
import { inr, cx, mmss } from '@/lib/format.js';
import { useScrollLock } from '@/hooks/useSync.js';

/* --------------------------------------------------------------- fake QR */

function QrArt({ seed = 'qf', size = 168 }) {
  const cells = useMemo(() => {
    const N = 25;
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    const rand = () => {
      h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
      return ((h >>> 0) % 1000) / 1000;
    };
    const grid = Array.from({ length: N }, () => Array(N).fill(0));
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) grid[r][c] = rand() > 0.55 ? 1 : 0;
    const finder = (r, c) => {
      for (let i = -1; i <= 7; i++)
        for (let j = -1; j <= 7; j++) {
          const rr = r + i, cc = c + j;
          if (rr < 0 || cc < 0 || rr >= N || cc >= N) continue;
          const edge = i === 0 || i === 6 || j === 0 || j === 6;
          const core = i >= 2 && i <= 4 && j >= 2 && j <= 4;
          grid[rr][cc] = edge || core ? 1 : 0;
        }
    };
    finder(0, 0); finder(0, N - 7); finder(N - 7, 0);
    return grid;
  }, [seed]);

  const N = cells.length;
  const s = size / N;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="UPI QR code" className="rounded border border-line bg-white p-1">
      <rect width={size} height={size} fill="#fff" />
      {cells.map((row, r) => row.map((v, c) => (v ? <rect key={`${r}-${c}`} x={c * s} y={r * s} width={s} height={s} fill="#282c3f" /> : null)))}
    </svg>
  );
}

/* ---------------------------------------------------------------- methods */

const UPI_APPS = [
  { id: 'gpay', label: 'Google Pay', tint: '#4285f4', short: 'G' },
  { id: 'phonepe', label: 'PhonePe', tint: '#5f259f', short: 'Pe' },
  { id: 'paytm', label: 'Paytm', tint: '#00baf2', short: 'P' },
  { id: 'bhim', label: 'BHIM UPI', tint: '#f7941d', short: 'B' },
];

const BANKS = ['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra Bank', 'Punjab National Bank'];

const METHODS = [
  { id: 'upi', label: 'UPI', hint: 'Google Pay · PhonePe · Paytm', icon: Smartphone },
  { id: 'qr', label: 'Scan QR code', hint: 'Any UPI app', icon: QrCode },
  { id: 'card', label: 'Credit / Debit card', hint: 'Visa · Mastercard · RuPay', icon: CreditCard },
  { id: 'netbanking', label: 'Net banking', hint: 'All major banks', icon: Landmark },
  { id: 'cod', label: 'Cash on delivery', hint: `Up to ${inr(PLATFORM.codLimit)} · +${inr(PLATFORM.codFee)} handling`, icon: Banknote },
];

const cardNetwork = (num) => {
  const n = num.replace(/\s/g, '');
  if (/^4/.test(n)) return 'Visa';
  if (/^5[1-5]/.test(n)) return 'Mastercard';
  if (/^6/.test(n)) return 'RuPay';
  if (/^3[47]/.test(n)) return 'Amex';
  return null;
};

/* ------------------------------------------------------------------ sheet */

export default function PaymentModal({ open, amount, orderRef, customer, onClose, onSuccess }) {
  const [screen, setScreen] = useState('methods');
  const [method, setMethod] = useState(null);
  const [upiApp, setUpiApp] = useState(null);
  const [bank, setBank] = useState(BANKS[0]);
  const [card, setCard] = useState({ number: '4111 1111 1111 1111', expiry: '12/28', cvv: '', name: customer?.name || '' });
  const [otp, setOtp] = useState('');
  const [error, setError] = useState(null);
  const [expiry, setExpiry] = useState(600000);
  const [resendIn, setResendIn] = useState(0);
  const txn = useRef(makeTxnId());
  const timers = useRef([]);

  useScrollLock(open);
  const later = (fn, ms) => {
    const t = setTimeout(fn, ms);
    timers.current.push(t);
    return t;
  };

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useEffect(() => {
    if (!open) return;
    setScreen('methods');
    setMethod(null);
    setError(null);
    setOtp('');
    setExpiry(600000);
    txn.current = makeTxnId();
  }, [open]);

  useEffect(() => {
    if (!open || screen === 'success') return undefined;
    const t = setInterval(() => setExpiry((e) => Math.max(0, e - 1000)), 1000);
    return () => clearInterval(t);
  }, [open, screen]);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const t = setInterval(() => setResendIn((n) => Math.max(0, n - 1)), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  if (!open) return null;

  const mode = method === 'cod' ? 'COD' : method === 'card' ? 'Card' : method === 'netbanking' ? 'NetBanking' : 'UPI';

  const finish = (label) => {
    setScreen('processing');
    later(() => {
      setScreen('success');
      later(() => {
        onSuccess({
          mode,
          instrument: label,
          txnId: method === 'cod' ? null : txn.current,
          status: method === 'cod' ? 'pending' : 'captured',
          capturedAt: Date.now(),
        });
      }, 1400);
    }, 1600);
  };

  const goOtp = () => {
    setError(null);
    setOtp('');
    setResendIn(30);
    setScreen('otp');
  };

  const submitOtp = () => {
    if (otp.length !== 6) {
      setError('Enter the 6-digit code sent to your registered mobile number.');
      return;
    }
    finish(method === 'card' ? `${cardNetwork(card.number) || 'Card'} •••• ${card.number.replace(/\s/g, '').slice(-4)}` : bank);
  };

  const pick = (id) => {
    setMethod(id);
    setError(null);
    setScreen(id === 'upi' ? 'upi' : id === 'qr' ? 'qr' : id === 'card' ? 'card' : id === 'netbanking' ? 'netbanking' : 'cod');
  };

  const Back = () => (
    <button onClick={() => { setScreen('methods'); setError(null); }} className="btn-quiet -ml-1 gap-1 text-xs font-bold">
      <ArrowLeft size={13} /> Payment methods
    </button>
  );

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label="Payment">
      <button className="absolute inset-0 animate-fade bg-ink/60" onClick={screen === 'processing' ? undefined : onClose} aria-label="Close" tabIndex={-1} />

      <div className="relative flex max-h-[94vh] w-full animate-rise flex-col overflow-hidden rounded-t-xl bg-surface shadow-pop sm:max-w-3xl sm:rounded-xl">
        <header className="flex items-center gap-3 border-b border-line bg-canvas px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-primary text-sm font-black text-white">Q</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-extrabold leading-tight">{PLATFORM.merchantName}</p>
            <p className="num truncate text-2xs text-muted">Order {orderRef} · {inr(amount)}</p>
          </div>
          <span className="hidden items-center gap-1 rounded border border-speed bg-speed-soft px-2 py-0.5 text-2xs font-black uppercase tracking-wide text-speed-ink sm:flex">
            Test mode
          </span>
          {screen !== 'processing' && (
            <button onClick={onClose} className="rounded p-1 text-muted hover:text-ink" aria-label="Cancel payment">
              <X size={18} />
            </button>
          )}
        </header>

        <div className="grid flex-1 overflow-y-auto sm:grid-cols-[15rem_1fr]">
          <aside className="hidden flex-col justify-between border-r border-line bg-canvas p-4 sm:flex">
            <div>
              <p className="text-2xs font-black uppercase tracking-wide text-muted">Amount payable</p>
              <p className="num mt-1 text-3xl font-black">{inr(amount)}</p>
              <p className="num mt-1 text-2xs text-muted">Order {orderRef}</p>
              <div className="mt-4 space-y-2 border-t border-line pt-4 text-2xs text-muted">
                <p className="flex items-center gap-2"><ShieldCheck size={12} className="text-success" /> PCI-DSS compliant flow</p>
                <p className="flex items-center gap-2"><Lock size={12} className="text-success" /> 256-bit TLS</p>
                <p className="flex items-center gap-2"><Clock size={12} /> Expires in <span className="num font-bold text-ink">{mmss(expiry)}</span></p>
              </div>
            </div>
            <p className="text-2xs leading-relaxed text-muted">Sandbox environment. No real payment instrument is charged and no card data leaves this device.</p>
          </aside>

          <section className="min-h-[22rem] p-4 sm:p-5">
            {screen === 'methods' && (
              <>
                <h3 className="mb-3 text-sm font-extrabold">Choose a payment method</h3>
                <ul className="space-y-2">
                  {METHODS.map((m) => (
                    <li key={m.id}>
                      <button
                        onClick={() => pick(m.id)}
                        disabled={m.id === 'cod' && amount > PLATFORM.codLimit}
                        className="flex w-full items-center gap-3 rounded-lg border border-line bg-surface px-3 py-3 text-left transition-colors hover:border-primary disabled:opacity-40"
                      >
                        <m.icon size={18} className="shrink-0 text-primary" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-bold">{m.label}</span>
                          <span className="block truncate text-2xs text-muted">{m.hint}</span>
                        </span>
                        <ChevronRight size={16} className="shrink-0 text-muted" />
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 flex items-center gap-1.5 text-2xs text-muted"><Lock size={11} /> Payments are processed over an encrypted channel.</p>
              </>
            )}

            {screen === 'upi' && (
              <>
                <Back />
                <h3 className="mb-1 mt-2 text-sm font-extrabold">Pay by UPI</h3>
                <p className="mb-3 text-2xs text-muted">Pick the app you have installed. We will send a collect request to it.</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {UPI_APPS.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => { setUpiApp(a); setScreen('upi-wait'); later(() => finish(a.label), 3200); }}
                      className="flex flex-col items-center gap-2 rounded-lg border border-line bg-surface px-2 py-4 transition-colors hover:border-primary"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-black text-white" style={{ background: a.tint }}>{a.short}</span>
                      <span className="text-2xs font-bold">{a.label}</span>
                    </button>
                  ))}
                </div>
                <div className="mt-4 border-t border-line pt-4">
                  <label className="block">
                    <span className="text-2xs font-black uppercase tracking-wide text-muted">Or enter a UPI ID</span>
                    <div className="mt-1.5 flex gap-2">
                      <input className="field" placeholder="yourname@okhdfcbank" aria-label="UPI ID" />
                      <button onClick={() => { setScreen('upi-wait'); later(() => finish('UPI ID'), 3000); }} className="btn-primary shrink-0">Verify</button>
                    </div>
                  </label>
                </div>
              </>
            )}

            {screen === 'upi-wait' && (
              <div className="flex h-full flex-col items-center justify-center gap-4 py-10 text-center">
                <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft">
                  <span className="absolute inline-flex h-16 w-16 animate-ping2 rounded-full bg-primary/30" />
                  <Smartphone size={26} className="relative text-primary" />
                </span>
                <div>
                  <p className="text-base font-extrabold">Approve the request in {upiApp?.label || 'your UPI app'}</p>
                  <p className="mt-1 text-xs text-muted">A collect request for {inr(amount)} has been sent. Do not close this window.</p>
                </div>
                <Loader2 size={18} className="animate-spin-slow text-muted" />
              </div>
            )}

            {screen === 'qr' && (
              <>
                <Back />
                <div className="mt-2 flex flex-col items-center gap-3 text-center">
                  <h3 className="text-sm font-extrabold">Scan with any UPI app</h3>
                  <QrArt seed={txn.current} />
                  <p className="num text-2xs text-muted">qfashion@okhdfcbank · {inr(amount)}</p>
                  <p className="num flex items-center gap-1.5 text-2xs font-bold text-speed-ink"><Clock size={11} /> QR expires in {mmss(expiry)}</p>
                  <button onClick={() => { setScreen('upi-wait'); later(() => finish('UPI QR'), 2600); }} className="btn-primary mt-1 w-full sm:w-auto">I have scanned it</button>
                </div>
              </>
            )}

            {screen === 'card' && (
              <>
                <Back />
                <h3 className="mb-1 mt-2 text-sm font-extrabold">Card details</h3>
                <p className="mb-3 flex items-center gap-1.5 text-2xs font-bold text-speed-ink"><AlertTriangle size={11} /> Sandbox — the test card below is pre-filled. Never enter a real card.</p>
                <div className="space-y-3">
                  <label className="block">
                    <span className="text-2xs font-black uppercase tracking-wide text-muted">Card number</span>
                    <div className="relative mt-1.5">
                      <input className="field num pr-20" inputMode="numeric" autoComplete="off" value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value.replace(/[^\d ]/g, '').slice(0, 19) })} aria-label="Card number" />
                      {cardNetwork(card.number) && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-2xs font-black text-muted">{cardNetwork(card.number)}</span>}
                    </div>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-2xs font-black uppercase tracking-wide text-muted">Expiry</span>
                      <input className="field num mt-1.5" placeholder="MM/YY" autoComplete="off" value={card.expiry} onChange={(e) => setCard({ ...card, expiry: e.target.value.slice(0, 5) })} aria-label="Expiry" />
                    </label>
                    <label className="block">
                      <span className="text-2xs font-black uppercase tracking-wide text-muted">CVV</span>
                      <input className="field num mt-1.5" placeholder="•••" type="password" inputMode="numeric" autoComplete="off" value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })} aria-label="CVV" />
                    </label>
                  </div>
                  <label className="block">
                    <span className="text-2xs font-black uppercase tracking-wide text-muted">Name on card</span>
                    <input className="field mt-1.5" autoComplete="off" value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} aria-label="Name on card" />
                  </label>
                  {error && <p className="text-2xs font-bold text-danger">{error}</p>}
                  <button
                    onClick={() => {
                      if (card.cvv.length < 3) {
                        setError('Enter the 3-digit CVV printed on the back of the card.');
                        return;
                      }
                      goOtp();
                    }}
                    className="btn-primary w-full py-3"
                  >
                    Pay {inr(amount)}
                  </button>
                </div>
              </>
            )}

            {screen === 'netbanking' && (
              <>
                <Back />
                <h3 className="mb-3 mt-2 text-sm font-extrabold">Select your bank</h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {BANKS.map((b) => (
                    <button key={b} onClick={() => { setBank(b); goOtp(); }} className="flex items-center gap-2.5 rounded-lg border border-line bg-surface px-3 py-3 text-left text-sm font-bold transition-colors hover:border-primary">
                      <Landmark size={15} className="shrink-0 text-primary" />
                      {b}
                    </button>
                  ))}
                </div>
              </>
            )}

            {screen === 'cod' && (
              <>
                <Back />
                <div className="mt-2 space-y-4">
                  <h3 className="text-sm font-extrabold">Cash on delivery</h3>
                  <div className="rounded-lg border border-line bg-canvas p-4">
                    <p className="num text-2xl font-black">{inr(amount)}</p>
                    <p className="mt-1 text-xs text-muted">Pay in cash when your order arrives. Please keep exact change ready.</p>
                    <ul className="mt-3 space-y-1 text-2xs text-muted">
                      <li>· A {inr(PLATFORM.codFee)} cash-handling charge is already included above.</li>
                      <li>· COD is available on orders up to {inr(PLATFORM.codLimit)}.</li>
                      <li>· The delivery partner carries a UPI QR if you change your mind at the door.</li>
                    </ul>
                  </div>
                  <button onClick={() => finish('Cash on delivery')} className="btn-primary w-full py-3">Confirm cash on delivery</button>
                </div>
              </>
            )}

            {screen === 'otp' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 rounded-lg border border-line bg-canvas px-3 py-2.5">
                  <Landmark size={15} className="text-primary" />
                  <p className="text-xs font-bold">{method === 'card' ? `${cardNetwork(card.number) || 'Card'} •••• ${card.number.replace(/\s/g, '').slice(-4)}` : bank}</p>
                  <span className="num ml-auto text-2xs text-muted">{inr(amount)}</span>
                </div>
                <div>
                  <h3 className="text-sm font-extrabold">Verify with OTP</h3>
                  <p className="mt-1 text-2xs text-muted">
                    A 6-digit code has been sent to your registered mobile number ending {String(customer?.phone || '98640 12345').slice(-4)}.
                  </p>
                </div>
                <input
                  className="field num text-center text-2xl font-black tracking-[0.5em]"
                  inputMode="numeric"
                  maxLength={6}
                  autoFocus
                  value={otp}
                  onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(null); }}
                  onKeyDown={(e) => e.key === 'Enter' && submitOtp()}
                  aria-label="One-time password"
                  placeholder="••••••"
                />
                {error && <p className="text-2xs font-bold text-danger">{error}</p>}
                <div className="flex items-center justify-between">
                  <button disabled={resendIn > 0} onClick={() => setResendIn(30)} className="btn-quiet text-2xs font-bold disabled:opacity-40">
                    {resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend code'}
                  </button>
                  <span className="num text-2xs text-muted">Session {mmss(expiry)}</span>
                </div>
                <button onClick={submitOtp} className="btn-primary w-full py-3">Verify and pay {inr(amount)}</button>
                <p className="text-center text-2xs text-muted">Sandbox accepts any 6 digits.</p>
              </div>
            )}

            {screen === 'processing' && (
              <div className="flex h-full flex-col items-center justify-center gap-4 py-12 text-center">
                <Loader2 size={34} className="animate-spin-slow text-primary" />
                <div>
                  <p className="text-base font-extrabold">Processing your payment</p>
                  <p className="mt-1 text-xs text-muted">Do not press back or refresh this page.</p>
                </div>
              </div>
            )}

            {screen === 'success' && (
              <div className="flex h-full flex-col items-center justify-center gap-3 py-10 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success-soft">
                  <CheckCircle2 size={32} className="text-success" />
                </span>
                <div>
                  <p className="text-lg font-black">{method === 'cod' ? 'Order confirmed' : 'Payment successful'}</p>
                  <p className="num mt-1 text-sm text-muted">{inr(amount)} · {mode}</p>
                </div>
                {method !== 'cod' && (
                  <p className="num rounded border border-line bg-canvas px-3 py-1.5 text-2xs text-muted">
                    Transaction ID <span className="font-black text-ink">{txn.current}</span>
                  </p>
                )}
                <p className="text-2xs text-muted">Sending your order to the store…</p>
              </div>
            )}
          </section>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-line bg-canvas px-4 py-2.5">
          <p className="flex items-center gap-1.5 text-2xs text-muted"><Lock size={11} /> Secured payment simulation · no real funds move</p>
          <p className="num text-2xs text-muted sm:hidden">{mmss(expiry)}</p>
        </footer>
      </div>
    </div>
  );
}
