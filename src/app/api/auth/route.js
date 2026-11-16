import { NextResponse } from 'next/server';
import dns from 'node:dns/promises';
import { createClient } from '@supabase/supabase-js';
import { generateUniqueCode } from '@/lib/uniqueCode';
import {
  isMailerConfigured,
  sendDhanakVerificationEmail,
  sendDhanakPasswordResetEmail,
} from '@/lib/dhanakMailer';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const isConfigured = Boolean(
  supabaseUrl &&
  anonKey &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseUrl.includes('example.com')
);

const hasValidServiceRoleKey = Boolean(
  isConfigured &&
  serviceKey &&
  !serviceKey.startsWith('sb_publishable_') &&
  serviceKey !== anonKey &&
  !serviceKey.includes('placeholder') &&
  !serviceKey.includes('your-service-role-key')
);

const anonClient = isConfigured
  ? createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

function createStatelessAnonClient() {
  if (!isConfigured) return null;
  return createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function adminClient() {
  if (!hasValidServiceRoleKey) return null;
  try {
    return createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  } catch {
    return null;
  }
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function hasValidMailDomain(email) {
  const domain = String(email.split('@')[1] || '').trim().toLowerCase();
  if (!domain || !domain.includes('.')) return false;
  try {
    const mxRecords = await Promise.race([
      dns.resolveMx(domain),
      new Promise((_, reject) => setTimeout(() => reject(new Error('dns_timeout')), 3000)),
    ]);
    return Array.isArray(mxRecords) && mxRecords.length > 0 && mxRecords.some((r) => r.exchange);
  } catch (err) {
    if (err?.message === 'dns_timeout') {
      // Do not block legitimate domains if DNS resolver times out momentarily
      return true;
    }
    return false;
  }
}

async function ensureProfileRow(userId, email, accessToken) {
  if (!userId || !email) return;
  const admin = adminClient();
  if (admin) {
    try {
      const { data: existing } = await admin
        .from('profiles')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle();
      if (!existing) {
        await admin.from('profiles').upsert(
          {
            user_id: userId,
            email,
            unique_code: generateUniqueCode(),
          },
          { onConflict: 'user_id' }
        );
      }
      return;
    } catch (err) {
      console.warn('[api/auth] Admin profile check warning:', err.message);
    }
  }

  if (accessToken && isConfigured) {
    try {
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: `Bearer ${accessToken}` } },
      });
      const { data: existingProfile } = await userClient
        .from('profiles')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!existingProfile) {
        await userClient.from('profiles').upsert(
          {
            user_id: userId,
            email,
            unique_code: generateUniqueCode(),
          },
          { onConflict: 'user_id' }
        );
      }
    } catch (syncErr) {
      console.warn('[api/auth] Profile check warning:', syncErr.message);
    }
  }
}

