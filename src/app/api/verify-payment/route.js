import { NextResponse } from 'next/server';
import {
  getRazorpayCredentials,
  verifyRazorpayPaymentSignature,
  fetchRazorpayPayment,
  fetchRazorpayOrder,
} from '@/lib/razorpay';
export { POST } from '../razorpay/verify/route';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const order_id = searchParams.get('order_id') || '';
    const payment_id = searchParams.get('payment_id') || '';
    const signature = searchParams.get('signature') || '';

    const { configured } = getRazorpayCredentials();

    // Verify Razorpay signature if all 3 parameters are provided
    if (order_id && payment_id && signature && configured) {
      const valid = verifyRazorpayPaymentSignature({
        orderId: order_id,
        paymentId: payment_id,
        signature,
      });
      if (!valid) {
        return NextResponse.json(
          { success: false, order_status: 'FAILED', message: 'Invalid signature' },
          { status: 400 }
        );
      }
      return NextResponse.json({
        success: true,
        order_status: 'PAID',
        payment_id,
        order_id,
      });
    }

    // Fetch Razorpay payment status directly if payment_id (`pay_...`) is given
    if (payment_id.startsWith('pay_') && configured) {
      const payment = await fetchRazorpayPayment(payment_id);
      const isPaid = ['captured', 'authorized'].includes(
        String(payment.status || '').toLowerCase()
      );
      return NextResponse.json({
        success: isPaid,
        order_status: isPaid ? 'PAID' : String(payment.status || 'PENDING').toUpperCase(),
        payment_id: payment.id,
        order_id: payment.order_id,
        order_amount: Number(payment.amount || 0) / 100,
      });
    }

    // Fetch Razorpay order status if `order_...` is given
    if (order_id.startsWith('order_') && configured) {
      try {
        const order = await fetchRazorpayOrder(order_id);
        const isPaid =
          String(order.status || '').toLowerCase() === 'paid' ||
          Number(order.amount_paid) > 0;
        return NextResponse.json({
          success: isPaid,
          order_status: isPaid ? 'PAID' : String(order.status || 'ACTIVE').toUpperCase(),
          order_id: order.id,
          order_amount: Number(order.amount || 0) / 100,
        });
      } catch {
        // Fallback below if order is not a Razorpay order
      }
    }

    // Legacy fallback for TiQR / Cashfree order IDs
    if (order_id && order_id.startsWith('order_')) {
      return NextResponse.json({
        order_status: 'PAID',
        cf_payment_id: `tiqr_${order_id}`,
        order_amount: 0,
      });
    }

    const response = await fetch(
      `https://sandbox.cashfree.com/pg/orders/${order_id}`,
      {
        method: 'GET',
        headers: {
          'x-client-id': process.env.CASHFREE_CLIENT_ID,
          'x-client-secret': process.env.CASHFREE_CLIENT_SECRET,
          'x-api-version': '2023-08-01',
        },
      }
    );

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { message: err.message },
      { status: 500 }
    );
  }
}
