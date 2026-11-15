import { NextResponse } from 'next/server';
import {
  verifyRazorpayPaymentSignature,
  fetchRazorpayPayment,
  fetchRazorpayOrder,
  fetchRazorpayOrderPayments,
  captureRazorpayPayment,
} from '@/lib/razorpay';
import { createServerSupabase } from '../../_supabase-server';
import { getRegistrationCnsId } from '@/lib/guestCns';
import { findAuthUserIdByEmail } from '@/lib/registrationLookup';
import { addEventToUserRegistration, resolveMemberProfiles } from '@/lib/eventTeams';
import { resolveEventGroupSize } from '@/lib/groupSize';

/**
 * Reconciles an order directly with Razorpay servers when the 5-minute (300s)
 * payment window expires right as the user completes payment ("boundary race condition").
 * If a payment was captured (or authorized at the buzzer), it auto-captures if needed
 * and saves the registration to Supabase so the user never loses money without getting their pass.
 */
async function reconcileOrderAtBoundary(orderId, fallbackPayload = {}) {
  const cleanOrderId = String(orderId || '').trim();
  if (!cleanOrderId || cleanOrderId.startsWith('free_')) {
    return { verified: false, status: 'unpaid', message: 'No valid Razorpay Order ID to reconcile.' };
  }

  let orderObj = null;
  let payments = [];
  try {
    [orderObj, payments] = await Promise.all([
      fetchRazorpayOrder(cleanOrderId).catch(() => null),
      fetchRazorpayOrderPayments(cleanOrderId).catch(() => []),
    ]);
  } catch (err) {
    return { verified: false, status: 'error', message: err.message || 'Could not reach Razorpay server.' };
  }

  // Find a captured payment, or an authorized payment that arrived at the 5-minute mark
  let validPayment = payments.find((p) => p.status === 'captured');
  if (!validPayment) {
    const authorizedPayment = payments.find((p) => p.status === 'authorized');
    if (authorizedPayment) {
      try {
        validPayment = await captureRazorpayPayment(
          authorizedPayment.id,
          authorizedPayment.amount,
          authorizedPayment.currency || 'INR'
        );
      } catch {
        // If capture fails because it was already captured in parallel, re-fetch
        validPayment = await fetchRazorpayPayment(authorizedPayment.id).catch(() => authorizedPayment);
      }
    }
  }

  if (!validPayment || (validPayment.status !== 'captured' && validPayment.status !== 'authorized')) {
    return {
      verified: false,
      status: orderObj?.status || 'expired',
      orderId: cleanOrderId,
      message: 'No completed payment found within the 5-minute payment window. Order cancelled.',
    };
  }

  const verifiedAmountRupees =
    validPayment.amount != null
      ? Number(validPayment.amount) / 100
      : Number(orderObj?.amount || 0) / 100 || Number(fallbackPayload.amount) || 0;

  const paymentMethod = validPayment.method
    ? `Razorpay (${String(validPayment.method).toUpperCase()})`
    : 'Razorpay';

  const notes = {
    ...(orderObj?.notes || {}),
    ...(validPayment.notes || {}),
  };

  const email = (
    fallbackPayload.email ||
    fallbackPayload.details?.email ||
    notes.email ||
    validPayment.email ||
    ''
  )
    .trim()
    .toLowerCase();

  let registrationSaved = false;
  if (email) {
    registrationSaved = await upsertVerifiedRegistration({
      email,
      workshopIdsRaw: fallbackPayload.workshop_ids || notes.workshop_ids || '',
      incomingItems: Array.isArray(fallbackPayload.items) ? fallbackPayload.items : [],
      details: {
        name: fallbackPayload.details?.name || notes.name || '',
        phone: fallbackPayload.details?.phone || notes.phone || validPayment.contact || '',
        college: fallbackPayload.details?.college || notes.college || '',
        college_id: fallbackPayload.details?.college_id || notes.college_id || '',
        ...(fallbackPayload.details || {}),
        payment_method: paymentMethod,
        razorpay_order_id: cleanOrderId,
        razorpay_payment_id: validPayment.id,
        late_boundary_reconciled: true,
        reconciled_at: new Date().toISOString(),
      },
      userId:
        fallbackPayload.user_id ||
        fallbackPayload.details?.userId ||
        fallbackPayload.details?.user_id ||
        notes.user_id ||
        null,
      paymentId: validPayment.id,
      orderId: cleanOrderId,
      amount: verifiedAmountRupees,
      teams: fallbackPayload.teams || null,
    });
  }

  return {
    verified: true,
    confirmed: true,
    lateRecovered: true,
    status: 'confirmed',
    orderId: cleanOrderId,
    paymentId: validPayment.id,
    amount: verifiedAmountRupees,
    method: paymentMethod,
    email,
    registrationSaved,
    message: 'Payment completed at the 5-minute boundary was verified and your registration is confirmed!',
  };
}

