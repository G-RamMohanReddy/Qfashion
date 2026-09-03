/**
 * SHARED STATE — local first, Firestore when it is reachable.
 * ============================================================================
 *
 * Everything the app needs to remember beyond a page load lives in one object:
 *
 *   {
 *     v: 1,                        schema version
 *     rev: <int>,                  bumped on every local write
 *     updatedAt: <epoch ms>,
 *     orders: [ <order> ],         newest first
 *     stockOverrides: { [productId]: n },
 *     feedback: [ <entry> ],
 *     notifyRequests: [ <entry> ]
 *   }
 *
 * Two layers, in this order:
 *
 * 1. LOCAL — `localStorage["qfashion.sync.v1"]` plus a `BroadcastChannel` so
 *    two tabs in the same browser stay in step. This layer always works: no
 *    network, no config, no account. Every write lands here first, which is why
 *    the UI never waits on a round trip.
 *
 * 2. CLOUD — Firestore, when `VITE_FIREBASE_*` is configured and reachable.
 *    Collections: `orders`, `feedback`, `notifyRequests`, `stock`. Writes are
 *    mirrored up per document; `onSnapshot` streams other devices' changes back
 *    down. This is the layer that makes an order placed on a phone visible
 *    anywhere else.
 *
 * If the cloud layer cannot start — no config, offline, rules refuse the write
 * — the app keeps running on layer 1 and logs a warning. A shopper never sees a
 * failure because a database was unreachable.
 *
 * Writes are read-modify-write against storage rather than an in-memory copy,
 * so a change made in another tab a moment earlier is not clobbered.
 */

import { getDb, isFirebaseConfigured } from './firebase.js';

export const SYNC = {
  KEY: 'qfashion.sync.v1',
  CHANNEL: 'qfashion.sync.v1',
  SCHEMA: 1,
  COLLECTIONS: {
    orders: 'orders',
    feedback: 'feedback',
    notifyRequests: 'notifyRequests',
    stock: 'stock',
  },
  /** Most recent orders streamed down on connect. Keeps the payload sane. */
  ORDER_LIMIT: 200,
};

const blank = () => ({
  v: SYNC.SCHEMA,
  rev: 0,
  updatedAt: Date.now(),
  orders: [],
  stockOverrides: {},
  feedback: [],
  notifyRequests: [],
});

const canStore = () => {
  try {
    localStorage.setItem('__qf', '1');
    localStorage.removeItem('__qf');
    return true;
  } catch {
    return false;
  }
};

function readStored() {
  try {
    const raw = localStorage.getItem(SYNC.KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && parsed.v === SYNC.SCHEMA ? parsed : null;
  } catch {
    return null;
  }
}

/** structuredClone is not in every target browser; JSON is enough for this shape. */
function clone(v) {
  try {
    return structuredClone(v);
  } catch {
    return JSON.parse(JSON.stringify(v));
  }
}

/** Firestore rejects `undefined`. Strip it rather than letting a write throw. */
function sanitize(value) {
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (v !== undefined) out[k] = sanitize(v);
    }
    return out;
  }
  return value === undefined ? null : value;
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const byNewest = (a, b) => (b.createdAt || b.ts || 0) - (a.createdAt || a.ts || 0);

/** Union two lists of `{id}` records, letting the remote copy win. */
function mergeById(local, remote) {
  const map = new Map();
  for (const item of local) map.set(item.id, item);
  for (const item of remote) map.set(item.id, item);
  return [...map.values()].sort(byNewest);
}

