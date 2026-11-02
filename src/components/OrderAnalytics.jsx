import { useEffect, useState } from 'react';
import { api } from '@/lib/auth.js';
import { inr } from '@/lib/format.js';
export default function OrderAnalytics() {
  const [data, setData] = useState(null), [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
  useEffect(() => { let active = true; api('analytics').then(result => { if (active) setData(result); }).catch(error => { if (active) setMessage(error.message); }); return () => { active = false; }; }, []);
  const download = async () => {
    setBusy(true); setMessage('');
    try {
      let after = null, orders = [];
      do { const page = await api('exportOrders', { after }); orders.push(...page.orders); after = page.after; } while (after);
      const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), orders }, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob), anchor = document.createElement('a');
      anchor.href = url; anchor.download = 'qfashion-orders-' + new Date().toISOString().slice(0, 10) + '.json'; anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000); setMessage('Complete order records exported. This file contains private customer information; store it securely.');
    } catch (error) { setMessage(error.message); } finally { setBusy(false); }
  };
  const total = data ? Object.values(data.byStatus).reduce((sum, value) => sum + value.count, 0) : 0;
  return <section className="card p-6"><p className="eyebrow">ORDER INTELLIGENCE</p><h2 className="font-editorial text-3xl mt-2">Every order tells a story.</h2><p role="status" className="my-4">{message}</p>{data && <><div className="grid sm:grid-cols-3 gap-4 mb-6">{[['Orders retained', total], ['Verified payments', data.verifiedPayments.count], ['Verified gross collections', inr(data.verifiedPayments.valuePaise / 100)]].map(([label, value]) => <div className="notice" key={label}><p className="text-xs">{label}</p><p className="font-editorial text-3xl">{value}</p></div>)}</div><div className="overflow-auto"><table className="w-full text-left text-sm"><caption className="text-left mb-3">All stored orders, grouped by current status. Values are order totals, not profit.</caption><thead><tr><th className="p-2">Status</th><th>Orders</th><th>Order value</th></tr></thead><tbody>{Object.entries(data.byStatus).map(([status, value]) => <tr className="border-t border-line" key={status}><td className="p-2">{status.replaceAll('_', ' ')}</td><td>{value.count}</td><td>{inr(value.valuePaise / 100)}</td></tr>)}</tbody></table></div></>}<button disabled={busy} className="btn-primary mt-6" onClick={download}>{busy ? 'Exporting all pages…' : 'Export complete order records'}</button><p className="text-xs text-muted mt-3">Snapshots retain customer/address details, purchased variants and prices, payment verification, ETA components, courier assignment, status history and refund notes. Catalog changes do not rewrite previous purchases. No completed orders are deleted by this app.</p></section>;
}
