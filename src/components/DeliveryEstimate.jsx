import { useEffect, useState } from 'react';
const stages = ['Payment verified', 'Preparing', 'Packed', 'On the way', 'Delivered'];
export default function DeliveryEstimate({ order }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(timer); }, []);
  const stage = { paid: 0, accepted: 1, packed: 2, dispatched: 3, delivered: 4 }[order.status];
  if (!order.eta || order.status === 'cancelled') return null;
  const expectedAt = order.verifiedAt ? order.verifiedAt + order.eta.total * 60000 : null;
  const remaining = expectedAt ? Math.ceil((expectedAt - now) / 60000) : null;
  return <section className="delivery-estimate mt-4" aria-label="Estimated delivery">
    <div className="flex items-center gap-4"><span className={'delivery-symbol ' + (stage !== undefined && stage < 4 ? 'delivery-moving' : '')} aria-hidden="true">↗</span><div><p className="eyebrow">Q FASHION LOCAL DELIVERY</p><p className="font-editorial text-2xl">{order.status === 'delivered' ? 'Your edit has arrived.' : remaining === null ? `Estimated ${order.eta.total} min after payment verification` : remaining > 0 ? `Around ${remaining} min remaining` : 'Taking a little longer than estimated'}</p><p className="text-xs text-muted mt-1">{order.status === 'delivered' ? 'Delivery confirmed.' : expectedAt ? 'Estimated arrival ' + new Date(expectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'We’ll start preparing after your payment is verified.'}</p></div></div>
    {stage !== undefined && <ol className="delivery-stages mt-5">{stages.map((label, index) => <li key={label} className={index <= stage ? 'stage-complete' : ''}><span aria-hidden="true">{index < stage ? '✓' : index + 1}</span><small>{label}{index === stage ? ' · Current' : ''}</small></li>)}</ol>}
    <p className="text-xs text-muted mt-4">Preparation {order.eta.components.prep} + packaging {order.eta.components.packaging} + rider arrival {order.eta.components.riderArrival} + travel/delivery {order.eta.components.travelDelivery} + buffer {order.eta.components.buffer} min. Estimate may change with traffic and availability. Progress updates come from Q Fashion.</p>
  </section>;
}