export function createSyncStore() {
  const persistent = typeof window !== 'undefined' && canStore();
  let state = (persistent && readStored()) || blank();

  const listeners = new Set();
  const notify = () => listeners.forEach((fn) => fn(state));

  /* ------------------------------------------------------------ local layer */

  let channel = null;
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    channel = new BroadcastChannel(SYNC.CHANNEL);
    channel.onmessage = (e) => {
      const msg = e.data;
      if (!msg) return;
      if (msg.t === 'hello') {
        channel.postMessage({ t: 'state', rev: state.rev, state });
        return;
      }
      if (msg.t === 'state' && msg.state && msg.rev > state.rev) {
        state = msg.state;
        notify();
      }
    };
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key !== SYNC.KEY || !e.newValue) return;
      try {
        const incoming = JSON.parse(e.newValue);
        if (incoming.v === SYNC.SCHEMA && incoming.rev > state.rev) {
          state = incoming;
          notify();
        }
      } catch {
        /* ignore a partial write */
      }
    });
  }

  function persist() {
    if (!persistent) return;
    try {
      localStorage.setItem(SYNC.KEY, JSON.stringify(state));
    } catch {
      /* quota — stay in memory for this session */
    }
  }

  /* ------------------------------------------------------------ cloud layer */

  const cloud = { db: null, ready: false, error: null, fns: null };
  const cloudListeners = new Set();
  const announceCloud = () => cloudListeners.forEach((fn) => fn(cloudStatus()));
  const cloudStatus = () => ({
    configured: isFirebaseConfigured,
    connected: Boolean(cloud.db) && cloud.ready,
    error: cloud.error,
  });

  /** Applies a remote change without mirroring it straight back up. */
  function applyRemote(fn) {
    const next = fn(clone(state));
    if (!next || same(next, state)) return;
    next.updatedAt = Date.now();
    state = next;
    persist();
    notify();
  }

  async function connectCloud() {
    if (!isFirebaseConfigured) return;
    const db = await getDb();
    if (!db) {
      cloud.error = 'unavailable';
      announceCloud();
      return;
    }
    try {
      const fns = await import('firebase/firestore');
      cloud.db = db;
      cloud.fns = fns;
      const { collection, onSnapshot, query, orderBy, limit } = fns;

      // `includeMetadataChanges` is what makes the connection indicator honest:
      // Firestore answers the first snapshot straight from its offline cache, so
      // without checking `fromCache` the app would claim to be synced while the
      // backend was unreachable.
      onSnapshot(
        query(collection(db, SYNC.COLLECTIONS.orders), orderBy('createdAt', 'desc'), limit(SYNC.ORDER_LIMIT)),
        { includeMetadataChanges: true },
        (snap) => {
          const remote = snap.docs.map((d) => d.data());
          applyRemote((s) => ({ ...s, orders: mergeById(s.orders, remote) }));
          cloud.ready = !snap.metadata.fromCache;
          if (cloud.ready) cloud.error = null;
          announceCloud();
        },
        (err) => onCloudError('orders', err)
      );

      // The SDK retries network failures silently rather than calling the error
      // handler, so give it a deadline before admitting we are offline.
      setTimeout(() => {
        if (!cloud.ready && !cloud.error) {
          cloud.error = 'offline';
          announceCloud();
        }
      }, 8000);

      onSnapshot(
        collection(db, SYNC.COLLECTIONS.stock),
        (snap) => {
          const overrides = {};
          snap.docs.forEach((d) => {
            const v = d.data();
            if (typeof v.stock === 'number') overrides[d.id] = v.stock;
          });
          applyRemote((s) => ({ ...s, stockOverrides: { ...s.stockOverrides, ...overrides } }));
        },
        (err) => onCloudError('stock', err)
      );

      onSnapshot(
        collection(db, SYNC.COLLECTIONS.feedback),
        (snap) => applyRemote((s) => ({ ...s, feedback: mergeById(s.feedback, snap.docs.map((d) => d.data())) })),
        (err) => onCloudError('feedback', err)
      );

      onSnapshot(
        collection(db, SYNC.COLLECTIONS.notifyRequests),
        (snap) => applyRemote((s) => ({ ...s, notifyRequests: mergeById(s.notifyRequests, snap.docs.map((d) => d.data())) })),
        (err) => onCloudError('notifyRequests', err)
      );
    } catch (err) {
      onCloudError('connect', err);
    }
  }

  function onCloudError(where, err) {
    cloud.error = `${where}: ${err?.code || err?.message || 'failed'}`;
    cloud.ready = false;
    console.warn(`[Q Fashion] Firestore ${where} stream failed — continuing on local state.`, err);
    announceCloud();
  }

  /**
   * Mirrors whatever changed between two states up to Firestore, one document
   * per record. Fire-and-forget: a rejected write is logged, never surfaced to
   * the shopper, and the local state stands either way.
   */
  async function pushToCloud(before, after) {
    if (!cloud.db || !cloud.fns) return;
    const { doc, setDoc } = cloud.fns;
    const db = cloud.db;
    const writes = [];

    const push = (name, id, data) => {
      writes.push(setDoc(doc(db, name, String(id)), sanitize(data), { merge: true }));
    };

    const prevOrders = new Map(before.orders.map((o) => [o.id, o]));
    for (const order of after.orders) {
      if (!same(prevOrders.get(order.id), order)) push(SYNC.COLLECTIONS.orders, order.id, order);
    }

    for (const [productId, value] of Object.entries(after.stockOverrides)) {
      if (before.stockOverrides[productId] !== value) {
        push(SYNC.COLLECTIONS.stock, productId, { stock: value, updatedAt: Date.now() });
      }
    }

    const prevFeedback = new Set(before.feedback.map((f) => f.id));
    for (const entry of after.feedback) {
      if (!prevFeedback.has(entry.id)) push(SYNC.COLLECTIONS.feedback, entry.id, entry);
    }

    const prevNotify = new Set(before.notifyRequests.map((n) => n.id));
    for (const entry of after.notifyRequests) {
      if (!prevNotify.has(entry.id)) push(SYNC.COLLECTIONS.notifyRequests, entry.id, entry);
    }

    if (!writes.length) return;
    try {
      await Promise.all(writes);
    } catch (err) {
      onCloudError('write', err);
    }
  }

  /* ----------------------------------------------------------------- writes */

  /**
   * Read-modify-write. `fn` receives the freshest state on disk and returns the
   * next one. The local layer is updated synchronously; the cloud mirror
   * follows on its own time.
   */
  function mutate(fn) {
    const base = (persistent && readStored()) || state;
    const before = clone(base);
    const next = fn(clone(base));
    if (!next) return state;

    next.v = SYNC.SCHEMA;
    next.rev = (base.rev || 0) + 1;
    next.updatedAt = Date.now();
    state = next;

    persist();
    if (channel) channel.postMessage({ t: 'state', rev: state.rev, state });
    notify();

    pushToCloud(before, state).catch(() => {
      /* already logged */
    });
    return state;
  }

  if (typeof window !== 'undefined') connectCloud();

  return {
    persistent,
    get: () => state,
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    mutate,
    /** Ask another tab for its state (used on first mount). */
    hello() {
      if (channel) channel.postMessage({ t: 'hello' });
    },
    reset() {
      mutate(() => blank());
    },
    /** Connection status, for the small indicator in the footer. */
    cloudStatus,
    onCloudStatus(fn) {
      cloudListeners.add(fn);
      return () => cloudListeners.delete(fn);
    },
  };
}

/* --------------------------------------------------------- one per document */

let singleton = null;
export function syncStore() {
  if (!singleton) singleton = createSyncStore();
  return singleton;
}
