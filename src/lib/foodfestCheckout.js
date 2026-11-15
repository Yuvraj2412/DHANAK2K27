// Food Fest checkout — uses Razorpay Standard Checkout directly without
// legacy ticket systems.
import { saveCheckoutSessionToStorage } from './checkout';

export const FOODFEST_STORAGE_KEYS = ['foodfest_pending_order', 'foodfest_tiqr_booking_uid'];

/**
 * @param {Array<{key:string, stallId:string, id:string, name:string, qty:number, unitPrice:number}>} cartItems
 * @param {{ name:string, email:string, phone:string, userId:string }} details
 */
export async function startFoodfestCheckout(cartItems, details) {
  const amount = cartItems.reduce((sum, i) => sum + (i.unitPrice || 0) * (i.qty || 1), 0);
  const orderSnapshot = {
    email: details.email,
    name: details.name,
    phone: details.phone,
    user_id: details.userId || null,
    items: cartItems.map((i) => ({
      stall_id: i.stallId,
      item_id: i.id,
      name: i.name,
      qty: i.qty || 1,
      price: i.unitPrice,
    })),
    amount,
  };

  // ₹0 orders
  if (amount === 0) {
    const uid = `free-${crypto.randomUUID()}`;
    const res = await fetch('/api/save-foodfest-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tiqr_booking_uid: uid, order: orderSnapshot, free: true }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      throw new Error(data?.message || 'Could not place your free order. Please try again.');
    }
    return { free: true };
  }

  // Save foodfest pending order snapshot
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('foodfest_pending_order', JSON.stringify(orderSnapshot));
  }

  const checkoutItems = cartItems.map((item) => ({
    id: item.id,
    kind: 'food',
    title: item.name,
    qty: item.qty || 1,
    unitPrice: item.unitPrice,
  }));

  saveCheckoutSessionToStorage(checkoutItems, details);
  window.location.href = '/payment';
}