/**
 * GET /api/razorpay/verify?order_id=...
 * Checks if an expired/timed-out order actually had a payment succeed right at the 5-minute mark.
 */
export async function GET(req) {
  try {
    const url = new URL(req.url);
    const orderId = (url.searchParams.get('order_id') || url.searchParams.get('orderId') || '').trim();
    if (!orderId) {
      return NextResponse.json(
        { success: false, verified: false, message: 'order_id query parameter is required.' },
        { status: 400 }
      );
    }
    const result = await reconcileOrderAtBoundary(orderId);
    return NextResponse.json({
      success: result.verified,
      ...result,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, verified: false, message: err.message || 'Error reconciling order status.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/razorpay/verify
 * Official Razorpay Step 1.4 & 1.5:
 * Verifies the cryptographic HMAC-SHA256 signature (`razorpay_order_id|razorpay_payment_id`)
 * using `RAZORPAY_KEY_SECRET`, fetches payment details from Razorpay, and records
 * the confirmed registration in Supabase.
 */
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));

    const razorpay_order_id = (
      body.razorpay_order_id ||
      body.order_id ||
      ''
    ).trim();
    const razorpay_payment_id = (
      body.razorpay_payment_id ||
      body.payment_id ||
      ''
    ).trim();
    const razorpay_signature = (
      body.razorpay_signature ||
      body.signature ||
      ''
    ).trim();

    // Boundary / 5-Minute Timeout Reconciliation Mode:
    // When the 5-minute timer expires on the frontend, the client calls with `reconcile: true`
    // and `order_id` to check if the user actually completed payment right at the 5:00 mark.
    if (body.reconcile && razorpay_order_id && (!razorpay_payment_id || !razorpay_signature)) {
      const recon = await reconcileOrderAtBoundary(razorpay_order_id, body);
      return NextResponse.json({
        success: recon.verified,
        ...recon,
      });
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          message:
            'Missing required Razorpay verification fields (razorpay_order_id, razorpay_payment_id, razorpay_signature).',
        },
        { status: 400 }
      );
    }

    // Step 1.5: Verify HMAC-SHA256 signature
    const isAuthentic = verifyRazorpayPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isAuthentic) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          message: 'Payment signature verification failed. Invalid signature.',
        },
        { status: 400 }
      );
    }

    // Step 1.6: Optionally fetch payment metadata from Razorpay (and auto-capture if authorized at boundary)
    let rzpPayment = null;
    try {
      rzpPayment = await fetchRazorpayPayment(razorpay_payment_id);
      if (rzpPayment?.status === 'authorized') {
        rzpPayment = await captureRazorpayPayment(
          razorpay_payment_id,
          rzpPayment.amount,
          rzpPayment.currency || 'INR'
        ).catch(() => rzpPayment);
      }
    } catch (fetchErr) {
      console.warn(
        '[razorpay/verify] Could not fetch payment metadata (signature already verified):',
        fetchErr.message
      );
    }

    const verifiedAmountRupees =
      rzpPayment?.amount != null
        ? Number(rzpPayment.amount) / 100
        : Number(body.amount) || 0;

    const paymentMethod = rzpPayment?.method
      ? `Razorpay (${String(rzpPayment.method).toUpperCase()})`
      : 'Razorpay';

    const notes = rzpPayment?.notes || {};
    const email = (
      body.email ||
      body.details?.email ||
      notes.email ||
      rzpPayment?.email ||
      ''
    )
      .trim()
      .toLowerCase();

    // If registration payload is provided, persist it to Supabase immediately
    let registrationSaved = false;
    if (email) {
      registrationSaved = await upsertVerifiedRegistration({
        email,
        workshopIdsRaw: body.workshop_ids || notes.workshop_ids || '',
        incomingItems: Array.isArray(body.items) ? body.items : [],
        details: {
          ...(body.details || {}),
          payment_method: paymentMethod,
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
        },
        userId:
          body.user_id ||
          body.details?.userId ||
          body.details?.user_id ||
          notes.user_id ||
          null,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        amount: verifiedAmountRupees,
        teams: body.teams || null,
      });
    }

    return NextResponse.json({
      success: true,
      verified: true,
      confirmed: true,
      status: 'confirmed',
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      amount: verifiedAmountRupees,
      method: paymentMethod,
      email,
      registrationSaved,
      message: 'Payment verified successfully.',
    });
  } catch (error) {
    console.error('[razorpay/verify] Error:', error);
    return NextResponse.json(
      {
        success: false,
        verified: false,
        message: error.message || 'Internal server error during verification.',
      },
      { status: 500 }
    );
  }
}

