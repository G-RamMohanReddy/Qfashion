export const UPI_ID = '9177595164@ybl';
export function requireValue(ok, message, status = 400) {
  if (!ok) throw Object.assign(new Error(message), { status });
}
export function text(value, max = 200) {
  requireValue(typeof value === 'string' && value.trim().length > 0 && value.length <= max, 'Invalid text field');
  return value.trim();
}
export function integer(value, min, max) {
  requireValue(Number.isSafeInteger(value) && value >= min && value <= max, 'Invalid numeric field');
  return value;
}
export function eta(parts) {
  const keys = ['prep', 'packaging', 'riderArrival', 'travelDelivery', 'buffer'];
  const components = Object.fromEntries(keys.map(k => [k, integer(parts[k], 0, 720)]));
  return { components, total: Object.values(components).reduce((a, b) => a + b, 0) };
}
export function withinDeliveryArea(pickup, address, radiusKm) {
  integer(radiusKm, 1, 50);
  const rad = n => n * Math.PI / 180;
  const a = Math.sin(rad(address.lat - pickup.lat) / 2) ** 2 + Math.cos(rad(pickup.lat)) * Math.cos(rad(address.lat)) * Math.sin(rad(address.lng - pickup.lng) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, a))) <= radiusKm;
}
export function upiLink({ amountPaise, reference }) {
  integer(amountPaise, 100, 10000000);
  return `upi://pay?${new URLSearchParams({ pa: UPI_ID, pn: 'Q Fashion', am: (amountPaise / 100).toFixed(2), cu: 'INR', tn: `Q Fashion ${text(reference, 80)}` })}`;
}
export function paymentReference(value) {
  requireValue(typeof value === 'string' && /^[0-9]{12}$/.test(value), 'Enter the 12-digit UPI reference from your payment app');
  return value;
}
export function canTransition(order, action, actor) {
  const admin = actor.role === 'admin';
  const vendor = actor.role === 'vendor' && actor.vendorId === order.vendorId;
  const rider = actor.role === 'rider' && actor.uid === order.riderId;
  const flow = {
    accept: ['paid', 'accepted', admin || vendor],
    pack: ['accepted', 'packed', admin || vendor],
    pickup: ['packed', 'dispatched', admin || rider],
    deliver: ['dispatched', 'delivered', admin || rider],
  };
  const rule = flow[action];
  requireValue(rule && rule[2], 'You cannot perform this action', 403);
  requireValue(order.paymentStatus === 'verified' && order.status === rule[0], 'Order is not ready for this action', 409);
  if (action === 'pickup') requireValue(order.riderId, 'Assign a rider before pickup', 409);
  return rule[1];
}
export function validateAddress(value) {
  requireValue(value && typeof value === 'object', 'Delivery address required');
  const lat = Number(value.lat), lng = Number(value.lng);
  requireValue(Number.isFinite(lat) && Math.abs(lat) <= 90 && Number.isFinite(lng) && Math.abs(lng) <= 180, 'Valid map coordinates required');
  requireValue(/^[1-9][0-9]{5}$/.test(value.pincode), 'Valid Indian pincode required');
  requireValue(/^[6-9][0-9]{9}$/.test(value.phone), 'Valid mobile number required');
  return { line: text(value.line, 300), name: text(value.name, 80), phone: value.phone, pincode: value.pincode, lat, lng };
}
export function quoteLines(lines, documents) {
  requireValue(Array.isArray(lines) && lines.length > 0 && lines.length <= 30, 'Choose 1–30 variants');
  const seen = new Set();
  return lines.map((line, index) => {
    requireValue(!seen.has(line.variantId), 'Duplicate variant'); seen.add(line.variantId);
    const variant = documents[index];
    requireValue(variant && variant.published === true, 'An item is unavailable', 409);
    integer(line.qty, 1, 10); integer(variant.pricePaise, 100, 10000000);
    requireValue(variant.stock >= line.qty, 'Insufficient stock', 409);
    return { variantId: line.variantId, vendorId: text(variant.vendorId, 80), name: text(variant.name), size: text(variant.size, 30), color: text(variant.color, 30), image: variant.image || null, qty: line.qty, pricePaise: variant.pricePaise, lineTotalPaise: line.qty * variant.pricePaise };
  });
}
