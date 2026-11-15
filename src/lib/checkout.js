// Shared checkout helper for Razorpay Standard Checkout & legacy TiQR fallback.

// Single-use keys written during checkout and consumed once by /payment-success
export const CHECKOUT_STORAGE_KEYS = [
  'registration_email',
  'selected_workshops',
  'selected_workshops_meta',
  'registration_details',
  'dhanak_draft_teams',
  'tiqr_booking_uid',
  'razorpay_order_id',
  'razorpay_payment_id',
  'razorpay_signature',
];

const RAZORPAY_CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

/**
 * Official Razorpay Step 1.3: Load `https://checkout.razorpay.com/v1/checkout.js`
 * dynamically on the client and resolve `true` once `window.Razorpay` is ready.
 */
export function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }
    if (typeof window.Razorpay === 'function') {
      resolve(true);
      return;
    }

    const existing = document.querySelector(
      `script[src="${RAZORPAY_CHECKOUT_SRC}"]`
    );
    if (existing) {
      existing.addEventListener('load', () => resolve(true), { once: true });
      existing.addEventListener('error', () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = RAZORPAY_CHECKOUT_SRC;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Persists checkout items & registrant details to localStorage so `/payment`
 * and `/payment-success` have the exact cart line breakdown.
 */
export function saveCheckoutSessionToStorage(cartItems, details, teams = null) {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem('registration_email', details.email || '');
  window.localStorage.setItem(
    'selected_workshops',
    JSON.stringify(cartItems.map((i) => i.id))
  );
  window.localStorage.setItem(
    'selected_workshops_meta',
    JSON.stringify(
      cartItems.map((i) => ({
        id: i.id,
        kind: i.kind,
        title: i.title || '',
        subtitle: i.subtitle || '',
        qty: i.qty || 1,
        unitPrice: i.unitPrice ?? null,
        dates: i.details?.dates || i.dates || [],
        groupSize: i.groupSize || 1,
      }))
    )
  );
  window.localStorage.setItem('registration_details', JSON.stringify(details));
  if (teams && typeof teams === 'object') {
    window.localStorage.setItem('dhanak_draft_teams', JSON.stringify(teams));
  }
}

/**
 * Saves checkout session and navigates to the Razorpay Standard Checkout page (`/payment`).
 */
export async function startRazorpayCheckout(cartItems, details, teams = null) {
  saveCheckoutSessionToStorage(cartItems, details, teams);
  window.location.href = '/payment';
}

/**
 * TiQR puts the checkout link in different places for single vs bulk responses.
 * @param {object} data
 * @param {string[]} [excludeUrls]
 */
export function pickTiqrPaymentUrl(data, excludeUrls = []) {
  if (!data || typeof data !== 'object') return '';

  const ok = (u) =>
    typeof u === 'string' &&
    (u.startsWith('https://') || u.startsWith('http://')) &&
    u.length > 10;

  const candidates = [
    data.url_to_redirect,
    data.urlToRedirect,
    data.redirect_url,
    data.payment_url,
    data.checkout_url,
    data.pay_url,
    data.payment?.url_to_redirect,
    data.payment?.payment_url,
    data.payment?.url,
    data.booking?.payment?.url_to_redirect,
    data.booking?.payment_url,
  ];

  for (const u of candidates) {
    if (ok(u)) return u;
  }

  if (Array.isArray(data.bookings)) {
    for (const b of data.bookings) {
      const u =
        b?.payment?.url_to_redirect || b?.payment_url || b?.url_to_redirect;
      if (ok(u)) return u;
    }
  }

  const urlKeyPattern = /url|link|redirect/i;
  const callbackKeyPattern = /callback/i;
  const seen = new Set();
  const stack = [data];
  while (stack.length) {
    const node = stack.pop();
    if (!node || typeof node !== 'object' || seen.has(node)) continue;
    seen.add(node);
    for (const [key, value] of Object.entries(node)) {
      if (
        typeof value === 'string' &&
        urlKeyPattern.test(key) &&
        !callbackKeyPattern.test(key) &&
        !excludeUrls.includes(value) &&
        ok(value)
      ) {
        return value;
      }
      if (value && typeof value === 'object') stack.push(value);
    }
  }

  return '';
}

/**
 * Legacy TiQR helper kept for compatibility; falls back to Razorpay Standard Checkout.
 */
export async function startTiqrCheckout(cartItems, details) {
  return startRazorpayCheckout(cartItems, details);
}