async function upsertVerifiedRegistration({
  email,
  workshopIdsRaw,
  incomingItems,
  details,
  userId,
  paymentId,
  orderId,
  amount,
  teams,
}) {
  const isConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('example.com')
  );

  if (!isConfigured) return false;

  try {
    const supabase = createServerSupabase();

    const { data: existingUser } = await supabase
      .from('registrations')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    const finalUserId =
      userId ||
      existingUser?.user_id ||
      (await findAuthUserIdByEmail(supabase, email));

    const existingIds = Array.isArray(existingUser?.workshop_ids)
      ? existingUser.workshop_ids
      : [];

    const incomingIds = Array.isArray(workshopIdsRaw)
      ? workshopIdsRaw
      : String(workshopIdsRaw)
          .split(',')
          .map((id) => id.trim())
          .filter(Boolean);

    const finalWorkshopIds = [...new Set([...existingIds, ...incomingIds])];

    const existingItemsPaid = Array.isArray(existingUser?.details?.items_paid)
      ? existingUser.details.items_paid
      : [];

    const seenBookingKeys = new Set(
      existingItemsPaid.map((i) => i.booking_uid).filter(Boolean)
    );
    const newItems = incomingItems.filter(
      (item) => !seenBookingKeys.has(`${paymentId}:${item.id}`)
    );

    const itemsWithKnownPrice = newItems.filter((i) => i.unitPrice != null);
    const itemsWithoutPrice = newItems.filter((i) => i.unitPrice == null);
    const knownTotal = itemsWithKnownPrice.reduce(
      (sum, i) => sum + Number(i.unitPrice) * (Number(i.qty) || 1),
      0
    );
    const remainder = Math.max(0, Number(amount) - knownTotal);
    const perUnknownShare = itemsWithoutPrice.length
      ? remainder / itemsWithoutPrice.length
      : 0;

    const DAY_TRACKED_IDS = new Set([
      'breakfast',
      'lunch',
      'dinner',
      'accommodation',
    ]);
    const newItemsPaid = newItems.map((item) => {
      const qty = Number(item.qty) || 1;
      const itemAmount =
        item.unitPrice != null
          ? Number(item.unitPrice) * qty
          : perUnknownShare;
      const dates = Array.isArray(item.dates) ? item.dates : [];
      return {
        internal_id: item.id,
        title: item.title || item.id,
        booking_uid: `${paymentId}:${item.id}`,
        qty,
        amount: itemAmount,
        dates,
        needs_day_selection:
          DAY_TRACKED_IDS.has(item.id) && dates.length === 0 && qty > 0,
        recorded_at: new Date().toISOString(),
      };
    });

    const addedAmount = newItemsPaid.reduce((sum, i) => sum + i.amount, 0);
    const alreadySamePayment = existingUser?.payment_id === paymentId;
    const finalAmount =
      (Number(existingUser?.amount) || 0) +
      (incomingItems.length > 0
        ? addedAmount
        : alreadySamePayment
          ? 0
          : Number(amount) || 0);

    const registrationDetails = {
      ...(existingUser?.details || {}),
      ...details,
    };

    if (newItemsPaid.length > 0) {
      registrationDetails.items_paid = [...existingItemsPaid, ...newItemsPaid];
    } else if (existingItemsPaid.length > 0) {
      registrationDetails.items_paid = existingItemsPaid;
    }

    registrationDetails.unique_code = await getRegistrationCnsId(supabase, {
      userId: finalUserId,
      existingCode:
        existingUser?.details?.unique_code || registrationDetails.unique_code,
    });

    const row = {
      email,
      user_id: finalUserId,
      workshop_ids: finalWorkshopIds,
      details: registrationDetails,
      payment_id: paymentId,
      order_id: orderId,
      amount: finalAmount,
      status: 'confirmed',
      payment_status: 'paid',
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('registrations')
      .upsert([row], { onConflict: 'email' });

    // Process team formations for group events (if provided during checkout)
    if (!error && teams && typeof teams === 'object') {
      try {
        const teamEntries = Array.isArray(teams)
          ? teams
          : Object.entries(teams).map(([eventId, val]) => ({ eventId, ...val }));

        for (const t of teamEntries) {
          const eventId = (t.eventId || '').trim();
          if (!eventId) continue;

          let leaderCode = (t.leaderCode || '').trim().toUpperCase();
          if (!leaderCode || leaderCode === 'YOU' || leaderCode === 'DHN-LEADER') {
            const { data: prof } = finalUserId
              ? await supabase
                  .from('profiles')
                  .select('unique_code')
                  .eq('user_id', finalUserId)
                  .maybeSingle()
              : { data: null };
            leaderCode = (prof?.unique_code || registrationDetails.unique_code || '').trim().toUpperCase();
          }

          if (!finalUserId || !leaderCode) {
            console.warn('[razorpay/verify] Skipping event_teams upsert (missing user_id or unique_code):', {
              eventId,
              hasUserId: Boolean(finalUserId),
              leaderCode,
            });
            continue;
          }

          const rawCodes = Array.isArray(t.memberCodes)
            ? t.memberCodes
            : Array.isArray(t.members)
              ? t.members.map((m) => (typeof m === 'string' ? m : m.code))
              : [];

          const allMemberCodes = [...new Set([leaderCode, ...rawCodes.map((c) => String(c || '').trim().toUpperCase())])].filter(Boolean);
          const { groupSize: requiredGroupSize } = await resolveEventGroupSize(supabase, eventId);
          const isTeamFull = allMemberCodes.length >= (Number(t.groupSize) || requiredGroupSize);

          const { error: teamUpsertError } = await supabase.from('event_teams').upsert(
            {
              event_id: eventId,
              leader_user_id: finalUserId,
              leader_unique_code: leaderCode,
              member_codes: allMemberCodes,
              confirmed: isTeamFull,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'event_id,leader_user_id' }
          );

          if (teamUpsertError) {
            console.warn('[razorpay/verify] event_teams upsert warning:', teamUpsertError.message);
          }

          // Add event to each teammate's registrations
          const nonLeaderCodes = allMemberCodes.filter((c) => c !== leaderCode);
          if (nonLeaderCodes.length > 0) {
            const { profiles: teammateProfiles } = await resolveMemberProfiles(
              supabase,
              nonLeaderCodes
            );
            for (const tp of teammateProfiles) {
              if (tp.user_id) {
                await addEventToUserRegistration(supabase, tp.user_id, eventId);
              }
            }
          }
        }
      } catch (teamErr) {
        console.warn(
          '[razorpay/verify] Error upserting event_teams:',
          teamErr.message
        );
      }
    }

    return !error;
  } catch (err) {
    console.warn('[razorpay/verify] Supabase save warning:', err.message);
    return false;
  }
}

