import { getApp } from './firebase.js';
let promise;
export function authClient() {
  if (!promise) promise = (async () => {
    const app = await getApp();
    if (!app) throw new Error('Sign-in is not configured yet.');
    const sdk = await import('firebase/auth'), auth = sdk.getAuth(app);
    await sdk.setPersistence(auth, sdk.browserSessionPersistence);
    await auth.authStateReady();
    auth.languageCode = 'en';
    return { auth, sdk };
  })();
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
