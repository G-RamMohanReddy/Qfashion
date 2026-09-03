/** React bindings for the shared-state bus and a few small UI helpers. */

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { syncStore } from '@/lib/sync.js';

export function useSyncState() {
  const store = syncStore();
  useEffect(() => {
    store.hello(); // if another tab is open, pull its state
  }, [store]);
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}

/** Whether shared state is mirroring to Firestore — see components/SyncBadge. */
export function useCloudStatus() {
  const store = syncStore();
  const [status, setStatus] = useState(() => store.cloudStatus());
  useEffect(() => store.onCloudStatus(setStatus), [store]);
  return status;
}

export function useLocalState(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? initial : JSON.parse(raw);
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* private mode */
    }
  }, [key, value]);
  return [value, setValue];
}

export function useToasts() {
  const [toasts, setToasts] = useState([]);
  const toast = useCallback((message, tone = 'info', ttl = 3800) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), ttl);
  }, []);
  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  return { toasts, toast, dismiss };
}

/** Re-renders on an interval, for countdowns and "x min ago". */
export function useTick(ms = 1000) {
  const [, set] = useState(0);
  useEffect(() => {
    const t = setInterval(() => set((n) => n + 1), ms);
    return () => clearInterval(t);
  }, [ms]);
}

/** Locks body scroll while a modal or drawer is open. */
export function useScrollLock(active) {
  useEffect(() => {
    if (!active) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [active]);
}
