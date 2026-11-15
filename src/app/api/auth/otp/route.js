import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServerSupabase } from '../../_supabase-server';

const OTP_SECRET =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_KEY ||
  'dhanak-2026-iist-otp-secret-key';

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes

function normalizeIndianPhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }
  return digits;
}

function signOtpToken(phone, otp, expiresAt) {
  const payload = `${phone}:${otp}:${expiresAt}`;
  const sig = crypto.createHmac('sha256', OTP_SECRET).update(payload).digest('hex');
  return `${expiresAt}.${sig}`;
}

function verifyOtpToken(phone, otp, token) {
  if (!token || ! token.includes('.')) return { valid: false, reason: 'Invalid verification token.' };
  const [expiresStr, providedSig] = token.split('.');
  const expiresAt = Number(expiresStr);
  if (!expiresAt || Date.now() > expiresAt) {
    return { valid: false, reason: 'OTP has expired. Please request a new code.' };
  }
  const expectedToken = signOtpToken(phone, String(otp).trim(), expiresAt);
  const expectedSig = expectedToken.split('.')[1];

  if (providedSig.length !== expectedSig.length) {
    return { valid: false, reason: 'Incorrect OTP code.' };
  }
  const match = crypto.timingSafeEqual(Buffer.from(providedSig), Buffer.from(expectedSig));
  return match ? { valid: true } : { valid: false, reason: 'Incorrect 6-digit OTP code.' };
}

async function dispatchRealSms(phone10, otp) {
  // 1. Fast2SMS (Popular Indian SMS Gateway)
  const fast2smsKey = process.env.FAST2SMS_API_KEY;
  if (fast2smsKey) {
    try {
      const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          authorization: fast2smsKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'q',
          message: `Your Dhanak 2026 (IIST) verification OTP is ${otp}. Valid for 5 minutes. Do not share this code.`,
          language: 'english',
          flash: 0,
          numbers: phone10,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.return) {
        return { sentVia: 'fast2sms', delivered: true };
      }
    } catch (err) {
      console.warn('[OTP] Fast2SMS error:', err.message);
    }
  }

  // 2. Twilio SMS Gateway
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER;
  if (twilioSid && twilioToken && twilioFrom) {
    try {
      const params = new URLSearchParams({
        To: `+91${phone10}`,
        From: twilioFrom,
        Body: `Your Dhanak 2026 (IIST) verification OTP is ${otp}. Valid for 5 minutes.`,
      });
      const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        }
      );
      if (res.ok) {
        return { sentVia: 'twilio', delivered: true };
      }
    } catch (err) {
      console.warn('[OTP] Twilio error:', err.message);
    }
  }

  // 3. Supabase Native Phone Auth (if enabled in Supabase Dashboard)
  if (process.env.SUPABASE_PHONE_AUTH_ENABLED === 'true') {
    const supabase = createServerSupabase();
    if (supabase) {
      try {
        const { error } = await supabase.auth.signInWithOtp({
          phone: `+91${phone10}`,
        });
        if (!error) {
          return { sentVia: 'supabase_sms', delivered: true };
        }
      } catch {
        // fallback
      }
    }
  }

  return { sentVia: 'sandbox', delivered: false };
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action, phone, otp, token, createSession } = body;

    const cleanPhone = normalizeIndianPhone(phone);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      return NextResponse.json(
        { error: 'Please enter a valid 10-digit Indian mobile number.' },
        { status: 400 }
      );
    }

    // ACTION 1: SEND OTP
    if (action === 'send') {
      const generatedOtp = String(crypto.randomInt(100000, 999999));
      const expiresAt = Date.now() + OTP_TTL_MS;
      const signedToken = signOtpToken(cleanPhone, generatedOtp, expiresAt);

      const smsResult = await dispatchRealSms(cleanPhone, generatedOtp);

      return NextResponse.json({
        ok: true,
        phone: cleanPhone,
        maskedPhone: `+91 ••••••${cleanPhone.slice(-4)}`,
        token: signedToken,
        sentVia: smsResult.sentVia,
        // If no external SMS gateway key is configured yet, return sandboxOtp so the user can test immediately
        sandboxOtp: smsResult.delivered ? undefined : generatedOtp,
      });
    }

    // ACTION 2: VERIFY OTP
    if (action === 'verify') {
      const cleanOtp = String(otp || '').trim();
      if (!/^\d{6}$/.test(cleanOtp)) {
        return NextResponse.json(
          { error: 'Please enter the 6-digit OTP code.' },
          { status: 400 }
        );
      }

      const check = verifyOtpToken(cleanPhone, cleanOtp, token);
      if (!check.valid) {
        return NextResponse.json({ error: check.reason }, { status: 400 });
      }

      // If requested from the Login page, find or create an authenticated user account for this phone number
      if (createSession) {
        const supabase = createServerSupabase();
        const syntheticEmail = `${cleanPhone}@mobile.dhanak.iist.ac.in`;

        if (supabase) {
          try {
            // Check if a profile with this phone already exists
            const { data: existingProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('phone', cleanPhone)
              .maybeSingle();

            const userEmail = existingProfile?.email || syntheticEmail;
            const userId = existingProfile?.id || crypto.randomUUID();

            const sessionUser = {
              id: userId,
              email: userEmail,
              phone: `+91${cleanPhone}`,
              user_metadata: {
                name: existingProfile?.name || '',
                phone: cleanPhone,
                phone_verified: true,
              },
              aud: 'authenticated',
              role: 'authenticated',
            };

            return NextResponse.json({
              ok: true,
              verified: true,
              phone: cleanPhone,
              user: sessionUser,
            });
          } catch {
            // fallback below
          }
        }

        const fallbackUser = {
          id: `dhanak_mobile_${cleanPhone.slice(-6)}`,
          email: syntheticEmail,
          phone: `+91${cleanPhone}`,
          user_metadata: {
            phone: cleanPhone,
            phone_verified: true,
          },
          aud: 'authenticated',
          role: 'authenticated',
        };

        return NextResponse.json({
          ok: true,
          verified: true,
          phone: cleanPhone,
          user: fallbackUser,
        });
      }

      return NextResponse.json({
        ok: true,
        verified: true,
        phone: cleanPhone,
      });
    }

    return NextResponse.json({ error: 'Invalid OTP action.' }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'Failed to process OTP request.' },
      { status: 500 }
    );
  }
}
