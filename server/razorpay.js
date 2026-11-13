import { createHash, createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { requireValue } from './domain.js';

export function razorpayConfig(env = process.env) {
  const mode = env.VERCEL_ENV === 'production' ? 'live' : 'test';
  if (mode === 'test') requireValue(env.FIREBASE_PROJECT_ID === 'qfashion-staging-20261101',
    'Test payments require the Q Fashion staging database', 503);
  const key = env.RAZORPAY_KEY_ID;
  const secret = env.RAZORPAY_KEY_SECRET;
  const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET;
  requireValue(env.QF_PAYMENT_PROVIDER === 'razorpay' && env.RAZORPAY_MODE === mode &&
    key?.startsWith('rzp_' + mode + '_') && secret && webhookSecret,
  'Online payments are not open yet', 503);
  return { key, secret, webhookSecret, mode };
}

export function validSignature(secret, payload, signature) {
  return typeof signature === 'string' && /^[a-f0-9]{64}$/i.test(signature) &&
    timingSafeEqual(createHmac('sha256', secret).update(payload).digest(), Buffer.from(signature, 'hex'));
}

async function request(config, path, body) {
  let response;
  try {
    response = await fetch('https://api.razorpay.com/v1/' + path, {
      method: body ? 'POST' : 'GET',
      headers: { Authorization: 'Basic ' + Buffer.from(config.key + ':' + config.secret).toString('base64'), 'Content-Type': 'application/json' },
      body: body && JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    requireValue(false, 'Payment service is temporarily unavailable. Check My orders before trying again.', 502);
  }
  requireValue(response.ok, 'Payment service is temporarily unavailable. Check My orders before trying again.', 502);
  return response.json();
}

export async function prepareRazorpay(db, order, config) {
  requireValue(order.status === 'awaiting_payment' && order.expiresAt > Date.now(), 'Payment window closed. Check My orders.', 409);
  let gatewayOrderId = order.gatewayOrderId;
  if (!gatewayOrderId) {
    const created = await request(config, 'orders', {
      amount: order.totalPaise, currency: 'INR', receipt: order.id.slice(0, 40),
    });
    requireValue(/^order_[A-Za-z0-9]+$/.test(created.id) && created.amount === order.totalPaise &&
      created.currency === 'INR', 'Payment service returned an invalid order', 502);
    gatewayOrderId = await db.runTransaction(async tx => {
      const ref = db.doc('orders/' + order.id);
      const current = (await tx.get(ref)).data();
      requireValue(current?.status === 'awaiting_payment' && current.expiresAt > Date.now(),
        'Payment window closed. Check My orders.', 409);
      if (current.gatewayOrderId) return current.gatewayOrderId;
      // Concurrent requests may create unused gateway orders. Only the linked order
      // can be presented to a customer or accepted for fulfillment.
      tx.create(db.doc('gatewayOrders/' + created.id), { orderId: order.id, mode: config.mode });
      tx.update(ref, { gatewayOrderId: created.id, updatedAt: Date.now() });
      return created.id;
    });
  }
  return { order, razorpay: { key: config.key, orderId: gatewayOrderId } };
}

export async function verifyRazorpay(db, order, input, config) {
  const paymentId = input.razorpay_payment_id;
  requireValue(typeof paymentId === 'string' && /^pay_[A-Za-z0-9]+$/.test(paymentId) &&
    order.gatewayOrderId && input.razorpay_order_id === order.gatewayOrderId &&
    validSignature(config.secret, order.gatewayOrderId + '|' + paymentId, input.razorpay_signature),
  'Payment could not be verified', 400);
  const payment = await request(config, 'payments/' + paymentId);
  requireValue(payment.id === paymentId && payment.order_id === order.gatewayOrderId, 'Payment does not match the order', 409);
  if (payment.status === 'authorized') return { status: 'pending' };
  return { status: await recordCapturedPayment(db, payment, config.mode) };
}

export async function recordCapturedPayment(db, payment, mode) {
  requireValue(typeof payment?.id === 'string' && /^pay_[A-Za-z0-9]+$/.test(payment.id) &&
    typeof payment.order_id === 'string' && /^order_[A-Za-z0-9]+$/.test(payment.order_id) &&
    payment.status === 'captured' && payment.captured === true, 'Invalid captured payment');
  return db.runTransaction(async tx => {
    const link = (await tx.get(db.doc('gatewayOrders/' + payment.order_id))).data();
    if (!link || link.mode !== mode) return 'ignored';
    const ref = db.doc('orders/' + link.orderId);
    const order = (await tx.get(ref)).data();
    requireValue(order?.paymentMethod === 'razorpay' && order.gatewayOrderId === payment.order_id &&
      payment.amount === order.totalPaise && payment.currency === order.currency,
    'Payment does not match the order', 409);
    if (order.gatewayPaymentId === payment.id) return order.paymentStatus === 'verified' ? 'paid' : order.paymentStatus;
    requireValue(!order.gatewayPaymentId, 'Order already has a different captured payment', 409);
    const activeRef = db.doc('activeCheckouts/' + order.uid);
    const active = (await tx.get(activeRef)).data();
    const at = Date.now();
    if (order.status === 'cancelled') {
      tx.update(ref, { gatewayPaymentId: payment.id, paymentStatus: 'refund_review', updatedAt: at,
        history: [...order.history, { status: 'late_payment_captured', ts: at, actor: 'razorpay' }] });
      return 'refund_review';
    }
    requireValue(order.status === 'awaiting_payment', 'Order cannot accept payment', 409);
    const otp = String(randomInt(100000, 1000000));
    tx.create(db.doc('deliverySecrets/' + ref.id), { otpHash: createHash('sha256').update(otp).digest('hex'), attempts: 0 });
    tx.create(db.doc('customerProofs/' + ref.id), { uid: order.uid, otp });
    tx.update(ref, { status: 'paid', paymentStatus: 'verified', gatewayPaymentId: payment.id, verifiedBy: 'razorpay',
      verifiedAt: at, updatedAt: at, history: [...order.history, { status: 'paid', ts: at, actor: 'razorpay' }] });
    if (active?.orderId === ref.id) tx.delete(activeRef);
    return 'paid';
  });
}

export async function verifyRazorpayRefund(order, refundId, config) {
  requireValue(typeof refundId === 'string' && /^rfnd_[A-Za-z0-9]+$/.test(refundId), 'Enter a Razorpay refund ID');
  requireValue(order.gatewayPaymentId, 'This order has no captured Razorpay payment', 409);
  const refund = await request(config, 'refunds/' + refundId);
  requireValue(refund.id === refundId && refund.payment_id === order.gatewayPaymentId &&
    refund.status === 'processed' && refund.currency === order.currency &&
    Number.isSafeInteger(refund.amount) && refund.amount > 0 && refund.amount <= order.totalPaise,
    'The processed refund does not match this order', 409);
  return refund.amount;
}
