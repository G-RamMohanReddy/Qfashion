// Private order data is fetched through the authenticated API, never shared storage.
const empty = () => ({ orders: [], stockOverrides: {}, feedback: [], notifyRequests: [] });
let state = empty();
const listeners = new Set();
const store = {
  get: () => state,
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  hello() {},
  cloudStatus: () => ({ configured: false, connected: false, error: 'Use account orders for updates' }),
  onCloudStatus() { return () => {}; },
  mutate() { throw new Error('Use the authenticated order service'); },
  reset() { state = empty(); listeners.forEach(fn => fn()); },
};
if (typeof window !== 'undefined') {
  try { for (const key of ['qfashion.sync.v1', 'qfashion.address', 'qfashion.lastGroup']) localStorage.removeItem(key); } catch { /* Storage may be disabled. */ }
}
export const createSyncStore = () => store;
export const syncStore = () => store;
