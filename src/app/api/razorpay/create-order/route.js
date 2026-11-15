import { NextResponse } from 'next/server';
import {
  getRazorpayCredentials,
  createRazorpayOrder,
  PAYMENT_TIMEOUT_SECONDS,
} from '@/lib/razorpay';

/**
 * GET /api/razorpay/create-order
 * Returns the current Razorpay configuration status (Test Mode / Live Mode / Unconfigured)
 * and the public Key ID so the frontend Standard Checkout knows whether keys are ready.
 */
export async function GET() {
  const { keyId, configured, mode } = getRazorpayCredentials();
  return NextResponse.json({
    success: true,
    configured,
    mode,
    keyId: configured ? keyId : null,
  });
}

/**
 * POST /api/razorpay/create-order
 * Official Razorpay Step 1.2: Create an Order in Server using Razorpay Orders API.
 */
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));

    const {
      amount,
      currency = 'INR',
      receipt,
      notes = {},
      items = [],
      customer = {},
    } = body;

    // Resolve total amount in Rupees
    let amountInRupees = Number(amount);
    if (!Number.isFinite(amountInRupees) && Array.isArray(items) && items.length > 0) {
      amountInRupees = items.reduce((sum, item) => {
        const unit = Number(item.unitPrice ?? item.price ?? 0) || 0;
        const qty = Number(item.qty) || 1;
        return sum + unit * qty;
      }, 0);
    }

    if (!Number.isFinite(amountInRupees) || amountInRupees < 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid order amount.' },
        { status: 400 }
      );
    }

    // Handle ₹0 (free) passes without hitting Razorpay Orders API
    if (amountInRupees === 0) {
      const freeOrderId = `free_${Date.now()}`;
      return NextResponse.json({
        success: true,
        free: true,
        orderId: freeOrderId,
        id: freeOrderId,
        amount: 0,
        amountInRupees: 0,
        currency: 'INR',
        receipt: receipt || freeOrderId,
        status: 'paid',
      });
    }

    const { keyId, configured, mode } = getRazorpayCredentials();

    if (!configured) {
      return NextResponse.json(
        {
          success: false,
          code: 'KEYS_NOT_CONFIGURED',
          configured: false,
          mode: 'unconfigured',
          message:
            'Razorpay API keys (RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET) are still set to placeholder values in .env.local. Paste your Razorpay keys and restart the dev server.',
        },
        { status: 503 }
      );
    }

    const itemIds = Array.isArray(items)
      ? items.map((i) => i.id).filter(Boolean).join(',')
      : '';

    const nowMs = Date.now();
    const expiresAtMs = nowMs + PAYMENT_TIMEOUT_SECONDS * 1000;

    const mergedNotes = {
      fest: 'Dhanak 2027',
      email: customer.email || notes.email || '',
      name: customer.name || notes.name || '',
      phone: customer.phone || notes.phone || '',
      college: customer.college || notes.college || '',
      college_id: customer.college_id || notes.college_id || '',
      user_id: customer.userId || customer.user_id || notes.user_id || '',
      workshop_ids: notes.workshop_ids || itemIds,
      created_at_ms: String(nowMs),
      expires_at_ms: String(expiresAtMs),
      ...notes,
    };

    const order = await createRazorpayOrder({
      amountInRupees,
      currency,
      receipt: receipt || `dhn_ord_${nowMs}`,
      notes: mergedNotes,
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      id: order.id,
      amount: order.amount, // in paise (e.g. 49900 for ₹499)
      amountInRupees,
      currency: order.currency,
      receipt: order.receipt,
      status: order.status,
      keyId,
      mode,
      timeoutSeconds: PAYMENT_TIMEOUT_SECONDS,
      expiresAt: expiresAtMs,
    });
  } catch (error) {
    console.error('[razorpay/create-order] Error:', error);
    const errMsg =
      error?.error?.description ||
      error?.message ||
      'Unable to create Razorpay order.';
    return NextResponse.json(
      {
        success: false,
        code: error?.code || error?.error?.code || 'ORDER_CREATION_FAILED',
        message: errMsg,
      },
      { status: error?.statusCode || 500 }
    );
  }
}

