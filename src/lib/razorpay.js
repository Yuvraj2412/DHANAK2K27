import Razorpay from 'razorpay';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

function readEnvLocal() {
  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) return {};
    const content = fs.readFileSync(envPath, 'utf8');
    const parsed = {};
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq > 0) {
        const k = line.slice(0, eq).trim();
        let v = line.slice(eq + 1).trim();
        if (
          (v.startsWith('"') && v.endsWith('"')) ||
          (v.startsWith("'") && v.endsWith("'"))
        ) {
          v = v.slice(1, -1);
        }
        parsed[k] = v;
      }
    }
    return parsed;
  } catch {
    return {};
  }
}

/**
 * Reads Razorpay credentials from environment variables and disk file,
 * and reports whether real keys (test or live) have been configured.
 */
export function getRazorpayCredentials() {
  const fileVars = readEnvLocal();

  let keyId = (
    fileVars.RAZORPAY_KEY_ID ||
    process.env.RAZORPAY_KEY_ID ||
    fileVars.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
    ''
  ).trim();

  let keySecret = (
    fileVars.RAZORPAY_KEY_SECRET ||
    process.env.RAZORPAY_KEY_SECRET ||
    ''
  ).trim();

  const webhookSecret = (
    fileVars.RAZORPAY_WEBHOOK_SECRET ||
    process.env.RAZORPAY_WEBHOOK_SECRET ||
    ''
  ).trim();

  // Strip accidental placeholder prefix if user pasted directly adjacent to it
  if (keySecret.startsWith('placeholder_secret') && keySecret.length > 'placeholder_secret'.length) {
    keySecret = keySecret.replace(/^placeholder_secret/, '').trim();
  }
  if (keyId.startsWith('rzp_test_placeholder') && keyId.length > 'rzp_test_placeholder'.length) {
    keyId = keyId.replace(/^rzp_test_placeholder/, '').trim();
  }

  const isPlaceholder = (val) =>
    !val ||
    val.toLowerCase() === 'placeholder' ||
    val.toLowerCase() === 'placeholder_secret' ||
    val === 'rzp_test_placeholder' ||
    val === 'your_key_id' ||
    val === 'your_key_secret';

  const configured = !isPlaceholder(keyId) && !isPlaceholder(keySecret);
  const mode = !configured
    ? 'unconfigured'
    : keyId.startsWith('rzp_live_')
      ? 'live'
      : 'test';

  if (configured) {
    process.env.RAZORPAY_KEY_ID = keyId;
    process.env.RAZORPAY_KEY_SECRET = keySecret;
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = keyId;
  }

  return {
    keyId,
    keySecret,
    webhookSecret,
    configured,
    mode,
  };
}

/**
 * Initializes the official Razorpay Node.js SDK instance.
 * Throws a descriptive error if API keys have not been pasted yet.
 */
