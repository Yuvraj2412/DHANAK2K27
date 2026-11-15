'use client';

import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { parsePriceLabel } from '@/lib/parsePriceLabel';
import { useAuth } from './AuthContext';

const STORAGE_KEY = 'conscientia_cart';
const FOOD_IDS = ['breakfast', 'lunch', 'dinner'];

function isClosedBookingItem(item) {
  return (
    item?.kind === 'accommodation' ||
    item?.kind === 'food' ||
    item?.id === 'accommodation' ||
    item?.key === 'accommodation' ||
    FOOD_IDS.includes(item?.id) ||
    FOOD_IDS.includes(item?.key) ||
    item?.key?.startsWith('foodfest:')
  );
}

// Self-heals cart rows that were written before `kind`/`unitPrice` were
// fixed up (e.g. accommodation/food items saved with the old generic
// kind: 'addon', or workshop/event items saved with no unitPrice at all).
// Runs on every load so stale rows already sitting in localStorage or the
// `cart_items` table pick up the fix without the user re-adding anything.
function normalizeItem(item) {
  if (!item) return item;
  let next = item;
  if (next.id === 'accommodation' && next.kind !== 'accommodation') {
    next = { ...next, kind: 'accommodation' };
  } else if (FOOD_IDS.includes(next.id) && next.kind !== 'food') {
    next = { ...next, kind: 'food' };
  }
  if (typeof next.unitPrice !== 'number' && typeof next.priceLabel === 'string') {
    const parsed = parsePriceLabel(next.priceLabel);
    if (parsed !== null) next = { ...next, unitPrice: parsed };
  }
  return next;
}

function normalizeItems(items) {
  return (items || []).map(normalizeItem).filter((item) => !isClosedBookingItem(item));
}
const CartContext = createContext({
  items: [],
  addItem: () => {},
  setItem: () => {},
  removeItem: () => {},
  updateQty: () => {},
  clear: () => {},
  hasItem: () => false,
  isRegistered: () => false,
});

function readLocalCart() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocalCart(items) {
  const availableItems = items.filter((item) => !isClosedBookingItem(item));
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(availableItems));
  window.dispatchEvent(new CustomEvent('cart:updated', { detail: availableItems }));
}

function cleanLocalItems(items) {
  const availableItems = normalizeItems(items);
  if (availableItems.length !== items.length) writeLocalCart(availableItems);
  return availableItems;
}

// Booked per day — paying for some days must not stop someone adding more.
const DAY_ITEM_IDS = new Set(['breakfast', 'lunch', 'dinner', 'accommodation']);

/** { breakfast: Set(['2026-10-30', …]), … } from registrations.details.items_paid. */
function paidDatesFrom(itemsPaid) {
  const map = {};
  for (const entry of Array.isArray(itemsPaid) ? itemsPaid : []) {
    if (!DAY_ITEM_IDS.has(entry?.internal_id)) continue;
    const set = (map[entry.internal_id] ??= new Set());
    for (const d of Array.isArray(entry.dates) ? entry.dates : []) set.add(d);
  }
  return map;
}

/** Whether a cart line is already fully paid for and can be dropped. A day
 * item only counts when every day in the cart line is already paid; a
 * workshop/event/merch line counts as soon as its id is registered. */