async function findExistingAuthUserByEmail(admin, email) {
  if (!admin) return null;
  try {
    let page = 1;
    const perPage = 200;
    for (let i = 0; i < 5; i += 1) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
      if (error || !data?.users?.length) break;
      const match = data.users.find((u) => (u.email || '').toLowerCase() === email);
      if (match) return match;
      if (data.users.length < perPage) break;
      page += 1;
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Authentication endpoint supporting:
 * 1. Sign In (`mode === 'login'`) - requires verified email
 * 2. Create Account (`mode === 'create'`) - sends verification email (OTP + link)
 * 3. Verify Email OTP (`mode === 'verify-otp'`) - verifies email verification OTP
 * 4. Resend Verification Email (`mode === 'resend'`) - resends confirmation email
 * 5. Forgot Password (`mode === 'forgot-password'`) - sends password reset OTP email
 * 6. Reset Password (`mode === 'reset-password'`) - verifies reset OTP & updates password
 */
async function trySendCustomVerificationEmail({ admin, email, type, password, origin }) {
  if (!admin || !isMailerConfigured()) return null;
  try {
    const cleanOrigin = origin.replace(/\/$/, '');
    const linkParams = type === 'signup' ? { type, email, password } : { type, email };
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink(linkParams);
    if (linkErr || !linkData?.properties?.hashed_token) return null;

    const verifyUrl = `${cleanOrigin}/login?token_hash=${encodeURIComponent(
      linkData.properties.hashed_token
    )}&type=${encodeURIComponent(type)}&redirect=${encodeURIComponent('/profile')}`;

    await sendDhanakVerificationEmail({
      to: email,
      otp: linkData.properties.email_otp,
      verifyUrl,
      siteUrl: cleanOrigin,
    });

    return {
      hasOtp: Boolean(linkData.properties.email_otp),
    };
  } catch (smtpErr) {
    console.warn(`[api/auth] Custom verification mailer (${type}) warning:`, smtpErr.message);
    return null;
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password, newPassword, mode, otp } = body;
    const trimmedEmail = String(email || '').trim().toLowerCase();
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const cleanOrigin = origin.replace(/\/$/, '');
    const emailRedirectTo = `${cleanOrigin}/login?verified=1&redirect=${encodeURIComponent('/profile')}`;

    if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    if (!isConfigured || !anonClient) {
      return NextResponse.json(
        { error: 'Authentication service is not configured.' },
        { status: 503 }
      );
    }

    // 1. Forgot Password — send password reset OTP email
    if (mode === 'forgot-password') {
      const domainOk = await hasValidMailDomain(trimmedEmail);
      if (!domainOk) {
        return NextResponse.json(
          { error: 'This email domain does not exist or cannot receive emails. Please use a valid email address.' },
          { status: 400 }
        );
      }

      const admin = adminClient();
      if (admin) {
        const existingUser = await findExistingAuthUserByEmail(admin, trimmedEmail);
        if (!existingUser) {
          return NextResponse.json(
            { error: 'No account found with this email address. Please check the email or create an account first.' },
            { status: 404 }
          );
        }

        if (isMailerConfigured()) {
          try {
            const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
              type: 'recovery',
              email: trimmedEmail,
            });
            if (!linkErr && linkData?.properties?.email_otp) {
              await sendDhanakPasswordResetEmail({
                to: trimmedEmail,
                otp: linkData.properties.email_otp,
                siteUrl: cleanOrigin,
              });
              return NextResponse.json({
                ok: true,
                requiresResetOtp: true,
                sender: 'dhanak',
                email: trimmedEmail,
                message:
                  'A password reset OTP has been sent to your email. Check your inbox (and spam folder).',
              });
            }
          } catch (smtpErr) {
            console.warn('[api/auth] Custom password reset mailer warning:', smtpErr.message);
          }
        }
      }

      const { error: resetErr } = await anonClient.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: `${cleanOrigin}/login?redirect=${encodeURIComponent('/profile')}`,
      });

      if (resetErr) {
        const msg = resetErr.message || '';
        if (/rate limit|over_email_send_rate_limit/i.test(msg)) {
          return NextResponse.json(
            { error: 'Too many password reset requests recently. Please wait a minute and try again.' },
            { status: 429 }
          );
        }
        return NextResponse.json({ error: msg || 'Could not send password reset email.' }, { status: 400 });
      }

      return NextResponse.json({
        ok: true,
        requiresResetOtp: true,
        sender: 'supabase',
        email: trimmedEmail,
        message: 'Password reset instructions have been sent to your email. Check your inbox and spam folder.',
      });
    }

    // 2. Reset Password — verify OTP and save new password
    if (mode === 'reset-password') {
      const cleanOtp = String(otp || '').trim();
      const nextPassword = String(newPassword ?? password ?? '');

      if (!cleanOtp || cleanOtp.length < 6) {
        return NextResponse.json(
          { error: 'Please enter the verification OTP sent to your email.' },
          { status: 400 }
        );
      }

      if (!nextPassword || nextPassword.length < 6) {
        return NextResponse.json(
          { error: 'New password must be at least 6 characters long.' },
          { status: 400 }
        );
      }

      const verifyClient = createStatelessAnonClient();
      let verifyData = null;
      let verifyError = null;

      for (const otpType of ['recovery', 'email', 'magiclink']) {
        const res = await verifyClient.auth.verifyOtp({
          email: trimmedEmail,
          token: cleanOtp,
          type: otpType,
        });
        if (!res.error && res.data?.user) {
          verifyData = res.data;
          verifyError = null;
          break;
        }
        verifyError = res.error;
      }

      if (verifyError || !verifyData?.user) {
        return NextResponse.json(
          {
            error:
              verifyError?.message ||
              'Invalid or expired reset OTP. Please check the code or request a new OTP.',
          },
          { status: 400 }
        );
      }

      const admin = adminClient();
      let updateError = null;

      if (admin) {
        const { error } = await admin.auth.admin.updateUserById(verifyData.user.id, {
          password: nextPassword,
          email_confirm: true,
        });
        updateError = error;
      } else if (verifyData.session?.access_token) {
        const userClient = createClient(supabaseUrl, anonKey, {
          auth: { autoRefreshToken: false, persistSession: false },
          global: { headers: { Authorization: `Bearer ${verifyData.session.access_token}` } },
        });
        const { error } = await userClient.auth.updateUser({ password: nextPassword });
        updateError = error;
      } else {
        updateError = { message: 'Unable to update password cleanly. Please try again.' };
      }

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message || 'Failed to update password.' },
          { status: 400 }
        );
      }

      await ensureProfileRow(
        verifyData.user.id,
        trimmedEmail,
        verifyData.session?.access_token
      );

      return NextResponse.json({
        ok: true,
        reset: true,
        message: 'Password updated successfully! Please sign in with your new password.',
      });
    }

    // 3. Resend verification email
    if (mode === 'resend') {
      const domainOk = await hasValidMailDomain(trimmedEmail);
      if (!domainOk) {
        return NextResponse.json(
          { error: 'This email domain does not exist or cannot receive emails. Please use a valid email address.' },
          { status: 400 }
        );
      }

      const admin = adminClient();
      const customSent = await trySendCustomVerificationEmail({
        admin,
        email: trimmedEmail,
        type: 'magiclink',
        origin: cleanOrigin,
      });
      if (customSent) {
        return NextResponse.json({
          ok: true,
          requiresVerification: true,
          hasOtp: customSent.hasOtp,
          sender: 'dhanak',
          email: trimmedEmail,
          message:
            'Verification email with your code and confirmation link has been resent from DHANAK! Check your inbox and spam folder.',
        });
      }

      const { error: resendErr } = await anonClient.auth.resend({
        type: 'signup',
        email: trimmedEmail,
        options: { emailRedirectTo },
      });

      if (resendErr) {
        const msg = resendErr.message || '';
        if (/rate limit|over_email_send_rate_limit/i.test(msg)) {
          return NextResponse.json(
            {
              error: 'Too many verification emails requested recently. Please wait a minute or use "Sign up with Google" above.',
            },
            { status: 429 }
          );
        }
        return NextResponse.json({ error: msg || 'Could not resend verification email.' }, { status: 400 });
      }

      return NextResponse.json({
        ok: true,
        requiresVerification: true,
        hasOtp: false,
        sender: 'supabase',
        email: trimmedEmail,
        message: 'Verification email resent! Please check your inbox and spam folder.',
      });
    }

    // 4. Verify OTP code from verification email
    if (mode === 'verify-otp') {
      const cleanOtp = String(otp || '').trim();
      if (!cleanOtp || cleanOtp.length < 6) {
        return NextResponse.json(
          { error: 'Please enter the verification code sent to your email.' },
          { status: 400 }
        );
      }

      const verifyClient = createStatelessAnonClient();
      let verifyData = null;
      let verifyError = null;

      for (const otpType of ['signup', 'email', 'magiclink']) {
        const res = await verifyClient.auth.verifyOtp({
          email: trimmedEmail,
          token: cleanOtp,
          type: otpType,
        });
        if (!res.error && res.data?.session) {
          verifyData = res.data;
          verifyError = null;
          break;
        }
        verifyError = res.error;
      }

      if (verifyError || !verifyData?.session) {
        return NextResponse.json(
          {
            error:
              verifyError?.message ||
              'Invalid or expired verification code. Please check the code or click the verification link in your email.',
          },
          { status: 400 }
        );
      }

      await ensureProfileRow(
        verifyData.session.user.id,
        trimmedEmail,
        verifyData.session.access_token
      );

      return NextResponse.json({
        session: verifyData.session,
        created: true,
        verified: true,
      });
    }

    // Validate password for login & create modes
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    // Verify that the email domain has real MX records (rejects fake domains like @sjsjsj.com)
    const domainValid = await hasValidMailDomain(trimmedEmail);
    if (!domainValid) {
      return NextResponse.json(
        {
          error: `The email domain "${trimmedEmail.split('@')[1]}" does not exist or cannot receive mail. Please enter a valid email address or use Google Sign-In.`,
        },
        { status: 400 }
      );
    }

    // 5. Sign In (`mode === 'login'`)
    if (mode === 'login') {
      const loginClient = createStatelessAnonClient();
      const { data: signInData, error: signInError } = await loginClient.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (!signInError && signInData?.session) {
        // Strictly require email confirmation before allowing login
        if (!signInData.session.user?.email_confirmed_at) {
          return NextResponse.json(
            {
              requiresVerification: true,
              email: trimmedEmail,
              error:
                'Your email is not verified yet. Please check your inbox (and spam folder) for the verification link/code, or click "Resend Verification Email" below.',
            },
            { status: 403 }
          );
        }

        await ensureProfileRow(
          signInData.session.user.id,
          trimmedEmail,
          signInData.session.access_token
        );

        return NextResponse.json({ session: signInData.session, created: false });
      }

      const errMsg = signInError?.message || '';
      if (/email not confirmed/i.test(errMsg)) {
        return NextResponse.json(
          {
            requiresVerification: true,
            email: trimmedEmail,
            error:
              'Your email address is not verified yet. Please check your inbox (and spam folder) for the verification link or code sent to you.',
          },
          { status: 403 }
        );
      }
      if (/invalid login credentials|invalid credentials/i.test(errMsg)) {
        return NextResponse.json(
          {
            error:
              'Incorrect email or password. If you do not have an account yet, please switch to "Create Account" or sign in with Google.',
          },
          { status: 401 }
        );
      }
      return NextResponse.json({ error: errMsg || 'Sign in failed.' }, { status: 400 });
    }

    // 4. Create Account (`mode === 'create'`)
    // Check if an account already exists for this email
    const admin = adminClient();
    const existingAuthUser = await findExistingAuthUserByEmail(admin, trimmedEmail);

    if (existingAuthUser) {
      if (existingAuthUser.email_confirmed_at) {
        return NextResponse.json(
          {
            error:
              'An account with this email already exists. Please switch to "Sign In" and enter your password, or use Google Sign-In.',
          },
          { status: 400 }
        );
      }

      // Account exists but was never confirmed — update password and resend verification email
      if (admin) {
        await admin.auth.admin.updateUserById(existingAuthUser.id, { password }).catch(() => {});

        const customSent = await trySendCustomVerificationEmail({
          admin,
          email: trimmedEmail,
          type: 'magiclink',
          origin: cleanOrigin,
        });
        if (customSent) {
          return NextResponse.json({
            requiresVerification: true,
            hasOtp: customSent.hasOtp,
            sender: 'dhanak',
            email: trimmedEmail,
            message:
              'We sent a verification email from DHANAK with a verification code and confirmation link. Check your inbox (and spam folder).',
          });
        }
      }

      const { error: resendError } = await anonClient.auth.resend({
        type: 'signup',
        email: trimmedEmail,
        options: { emailRedirectTo },
      });

      if (resendError && /rate limit|over_email_send_rate_limit/i.test(resendError.message || '')) {
        return NextResponse.json(
          {
            requiresVerification: true,
            hasOtp: false,
            sender: 'supabase',
            email: trimmedEmail,
            message:
              'A verification email was already sent recently to your address. Please check your inbox and spam folder, or sign up with Google.',
          },
          { status: 200 }
        );
      }

      return NextResponse.json({
        requiresVerification: true,
        hasOtp: false,
        sender: 'supabase',
        email: trimmedEmail,
        message:
          'Verification email sent! Please check your inbox (and spam folder) and click the confirmation link (or enter the OTP if included).',
      });
    }

    // If DHANAK SMTP mailer + admin key are configured, generate the signup OTP & link
    // via admin.generateLink so we send a DHANAK-branded email with BOTH OTP + link (no Supabase Auth branding).
    const customSignupSent = await trySendCustomVerificationEmail({
      admin,
      email: trimmedEmail,
      type: 'signup',
      password,
      origin: cleanOrigin,
    });
    if (customSignupSent) {
      return NextResponse.json({
        requiresVerification: true,
        hasOtp: customSignupSent.hasOtp,
        sender: 'dhanak',
        email: trimmedEmail,
        message:
          'Verification email sent from DHANAK! Enter the verification code from your email below or click the link inside the mail.',
      });
    }

    // Fallback: Standard Supabase signUp — sends confirmation email via Supabase Auth
    const { data: signUpData, error: signUpError } = await anonClient.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        emailRedirectTo,
      },
    });

    if (signUpError) {
      const msg = signUpError.message || '';
      if (/already registered|already exists|already been registered/i.test(msg)) {
        return NextResponse.json(
          {
            error:
              'An account with this email already exists. Please switch to "Sign In" with your password.',
          },
          { status: 400 }
        );
      }
      if (/rate limit|over_email_send_rate_limit/i.test(msg)) {
        return NextResponse.json(
          {
            error:
              'Email verification rate limit reached. Please wait a few minutes and try again, or use "Sign up with Google" above for instant verified sign-up.',
          },
          { status: 429 }
        );
      }
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    // Supabase returns an obfuscated user with empty identities[] when the email is already registered
    if (
      signUpData?.user &&
      Array.isArray(signUpData.user.identities) &&
      signUpData.user.identities.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            'An account with this email already exists. Please switch to "Sign In" with your password.',
        },
        { status: 400 }
      );
    }

    // Require email verification before creating a profile or granting a session
    return NextResponse.json({
      requiresVerification: true,
      hasOtp: false,
      sender: 'supabase',
      email: trimmedEmail,
      message:
        'Verification email sent! Please check your inbox (and spam folder) and click the confirmation link (or enter the OTP if included) to activate your account.',
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'Server error occurred during authentication.' },
      { status: 500 }
    );
  }
}
