import { getApp } from './firebase.js';
let promise;
export function authClient() {
  if (!promise) promise = (async () => {
    const app = await getApp();
    if (!app) throw new Error('Sign-in is not configured yet.');
    const sdk = await import('firebase/auth'), auth = sdk.getAuth(app);
    await auth.authStateReady();
    // Migrate existing session-only users and keep new sign-ins across browser restarts.
    try {
      await sdk.setPersistence(auth, sdk.browserLocalPersistence);
    } catch {
      // Storage-restricted browsers can still use the SDK's available persistence.
    }
    auth.languageCode = 'en';
    return { auth, sdk };
  })().catch(error => {
    promise = undefined;
    throw error;
  });
  return promise;
}
export async function api(action, data = {}) {
  const { auth } = await authClient();
  if (!auth.currentUser) throw new Error('Please sign in');
  const response = await fetch('/api/marketplace', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + await auth.currentUser.getIdToken() },
    body: JSON.stringify({ action, ...data }), signal: AbortSignal.timeout(20000),
  });
  let result;
  try { result = await response.json(); } catch { throw new Error('The order service is unavailable. Your order was not confirmed.'); }
  if (!response.ok) throw new Error(result.error || 'Request failed');
  return result;
}


export function emailContinueSettings() { return { url: window.location.origin + '/?account=1', handleCodeInApp: false }; }
