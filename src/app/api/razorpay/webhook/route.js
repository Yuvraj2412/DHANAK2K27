import { NextResponse } from 'next/server';
import { verifyRazorpayWebhookSignature } from '@/lib/razorpay';
import { createServerSupabase } from '../../_supabase-server';
import { getRegistrationCnsId } from '@/lib/guestCns';
import { findAuthUserIdByEmail } from '@/lib/registrationLookup';

/**
 * POST /api/razorpay/webhook
 * Official Razorpay Step 1.6: Asynchronous Webhook handler for `payment.captured` and `order.paid`.
 * Ensures registrations are recorded even if the user closes their browser before client verification.
 */
export async function POST(req) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature') || '';

    if (signature) {
      const valid = verifyRazorpayWebhookSignature({ rawBody, signature });
      if (!valid) {
        console.warn('[razorpay/webhook] Invalid webhook signature');
        return NextResponse.json(
          { received: false, message: 'Invalid webhook signature' },
          { status: 400 }
        );
      }
    }

    const payload = JSON.parse(rawBody || '{}');
    const event = String(payload.event || '');

    if (!['payment.captured', 'order.paid', 'payment.authorized'].includes(event)) {
      return NextResponse.json({
        received: true,
        ignored: true,
        event,
      });
    }

    const paymentEntity = payload?.payload?.payment?.entity || {};
    const orderEntity = payload?.payload?.order?.entity || {};

    const paymentId = paymentEntity.id || '';
    const orderId = paymentEntity.order_id || orderEntity.id || '';
    const amountPaise =
      paymentEntity.amount ?? orderEntity.amount_paid ?? orderEntity.amount ?? 0;
    const amountRupees = Number(amountPaise) / 100;

    const notes = {
      ...(orderEntity.notes || {}),
      ...(paymentEntity.notes || {}),
    };

    const email = (
      notes.email ||
      paymentEntity.email ||
      ''
    )
      .trim()
      .toLowerCase();

    if (!email || !paymentId) {
      return NextResponse.json({
        received: true,
        saved: false,
        reason: 'missing_email_or_payment_id',
      });
    }

    const workshopRaw = notes.workshop_ids || notes.internal_id || '';
    const workshopIds = Array.isArray(workshopRaw)
      ? workshopRaw
      : String(workshopRaw)
          .split(',')
          .map((id) => id.trim())
          .filter(Boolean);

    const supabase = createServerSupabase();

    const { data: existing } = await supabase
      .from('registrations')
      .select('workshop_ids, details, user_id, amount, payment_id')
      .eq('email', email)
      .maybeSingle();

    const existingIds = Array.isArray(existing?.workshop_ids)
      ? existing.workshop_ids
      : [];
    const finalWorkshopIds = [...new Set([...existingIds, ...workshopIds])];

    const existingDetails =
      existing?.details && typeof existing.details === 'object'
        ? existing.details
        : {};
    const existingItemsPaid = Array.isArray(existingDetails.items_paid)
      ? existingDetails.items_paid
      : [];

    const alreadyRecorded =
      existing?.payment_id === paymentId ||
      existingItemsPaid.some(
        (i) =>
          i.booking_uid === paymentId ||
          String(i.booking_uid || '').startsWith(`${paymentId}:`)
      );

    const perItemShare =
      workshopIds.length > 0 ? amountRupees / workshopIds.length : amountRupees;

    const newItemsPaid = alreadyRecorded
      ? existingItemsPaid
      : [
          ...existingItemsPaid,
          ...workshopIds.map((id) => ({
            internal_id: id,
            title: id,
            booking_uid: `${paymentId}:${id}`,
            booking_id: orderId,
            qty: 1,
            amount: perItemShare,
            dates: [],
            needs_day_selection: [
              'breakfast',
              'lunch',
              'dinner',
              'accommodation',
            ].includes(id),
            recorded_at: new Date().toISOString(),
          })),
        ];

    const finalAmount = alreadyRecorded
      ? Number(existing?.amount) || amountRupees
      : (Number(existing?.amount) || 0) + amountRupees;

    const finalUserId =
      notes.user_id ||
      existing?.user_id ||
      (await findAuthUserIdByEmail(supabase, email));

    const details = {
      ...existingDetails,
      ...notes,
      items_paid: newItemsPaid,
      razorpay_payment_id: paymentId,
      razorpay_order_id: orderId,
      payment_method: paymentEntity.method
        ? `Razorpay (${String(paymentEntity.method).toUpperCase()})`
        : 'Razorpay',
      name: notes.name || existingDetails.name || '',
      phone:
        notes.phone || paymentEntity.contact || existingDetails.phone || '',
    };

    details.unique_code = await getRegistrationCnsId(supabase, {
      userId: finalUserId,
      existingCode: existingDetails.unique_code || notes.unique_code,
    });

    const { error } = await supabase.from('registrations').upsert(
      [
        {
          email,
          user_id: finalUserId,
          workshop_ids: finalWorkshopIds,
          details,
          payment_id: paymentId,
          order_id: orderId,
          amount: finalAmount,
          status: 'confirmed',
          payment_status: 'paid',
          updated_at: new Date().toISOString(),
        },
      ],
      { onConflict: 'email' }
    );

    if (error) {
      console.error('[razorpay/webhook] Supabase upsert error:', error);
      return NextResponse.json(
        { received: true, saved: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      received: true,
      saved: true,
      email,
      paymentId,
      orderId,
      workshopIds: finalWorkshopIds,
    });
  } catch (err) {
    console.error('[razorpay/webhook] Error:', err);
    return NextResponse.json(
      { received: false, message: err.message },
      { status: 500 }
    );
  }
}

