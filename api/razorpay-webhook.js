import { services } from '../server/admin.js';
import { razorpayConfig, recordCapturedPayment, validSignature } from '../server/razorpay.js';

export default {
  async fetch(request) {
    if (request.method !== 'POST') return new Response(null, { status: 405 });
    try {
      const config = razorpayConfig();
      const chunks = [];
      let length = 0;
      if (!request.body) return new Response(null, { status: 400 });
      for await (const chunk of request.body) {
        length += chunk.length;
        if (length > 256 * 1024) return new Response(null, { status: 413 });
        chunks.push(chunk);
      }
      const raw = Buffer.concat(chunks);
      if (!validSignature(config.webhookSecret, raw, request.headers.get('x-razorpay-signature'))) {
        return new Response(null, { status: 400 });
      }
      const event = JSON.parse(raw.toString('utf8'));
      if (event.event === 'payment.captured') {
        await recordCapturedPayment(services().db, event.payload?.payment?.entity, config.mode);
      }
      return new Response(null, { status: 200 });
    } catch (error) {
      if ((error.status || 500) >= 500) console.error('Razorpay webhook processing failed');
      return new Response(null, { status: error.status || 500 });
    }
  },
};
