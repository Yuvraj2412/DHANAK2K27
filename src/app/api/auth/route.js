import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateUniqueCode } from '@/lib/uniqueCode';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const isConfigured = Boolean(
  supabaseUrl &&
  anonKey &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseUrl.includes('example.com')
);

// A valid service role key is either a JWT containing role "service_role" or starts with "sb_secret_"
// It must NOT be the publishable client key (which starts with "sb_publishable_").
const hasValidServiceRoleKey = Boolean(
  isConfigured &&
  serviceKey &&
  !serviceKey.startsWith('sb_publishable_') &&
  serviceKey !== anonKey &&
  !serviceKey.includes('placeholder') &&
  !serviceKey.includes('your-service-role-key')
);

const anonClient = isConfigured
  ? createClient(supabaseUrl, anonKey)
  : null;

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

function createSessionForUser(user, isCreated = false) {
  return {
    session: {
      access_token: `dhanak_token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      refresh_token: `dhanak_refresh_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      user: {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata || {
          name: (user.email || '').split('@')[0],
        },
        aud: 'authenticated',
        role: 'authenticated',
      },
    },
    created: isCreated,
  };
}

/**
 * Authentication endpoint supporting both:
 * 1. Sign In (with password)
 * 2. Create Account (pre-confirmed via admin if service role key available, or client signUp)
 */
export async function POST(req) {
  try {
    const { email, password, mode } = await req.json();
    const trimmedEmail = String(email || '').trim().toLowerCase();

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    // Dev mode fallback if Supabase URL or Anon key are missing
    if (!isConfigured || !anonClient) {
      const devUser = {
        id: `dhanak_user_${Buffer.from(trimmedEmail).toString('hex').slice(0, 10)}`,
        email: trimmedEmail,
        user_metadata: { name: trimmedEmail.split('@')[0] },
      };
      return NextResponse.json(createSessionForUser(devUser, true));
    }

    // 1. If mode is 'login' (Sign In tab), perform password sign in directly
    if (mode === 'login') {
      const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (!signInError && signInData?.session) {
        // Ensure a profile row exists for this user in public.profiles
        try {
          const userClient = createClient(supabaseUrl, anonKey, {
            global: { headers: { Authorization: `Bearer ${signInData.session.access_token}` } },
          });
          const { data: existingProfile } = await userClient
            .from('profiles')
            .select('user_id')
            .eq('user_id', signInData.session.user.id)
            .maybeSingle();

          if (!existingProfile) {
            await userClient.from('profiles').upsert(
              {
                user_id: signInData.session.user.id,
                email: trimmedEmail,
                unique_code: generateUniqueCode(),
              },
              { onConflict: 'user_id' }
            );
          }
        } catch (syncErr) {
          console.warn('[api/auth] Profile check warning:', syncErr);
        }

        return NextResponse.json({ session: signInData.session, created: false });
      }

      const errMsg = signInError?.message || '';
      if (/invalid login credentials|invalid credentials/i.test(errMsg)) {
        return NextResponse.json(
          { error: 'Incorrect email or password. If you do not have an account yet, please switch to "Create Account".' },
          { status: 401 }
        );
      }
      if (/email not confirmed/i.test(errMsg)) {
        return NextResponse.json(
          { error: 'Email not confirmed yet. Please verify your email via the link sent to your inbox, or disable "Confirm email" in your Supabase Dashboard (Authentication -> Providers -> Email).' },
          { status: 401 }
        );
      }
      return NextResponse.json({ error: errMsg || 'Sign in failed.' }, { status: 400 });
    }

    // 2. Account Creation Flow (mode === 'create')
    // Strategy A: If a verified service role key is present, use admin.createUser to pre-confirm email
    const admin = adminClient();
    if (admin) {
      try {
        const { data: createData, error: createError } = await admin.auth.admin.createUser({
          email: trimmedEmail,
          password,
          email_confirm: true,
        });

        if (createError) {
          const alreadyExists = /already registered|already exists|already been registered/i.test(
            createError.message || ''
          );
          if (alreadyExists) {
            return NextResponse.json(
              { error: 'An account with this email already exists. Please switch to "Sign In" and enter your password.' },
              { status: 400 }
            );
          }
          if (!/bearer token/i.test(createError.message || '')) {
            return NextResponse.json({ error: createError.message }, { status: 400 });
          }
        } else if (createData?.user) {
          const newUserId = createData.user.id;
          await admin.from('profiles').upsert(
            { user_id: newUserId, email: trimmedEmail, unique_code: generateUniqueCode() },
            { onConflict: 'user_id' }
          ).catch((e) => console.warn('[api/auth] Profile upsert warning:', e));

          const { data: freshSignIn, error: freshError } = await anonClient.auth.signInWithPassword({
            email: trimmedEmail,
            password,
          });

          if (freshSignIn?.session) {
            return NextResponse.json({ session: freshSignIn.session, created: true });
          }

          if (freshError) {
            return NextResponse.json({ error: freshError.message }, { status: 400 });
          }

          return NextResponse.json(createSessionForUser(createData.user, true));
        }
      } catch (adminErr) {
        console.warn('[api/auth] Admin createUser error, falling back to client signup:', adminErr.message);
      }
    }

    // Strategy B: Client signUp via anonClient
    const { data: signUpData, error: signUpError } = await anonClient.auth.signUp({
      email: trimmedEmail,
      password,
    });

    if (signUpError) {
      const msg = signUpError.message || '';
      if (/already registered|already exists|already been registered/i.test(msg)) {
        return NextResponse.json(
          { error: 'An account with this email already exists. Please switch to "Sign In" with your password.' },
          { status: 400 }
        );
      }
      if (/rate limit|over_email_send_rate_limit/i.test(msg)) {
        return NextResponse.json(
          {
            error: 'Supabase email rate limit exceeded. To fix this: in your Supabase Dashboard, go to Authentication -> Providers -> Email and turn OFF "Confirm email", or paste your secret service_role key into SUPABASE_SERVICE_ROLE_KEY in .env.local.',
          },
          { status: 429 }
        );
      }
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    // If signUp returned an active session directly (e.g. when "Confirm email" is disabled in Supabase)
    if (signUpData?.session && signUpData?.user) {
      try {
        const userClient = createClient(supabaseUrl, anonKey, {
          global: { headers: { Authorization: `Bearer ${signUpData.session.access_token}` } },
        });
        await userClient.from('profiles').upsert(
          { user_id: signUpData.user.id, email: trimmedEmail, unique_code: generateUniqueCode() },
          { onConflict: 'user_id' }
        );
      } catch (e) {
        console.warn('[api/auth] User profile sync warning:', e);
      }

      return NextResponse.json({ session: signUpData.session, created: true });
    }

    // If user was created in Supabase but requires email confirmation
    if (signUpData?.user) {
      return NextResponse.json(
        {
          error: 'Account created! Please check your email to confirm your account before signing in, OR in Supabase Dashboard (Authentication -> Providers -> Email), turn OFF "Confirm email" to enable instant logins.',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Account creation failed. Please try again or check your Supabase configuration.' },
      { status: 500 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'Server error occurred during authentication.' },
      { status: 500 }
    );
  }
}
