import test from 'node:test';
import assert from 'node:assert/strict';
import { authenticate } from '../server/admin.js';
test('founder access requires the configured verified identity, not a request body', async () => {
  const previous = process.env.QF_ADMIN_EMAIL;
  process.env.QF_ADMIN_EMAIL = 'owner@example.invalid';
  try {
    const req = { headers: { authorization: 'Bearer synthetic-test-token' }, body: { role: 'admin' } };
    const identity = { uid: 'u1', email: 'someone@example.invalid', email_verified: true };
    assert.equal((await authenticate(req, { verifyIdToken: async () => identity })).role, 'customer');
    assert.equal((await authenticate(req, { verifyIdToken: async () => ({ ...identity, email: 'owner@example.invalid' }) })).role, 'admin');
    await assert.rejects(() => authenticate(req, { verifyIdToken: async () => ({ ...identity, email: 'owner@example.invalid', email_verified: false }) }));
    await assert.rejects(() => authenticate({ headers: {} }, {}));
  } finally { if (previous === undefined) delete process.env.QF_ADMIN_EMAIL; else process.env.QF_ADMIN_EMAIL = previous; }
});
