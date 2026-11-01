const pendingActions = new Map();
export function readEmailAction(search) {
  const params = new URLSearchParams(search), mode = params.get('mode'), code = params.get('oobCode');
  if (!['verifyEmail', 'resetPassword', 'recoverEmail', 'verifyAndChangeEmail'].includes(mode) || !code || code.length > 2048) return null;
  return { mode, code };
}
export function emailActionError(error) {
  if (['auth/expired-action-code', 'auth/invalid-action-code'].includes(error?.code)) return 'This link has expired or was already used. Sign in below; if your email still needs verification, request a fresh email from your account.';
  if (error?.code === 'auth/network-request-failed') return 'We could not reach the verification service. Check your connection and open the email link again.';
  if (error?.code === 'auth/user-disabled') return 'This account is unavailable. Contact Q Fashion for help.';
  return 'We could not complete this email action. Sign in to request a fresh link, or contact Q Fashion.';
}
export function processEmailAction(auth, sdk, action) {
  const key = `${auth.app?.name || 'default'}:${action.mode}:${action.code}`;
  if (pendingActions.has(key)) return pendingActions.get(key);
  const operation = (async () => {
    if (action.mode === 'resetPassword') return { mode: action.mode, email: await sdk.verifyPasswordResetCode(auth, action.code) };
    const info = await sdk.checkActionCode(auth, action.code);
    const expected = { verifyEmail: 'VERIFY_EMAIL', recoverEmail: 'RECOVER_EMAIL', verifyAndChangeEmail: 'VERIFY_AND_CHANGE_EMAIL' }[action.mode];
    if (info.operation !== expected) throw Object.assign(new Error('Email action mismatch'), { code: 'auth/invalid-action-code' });
    await sdk.applyActionCode(auth, action.code);
    if (auth.currentUser) {
      // Verification itself succeeded even if this tab belongs to another session.
      try { await sdk.reload(auth.currentUser); await auth.currentUser.getIdToken(true); } catch { /* Sign-in will refresh this session. */ }
    }
    return { mode: action.mode, email: info.data?.email || '' };
  })();
  if (pendingActions.size >= 20) pendingActions.delete(pendingActions.keys().next().value);
  pendingActions.set(key, operation);
  operation.catch(error => { if (error?.code === 'auth/network-request-failed') pendingActions.delete(key); });
  return operation;
}
