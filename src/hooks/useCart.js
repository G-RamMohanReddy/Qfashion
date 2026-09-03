/**
 * The bag and the wishlist.
 *
 * Cart lines are keyed by SKU + size + colour. Totals always come from
 * `computeBill`, so the drawer, the checkout sheet and the gateway can never
 * disagree about a rupee.
 */

import { useCallback, useMemo } from 'react';
import { computeBill } from '@/lib/pricing.js';
import { useLocalState } from './useSync.js';

const keyOf = (id, size, color) => `${id}|${size}|${color}`;

export function useCart() {
  const [lines, setLines] = useLocalState('qfashion.cart.v1', []);

  const add = useCallback(
    (product, size, color, qty = 1) => {
      const key = keyOf(product.id, size, color);
      setLines((prev) => {
        const found = prev.find((l) => l.key === key);
        if (found) return prev.map((l) => (l.key === key ? { ...l, qty: Math.min(l.qty + qty, Math.max(1, product.stock)) } : l));
        return [
          ...prev,
          {
            key,
            productId: product.id,
            sku: product.sku,
            name: product.name,
            brand: product.brand,
            image: product.images?.front,
            colors: product.colors,
            category: product.category,
            size,
            color,
            qty,
            price: product.price,
            mrp: product.mrp,
            gstRate: product.gstRate,
            storeId: product.storeId,
            storeName: product.store?.name || product.storeName,
            etaLabel: product.etaLabel,
          },
        ];
      });
    },
    [setLines]
  );

  const setQty = useCallback(
    (key, qty) => setLines((p) => (qty <= 0 ? p.filter((l) => l.key !== key) : p.map((l) => (l.key === key ? { ...l, qty } : l)))),
    [setLines]
  );
  const remove = useCallback((key) => setLines((p) => p.filter((l) => l.key !== key)), [setLines]);
  const clear = useCallback(() => setLines([]), [setLines]);

  const bill = useMemo(() => computeBill(lines, { paymentMode: 'UPI' }), [lines]);
  const stores = useMemo(() => [...new Set(lines.map((l) => l.storeId))], [lines]);

  return { lines, add, setQty, remove, clear, bill, stores, count: bill.itemCount };
}

export function useWishlist() {
  const [ids, setIds] = useLocalState('qfashion.wishlist.v1', []);

  const toggle = useCallback(
    (productId) => {
      let added = false;
      setIds((prev) => {
        added = !prev.includes(productId);
        return added ? [productId, ...prev] : prev.filter((x) => x !== productId);
      });
      return added;
    },
    [setIds]
  );

  const has = useCallback((productId) => ids.includes(productId), [ids]);
  const remove = useCallback((productId) => setIds((prev) => prev.filter((x) => x !== productId)), [setIds]);

  return { ids, toggle, has, remove, count: ids.length };
}