function isPaidCartItem(item, registeredIds, paidDates) {
  if (DAY_ITEM_IDS.has(item.id)) {
    const dates = item.details?.dates || [];
    const paid = paidDates[item.id];
    return dates.length > 0 && !!paid && dates.every((d) => paid.has(d));
  }
  if (registeredIds.has(String(item.id))) return true;
  return Array.from(registeredIds).some((id) => item.key === id || item.key?.startsWith(`${id}:`));
}

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [registeredIds, setRegisteredIds] = useState(new Set());
  const [paidDates, setPaidDates] = useState({});
  const syncedForUser = useRef(null);
  const [registrationVersion, setRegistrationVersion] = useState(0);

  // Already-paid items shouldn't be addable to cart again — a re-add
  // attempt (e.g. clicking "Add to Cart" again on a workshop already
  // booked) should show as registered instead of silently queueing a
  // duplicate purchase.
  useEffect(() => {
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRegisteredIds(new Set());
      return;
    }
    let active = true;
    fetch(`/api/get-registrations?user_id=${encodeURIComponent(user.id)}`)
      .then((res) => res.json())
      .then((json) => {
        if (!active) return;
        const paid = ['paid', 'team'].includes(json?.data?.payment_status);
        const ids = paid && Array.isArray(json?.data?.workshop_ids) ? json.data.workshop_ids : [];
        setRegisteredIds(new Set(ids.map(String)));
        setPaidDates(paid ? paidDatesFrom(json?.data?.details?.items_paid) : {});
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [user, registrationVersion]);

  const isRegistered = useCallback((id) => registeredIds.has(String(id)), [registeredIds]);

  // Called by /payment-success once a registration is saved, so the
  // just-paid items get pruned from the cart below.
  const refreshRegistered = useCallback(() => setRegistrationVersion((v) => v + 1), []);

  // Drop anything already paid for from the signed-in cart. This runs
  // whenever either side finishes loading, so it doesn't matter that
  // /payment-success mounts before the remote cart or the registration
  // have been fetched.
  useEffect(() => {
    if (!user || registeredIds.size === 0) return;
    const paidKeys = items
      .filter((item) => isPaidCartItem(item, registeredIds, paidDates))
      .map((item) => item.key);
    if (paidKeys.length === 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems((prev) => prev.filter((item) => !paidKeys.includes(item.key)));
    // Supabase builders only execute once awaited/then'd.
    supabase.from('cart_items').delete().eq('user_id', user.id).in('item_key', paidKeys).then(() => {});
  }, [user, items, registeredIds, paidDates]);

  // Guest cart: mirror localStorage into state, reacting to other tabs.
  useEffect(() => {
    if (user) return;
    syncedForUser.current = null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(cleanLocalItems(readLocalCart()));
    const onUpdate = (e) => setItems(cleanLocalItems(e.detail || readLocalCart()));
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) setItems(cleanLocalItems(readLocalCart()));
    };
    window.addEventListener('cart:updated', onUpdate);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('cart:updated', onUpdate);
      window.removeEventListener('storage', onStorage);
    };
  }, [user]);

  // On login: push any guest-cart items into Supabase, then load the
  // authoritative remote cart for this account.
  useEffect(() => {
    if (!user || syncedForUser.current === user.id) return;
    syncedForUser.current = user.id;

    if (!isSupabaseConfigured()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setItems(cleanLocalItems(readLocalCart()));
      return;
    }

    (async () => {
      const rawGuestItems = readLocalCart();
      const guestItems = normalizeItems(rawGuestItems);

      if (rawGuestItems.length > 0) {
        if (guestItems.length > 0) {
          const rows = guestItems.map((item) => ({
            user_id: user.id,
            item_key: item.key,
            item_data: item,
          }));
          await supabase.from('cart_items').upsert(rows, { onConflict: 'user_id,item_key' });
        }
      }

      try {
        const { data, error } = await supabase.from('cart_items').select('item_key,item_data').eq('user_id', user.id);

        if (!error && data && data.length > 0) {
          const rows = data || [];
          const rawItems = rows.map((row) => row.item_data);
          const closedKeys = rows
            .filter((row) => isClosedBookingItem(normalizeItem(row.item_data)))
            .map((row) => row.item_key);
          const kept = normalizeItems(rawItems);

          if (closedKeys.length > 0) {
            await supabase
              .from('cart_items')
              .delete()
              .eq('user_id', user.id)
              .in('item_key', closedKeys);
          }

          setItems(kept);
          writeLocalCart(kept);
        } else {
          // If remote is empty or errored, keep local cart
          setItems(cleanLocalItems(readLocalCart()));
        }
      } catch {
        setItems(cleanLocalItems(readLocalCart()));
      }
    })();
  }, [user]);

  const addItem = useCallback(
    async (item) => {
      if (isClosedBookingItem(item)) {
        return { bookingClosed: true };
      }
      if (registeredIds.has(String(item.id))) {
        return { alreadyRegistered: true };
      }
      const itemWithQty = { qty: 1, ...item };
      let merged = null;
      let nextItems = [];
      setItems((prev) => {
        const existing = prev.find((i) => i.key === itemWithQty.key);
        if (existing) {
          merged = { ...existing, ...itemWithQty, qty: (existing.qty || 1) + (itemWithQty.qty || 1) };
          nextItems = prev.map((i) => (i.key === itemWithQty.key ? merged : i));
        } else {
          merged = itemWithQty;
          nextItems = [...prev, itemWithQty];
        }
        writeLocalCart(nextItems);
        return nextItems;
      });

      if (user && isSupabaseConfigured()) {
        try {
          await supabase
            .from('cart_items')
            .upsert(
              [{ user_id: user.id, item_key: itemWithQty.key, item_data: merged }],
              { onConflict: 'user_id,item_key' }
            );
        } catch (e) {
          console.warn('[CartContext] remote upsert failed', e);
        }
      }
    },
    [user, registeredIds]
  );

  // Full upsert-or-replace for cases addItem/updateQty don't cover — e.g.
  // date-based accommodation/food selections where qty AND other fields
  // (details.dates, priceLabel) all need to change together, not just merge
  // quantities. Always overwrites the existing item_data if the key exists.
  const setItem = useCallback(
    async (item) => {
      if (isClosedBookingItem(item)) {
        return { bookingClosed: true };
      }
      if (registeredIds.has(String(item.id))) {
        return { alreadyRegistered: true };
      }
      const full = { qty: 1, ...item };
      let nextItems = [];
      setItems((prev) => {
        const exists = prev.some((i) => i.key === full.key);
        nextItems = exists ? prev.map((i) => (i.key === full.key ? full : i)) : [...prev, full];
        writeLocalCart(nextItems);
        return nextItems;
      });

      if (user && isSupabaseConfigured()) {
        try {
          await supabase
            .from('cart_items')
            .upsert([{ user_id: user.id, item_key: full.key, item_data: full }], { onConflict: 'user_id,item_key' });
        } catch (e) {
          console.warn('[CartContext] remote upsert failed', e);
        }
      }
    },
    [user, registeredIds]
  );

  const updateQty = useCallback(
    async (key, qty) => {
      if (isClosedBookingItem(items.find((item) => item.key === key))) return;
      const nextQty = Math.max(1, Number(qty) || 1);
      let updatedItem = null;
      let nextItems = [];
      setItems((prev) => {
        nextItems = prev.map((i) => {
          if (i.key !== key) return i;
          updatedItem = { ...i, qty: nextQty };
          return updatedItem;
        });
        writeLocalCart(nextItems);
        return nextItems;
      });

      if (user && updatedItem && isSupabaseConfigured()) {
        try {
          await supabase
            .from('cart_items')
            .upsert(
              [{ user_id: user.id, item_key: key, item_data: updatedItem }],
              { onConflict: 'user_id,item_key' }
            );
        } catch (e) {
          console.warn('[CartContext] remote updateQty failed', e);
        }
      }
    },
    [user, items]
  );

  // Delivery is a shared add-on across all merch items, not its own
  // purchasable thing — it can't be cancelled on its own while merch items
  // remain in the cart, and it auto-drops once the last merch item does.
  const removeItem = useCallback(
    async (key) => {
      const current = user ? items : readLocalCart();
      const merchCount = current.filter((i) => i.kind === 'merch').length;

      if (key === 'delivery' && merchCount > 0) return;

      const removingMerch = current.find((i) => i.key === key)?.kind === 'merch';
      const keysToRemove = new Set([key]);
      if (removingMerch && merchCount - 1 === 0) keysToRemove.add('delivery');

      let nextItems = [];
      setItems((prev) => {
        nextItems = prev.filter((i) => !keysToRemove.has(i.key));
        writeLocalCart(nextItems);
        return nextItems;
      });

      if (user && isSupabaseConfigured()) {
        try {
          await supabase
            .from('cart_items')
            .delete()
            .eq('user_id', user.id)
            .in('item_key', Array.from(keysToRemove));
        } catch (e) {
          console.warn('[CartContext] remote delete failed', e);
        }
      }
    },
    [user, items]
  );

  const clear = useCallback(async () => {
    writeLocalCart([]);
    setItems([]);
    if (user && isSupabaseConfigured()) {
      try {
        await supabase.from('cart_items').delete().eq('user_id', user.id);
      } catch (e) {
        console.warn('[CartContext] remote clear failed', e);
      }
    }
  }, [user]);

  const hasItem = useCallback((key) => items.some((i) => i.key === key), [items]);

  // Every function here is already useCallback'd (identity only changes
  // with `items`), but the context value object itself was still a fresh
  // literal every render — meaning every consumer (every card on a listing
  // page reads this directly, plus again via usePaymentReminder) re-rendered
  // on any CartProvider render at all, not just ones where the cart
  // actually changed. Memoizing the value object fixes that.
  const value = useMemo(
    () => ({ items, addItem, setItem, removeItem, updateQty, clear, hasItem, isRegistered, refreshRegistered }),
    [items, addItem, setItem, removeItem, updateQty, clear, hasItem, isRegistered, refreshRegistered]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
