import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateUniqueCode } from '@/lib/uniqueCode';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
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

/**
 * Google sign-in without Supabase's OAuth provider.
 * Verifies ID token directly with Google's tokeninfo endpoint.
 */
export async function POST(req) {
  try {
    const { credential } = await req.json();
    if (!credential) {
      return NextResponse.json({ error: 'Missing Google credential.' }, { status: 400 });
    }

    const verifyRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
    );
    const payload = await verifyRes.json().catch(() => ({}));

    if (!verifyRes.ok || !payload.email) {
      return NextResponse.json({ error: 'Could not verify Google account.' }, { status: 401 });
    }
    if (payload.email_verified !== 'true' && payload.email_verified !== true) {
      return NextResponse.json({ error: 'Google email is not verified.' }, { status: 401 });
    }
    if (process.env.GOOGLE_CLIENT_ID && payload.aud !== process.env.GOOGLE_CLIENT_ID) {
      return NextResponse.json({ error: 'Invalid Google client.' }, { status: 401 });
    }

    const email = payload.email.toLowerCase();
    const admin = adminClient();

    if (admin) {
      try {
        const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
          type: 'magiclink',
          email,
        });

        if (linkError || !linkData?.properties?.hashed_token) {
          throw linkError || new Error('Could not generate Google sign-in token.');
        }

        const userId = linkData.user?.id;
        if (userId) {
          const { data: existingProfile } = await admin
            .from('profiles')
            .select('user_id')
            .eq('user_id', userId)
            .maybeSingle();

          if (!existingProfile) {
            const googleName =
              (typeof payload.name === 'string' && payload.name.trim()) ||
              [payload.given_name, payload.family_name].filter(Boolean).join(' ').trim() ||
              null;

            let attemptsLeft = 3;
            while (attemptsLeft > 0) {
              const { error: profileError } = await admin.from('profiles').insert({
                user_id: userId,
                unique_code: generateUniqueCode(),
                email,
                ...(googleName ? { name: googleName } : {}),
              });
              if (!profileError) break;
              attemptsLeft -= 1;
            }
          }
        }

        const verifyClient = createStatelessAnonClient();
        const { data: verifyData, error: verifyError } = await verifyClient.auth.verifyOtp({
          token_hash: linkData.properties.hashed_token,
          type: 'email',
        });

        if (verifyError || !verifyData?.session) {
          throw verifyError || new Error('Could not verify generated Supabase session.');
        }

        const created =
          !!linkData.user && new Date(linkData.user.created_at).getTime() > Date.now() - 15000;
        return NextResponse.json({ session: verifyData.session, created });
      } catch (adminErr) {
        console.error('[api/auth/google] Supabase session creation failed:', adminErr?.message);
        if (isConfigured) {
          return NextResponse.json(
            {
              error:
                adminErr?.message ||
                'Could not establish Supabase session for Google Sign-In. Please try again.',
            },
            { status: 500 }
          );
        }
      }
    } else if (isConfigured) {
      return NextResponse.json(
        {
          error:
            'Google Sign-In requires SUPABASE_SERVICE_ROLE_KEY to be set in environment variables.',
        },
        { status: 503 }
      );
    }

    // Offline / unconfigured dev-only mock session (never used when Supabase is configured)
    const googleName =
      (typeof payload.name === 'string' && payload.name.trim()) ||
      [payload.given_name, payload.family_name].filter(Boolean).join(' ').trim() ||
      email.split('@')[0];

    const googleUser = {
      id: `dhanak_google_${Buffer.from(email).toString('hex').slice(0, 12)}`,
      email,
      user_metadata: {
        name: googleName,
        picture: payload.picture,
      },
      aud: 'authenticated',
      role: 'authenticated',
    };

    return NextResponse.json({
      session: {
        access_token: `dhanak_token_${Date.now()}`,
        refresh_token: `dhanak_refresh_${Date.now()}`,
        user: googleUser,
      },
      created: true,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