export function getRazorpayClient() {
  const { keyId, keySecret, configured } = getRazorpayCredentials();

  if (!configured) {
    const err = new Error(
      'Razorpay API keys are not configured yet. Please paste your RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.local.'
    );
    err.code = 'KEYS_NOT_CONFIGURED';
    throw err;
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

/**
 * Razorpay limits `notes` to at most 15 key-value pairs, each max 256 characters.
 */
export function sanitizeRazorpayNotes(notes = {}) {
  if (!notes || typeof notes !== 'object') return {};
  const out = {};
  const entries = Object.entries(notes).slice(0, 15);
  for (const [rawKey, rawVal] of entries) {
    if (rawVal === undefined || rawVal === null) continue;
    const key = String(rawKey).slice(0, 64);
    const strVal =
      typeof rawVal === 'string' ? rawVal : JSON.stringify(rawVal);
    out[key] = strVal.slice(0, 250);
  }
  return out;
}

/**
 * Step 1.2 (Official Razorpay Web Integration): Create an Order on the server.
 *
 * @param {object} params
 * @param {number} params.amountInRupees - Total payable amount in INR (Rupees)
 * @param {string} [params.currency='INR'] - ISO currency code
 * @param {string} [params.receipt] - Unique receipt identifier (max 40 chars)
 * @param {object} [params.notes] - Metadata key-value pairs stored on the Razorpay order
 */
export async function createRazorpayOrder({
  amountInRupees,
  currency = 'INR',
  receipt,
  notes = {},
}) {
  const razorpay = getRazorpayClient();

  // Razorpay expects amount in the smallest currency subunit (paise for INR: ₹1 = 100 paise)
  const amountInPaise = Math.round(Number(amountInRupees) * 100);
  if (!Number.isFinite(amountInPaise) || amountInPaise < 100) {
    throw new Error('Order amount must be at least ₹1.00 (100 paise).');
  }

  const safeReceipt = String(receipt || `dhn_rcpt_${Date.now()}`).slice(0, 40);

  const options = {
    amount: amountInPaise,
    currency: String(currency || 'INR').toUpperCase(),
    receipt: safeReceipt,
    notes: sanitizeRazorpayNotes(notes),
  };

  const order = await razorpay.orders.create(options);
  return order;
}

/**
 * Step 1.5 (Official Razorpay Web Integration): Verify Payment Signature on the server.
 * Formula: hmac_sha256(razorpay_order_id + "|" + razorpay_payment_id, key_secret)
 */
export function verifyRazorpayPaymentSignature({
  orderId,
  paymentId,
  signature,
}) {
  const { keySecret, configured } = getRazorpayCredentials();
  if (!configured || !orderId || !paymentId || !signature) {
    return false;
  }

  const payload = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(payload)
    .digest('hex');

  try {
    const expectedBuf = Buffer.from(expectedSignature, 'utf8');
    const receivedBuf = Buffer.from(String(signature).trim(), 'utf8');
    if (expectedBuf.length !== receivedBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, receivedBuf);
  } catch {
    return false;
  }
}

/**
 * Step 1.6 (Official Razorpay Webhook Verification): Verify `x-razorpay-signature` header.
 */
export function verifyRazorpayWebhookSignature({ rawBody, signature }) {
  const { webhookSecret, keySecret, configured } = getRazorpayCredentials();
  const secretToUse = webhookSecret || keySecret;
  if ((!configured && !webhookSecret) || !secretToUse || !rawBody || !signature) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', secretToUse)
    .update(rawBody)
    .digest('hex');

  try {
    const expectedBuf = Buffer.from(expectedSignature, 'utf8');
    const receivedBuf = Buffer.from(String(signature).trim(), 'utf8');
    if (expectedBuf.length !== receivedBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, receivedBuf);
  } catch {
    return false;
  }
}

/**
 * Step 1.6: Fetch payment details directly from Razorpay server.
 */
export async function fetchRazorpayPayment(paymentId) {
  const razorpay = getRazorpayClient();
  return razorpay.payments.fetch(paymentId);
}

/**
 * Step 1.6: Fetch order details directly from Razorpay server.
 */
export async function fetchRazorpayOrder(orderId) {
  const razorpay = getRazorpayClient();
  return razorpay.orders.fetch(orderId);
}

/**
 * Default 5-minute (300-second) payment window before order timeout.
 */
export const PAYMENT_TIMEOUT_SECONDS = 300;

/**
 * Fetches all payment attempts associated with a Razorpay order ID.
 * Used to reconcile boundary/late payments that arrive right as the 5-minute timer ends.
 */
export async function fetchRazorpayOrderPayments(orderId) {
  const razorpay = getRazorpayClient();
  const res = await razorpay.orders.fetchPayments(orderId);
  return Array.isArray(res?.items) ? res.items : [];
}

/**
 * Captures an authorized payment if it arrived at the 5-minute boundary in `authorized` state.
 */
export async function captureRazorpayPayment(paymentId, amountInPaise, currency = 'INR') {
  const razorpay = getRazorpayClient();
  return razorpay.payments.capture(paymentId, amountInPaise, currency);
}


