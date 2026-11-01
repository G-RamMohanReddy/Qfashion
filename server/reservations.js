// Release timed-out, unpaid stock before shoppers read availability or check out.
// Orders stay stored. Claimed payments remain reserved for bank review.
export async function releaseExpiredReservations(db, at = Date.now()) {
  const expired = await db.collection('activeCheckouts').where('expiresAt', '<=', at).limit(25).get();
  for (const active of expired.docs) {
    await db.runTransaction(async tx => {
      const current = (await tx.get(active.ref)).data();
      if (!current?.orderId || !(current.expiresAt <= at)) return;
      const ref = db.doc(`orders/${current.orderId}`), snap = await tx.get(ref), order = snap.data();
      if (!order) { tx.delete(active.ref); return; }
      if (order.status !== 'awaiting_payment' || order.paymentStatus !== 'pending') {
        if (order.status === 'awaiting_verification') tx.set(active.ref, { orderId: current.orderId });
        else tx.delete(active.ref);
        return;
      }
      if (order.expiresAt > at) return;
      const refs = order.items.map(item => db.doc(`variants/${item.variantId}`));
      const variants = await tx.getAll(...refs);
      variants.forEach((variant, index) => { if (variant.exists) tx.update(refs[index], { stock: variant.data().stock + order.items[index].qty }); });
      tx.update(ref, { status: 'cancelled', paymentStatus: 'expired', expiredAt: at, cancelledAt: at, updatedAt: at, history: [...order.history, { status: 'payment_window_expired', ts: at, actor: 'system' }] });
      tx.delete(active.ref);
    });
  }
}
