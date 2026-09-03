/**
 * FIREBASE BOOTSTRAP
 * ============================================================================
 *
 * Config comes from Vite environment variables. Vite only exposes variables
 * prefixed `VITE_`, and it inlines them at BUILD time — so these must be set in
 * Vercel's project settings before the build runs, not just in a local `.env`.
 *
 * These values are public by design: they ship inside the JavaScript bundle and
 * anyone can read them in devtools. That is normal for a Firebase web app — the
 * API key is a project identifier, not a secret. Access is controlled by
 * Firestore security rules (see `firestore.rules`), never by hiding the config.
 *
 * Firestore is loaded with a dynamic import so it lands in its own chunk: the
 * storefront paints without waiting for it, and if the network or the config is
 * unavailable the app still runs — `sync.js` falls back to local-only state
 * rather than showing a blank page.
 */

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

/** True when enough config is present to try connecting at all. */
export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let appPromise = null;

async function getApp() {
  if (!isFirebaseConfigured) return null;
  if (!appPromise) {
    appPromise = (async () => {
      const { initializeApp, getApps } = await import('firebase/app');
      return getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    })().catch((err) => {
      console.warn('[Q Fashion] Firebase failed to initialise; running on local state only.', err);
      return null;
    });
  }
  return appPromise;
}

let dbPromise = null;

/**
 * Resolves to a Firestore instance, or `null` if Firebase is not configured or
 * could not start. Callers must handle `null` — that is the offline path.
 */
export function getDb() {
  if (!isFirebaseConfigured) return Promise.resolve(null);
  if (!dbPromise) {
    dbPromise = (async () => {
      const app = await getApp();
      if (!app) return null;
      const { getFirestore } = await import('firebase/firestore');
      return getFirestore(app);
    })().catch((err) => {
      console.warn('[Q Fashion] Firestore unavailable; running on local state only.', err);
      return null;
    });
  }
  return dbPromise;
}

/**
 * Google Analytics, if a measurement id was supplied and the browser supports
 * it. Entirely optional — nothing in the app depends on it resolving.
 */
export async function initAnalytics() {
  if (!firebaseConfig.measurementId) return null;
  try {
    const app = await getApp();
    if (!app) return null;
    const { getAnalytics, isSupported } = await import('firebase/analytics');
    return (await isSupported()) ? getAnalytics(app) : null;
  } catch {
    return null;
  }
}
