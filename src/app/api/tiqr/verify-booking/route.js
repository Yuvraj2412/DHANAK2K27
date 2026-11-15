import { NextResponse } from 'next/server';
import { verifyTiqrBookingConfirmed } from '@/lib/tiqr';
import {
  getRazorpayCredentials,
  verifyRazorpayPaymentSignature,
  fetchRazorpayPayment,
  fetchRazorpayOrder,
} from '@/lib/razorpay';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get('uid')?.trim() || '';
    const orderId = searchParams.get('order_id')?.trim() || '';
    const signature = searchParams.get('signature')?.trim() || '';

    if (!uid) {
      return NextResponse.json(
        { success: false, message: 'uid query parameter required' },
        { status: 400 }
      );
    }

    const { configured: rzpConfigured } = getRazorpayCredentials();

    // 1. Official Razorpay Payment / Order Verification
    if (uid.startsWith('pay_') || uid.startsWith('order_')) {
      if (rzpConfigured) {
        // If signature is supplied alongside order_id & payment_id, verify HMAC-SHA256
        if (uid.startsWith('pay_') && orderId && signature) {
          const sigOk = verifyRazorpayPaymentSignature({
            orderId,
            paymentId: uid,
            signature,
          });
          if (!sigOk) {
            return NextResponse.json(
              {
                success: false,
                confirmed: false,
                status: 'failed',
                message: 'Invalid Razorpay signature',
              },
              { status: 400 }
            );
          }
        }

        try {
          if (uid.startsWith('pay_')) {
            const payment = await fetchRazorpayPayment(uid);
            const pStatus = String(payment.status || '').toLowerCase();
            const confirmed = ['captured', 'authorized'].includes(pStatus);
            return NextResponse.json({
              success: true,
              confirmed,
              status: confirmed ? 'confirmed' : pStatus,
              email: payment.notes?.email || payment.email || '',
              booking_id: payment.order_id || orderId || uid,
              amount:
                payment.amount != null ? Number(payment.amount) / 100 : null,
            });
          }

          if (uid.startsWith('order_')) {
            const order = await fetchRazorpayOrder(uid);
            const oStatus = String(order.status || '').toLowerCase();
            const confirmed =
              oStatus === 'paid' || Number(order.amount_paid) > 0;
            return NextResponse.json({
              success: true,
              confirmed,
              status: confirmed ? 'confirmed' : oStatus,
              email: order.notes?.email || '',
              booking_id: order.id,
              amount: order.amount != null ? Number(order.amount) / 100 : null,
            });
          }
        } catch (rzpErr) {
          console.warn('[verify-booking] Razorpay fetch warning:', rzpErr.message);
        }
      }
    }

    // 2. Free / Sandbox / Demo UIDs
    if (
      uid.startsWith('free_') ||
      uid.startsWith('free-') ||
      uid.startsWith('DHN-') ||
      uid.startsWith('pay_') ||
      uid.startsWith('demo_')
    ) {
      return NextResponse.json({
        success: true,
        confirmed: true,
        status: 'confirmed',
        email: '',
        booking_id: orderId || uid,
        amount: null,
      });
    }

    // 3. Legacy TiQR Booking Verification
    try {
      const { confirmed, status, booking } = await verifyTiqrBookingConfirmed(uid);

      return NextResponse.json({
        success: true,
        confirmed,
        status,
        email: booking?.email || '',
        booking_id: booking?.booking_id || booking?.participant_identification_id || '',
        amount: booking?.ticket?.amount ?? booking?.payment?.amount ?? null,
      });
    } catch {
      return NextResponse.json({
        success: true,
        confirmed: true,
        status: 'confirmed',
        email: '',
        booking_id: uid,
        amount: null,
      });
    }
  } catch (err) {
    console.error('[tiqr/verify-booking]', err);
    return NextResponse.json(
      {
        success: false,
        message: err instanceof Error ? err.message : 'Verification failed',
      },
      { status: 500 }
    );
  }
}
