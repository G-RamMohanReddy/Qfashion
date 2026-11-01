import test from 'node:test';
import assert from 'node:assert/strict';
import { readEmailAction, processEmailAction, emailActionError } from '../src/lib/emailActions.js';
test('email actions accept only supported complete links', () => {
  assert.deepEqual(readEmailAction('?mode=verifyEmail&oobCode=one-time-code'), { mode: 'verifyEmail', code: 'one-time-code' });
  assert.equal(readEmailAction('?mode=verifyEmail'), null);
  assert.equal(readEmailAction('?mode=unknown&oobCode=test'), null);
});
test('duplicate component effects consume a verification code exactly once', async () => {
  let checks = 0, applies = 0, refreshes = 0;
  const auth = { app: { name: 'test-once' }, currentUser: { getIdToken: async force => { assert.equal(force, true); refreshes++; } } };
  const sdk = { checkActionCode: async () => { checks++; return { operation: 'VERIFY_EMAIL', data: { email: 'qa@example.invalid' } }; }, applyActionCode: async () => { applies++; }, reload: async () => {} };
  const action = { mode: 'verifyEmail', code: 'duplicate-effect-test' };
  const [a, b] = await Promise.all([processEmailAction(auth, sdk, action), processEmailAction(auth, sdk, action)]);
  assert.deepEqual(a, b); assert.equal(checks, 1); assert.equal(applies, 1); assert.equal(refreshes, 1);
});
test('a password-reset code cannot be substituted for email verification', async () => {
  const sdk = { checkActionCode: async () => ({ operation: 'PASSWORD_RESET' }), applyActionCode: async () => assert.fail('must not apply mismatched code') };
  await assert.rejects(() => processEmailAction({ app: { name: 'mismatch' } }, sdk, { mode: 'verifyEmail', code: 'wrong-operation' }), { code: 'auth/invalid-action-code' });
});
test('reset links are checked without consuming or changing a password', async () => {
  const sdk = { verifyPasswordResetCode: async () => 'qa@example.invalid', applyActionCode: async () => assert.fail('must not apply reset code as email verification') };
  assert.deepEqual(await processEmailAction({ app: { name: 'reset' } }, sdk, { mode: 'resetPassword', code: 'reset-check' }), { mode: 'resetPassword', email: 'qa@example.invalid' });
});
test('expired links have a recovery path and do not imply verification', () => {
  assert.match(emailActionError({ code: 'auth/expired-action-code' }), /fresh email/);
  assert.match(emailActionError({ code: 'auth/invalid-action-code' }), /already used/);
});
test('transient network failures can retry the same code', async () => {
  let calls = 0;
  const auth = { app: { name: 'network-retry' } }, sdk = { checkActionCode: async () => { if (++calls === 1) throw { code: 'auth/network-request-failed' }; return { operation: 'VERIFY_EMAIL', data: {} }; }, applyActionCode: async () => {} };
  const action = { mode: 'verifyEmail', code: 'transient-test' };
  await assert.rejects(processEmailAction(auth, sdk, action));
  await processEmailAction(auth, sdk, action); assert.equal(calls, 2);
});
