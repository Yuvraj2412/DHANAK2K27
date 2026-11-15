import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

const anonClient = isConfigured ? createClient(supabaseUrl, anonKey) : null;

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
 * Checks whether an account/profile already exists for the given email.
 */
export async function POST(req) {
  try {
    const { email } = await req.json();
    const trimmedEmail = String(email || '').trim().toLowerCase();

    if (!trimmedEmail || !isConfigured || !anonClient) {
      return NextResponse.json({ exists: false });
    }

    // 1. Check profiles table first (safe with anon client)
    try {
      const { data: profile } = await anonClient
        .from('profiles')
        .select('id')
        .eq('email', trimmedEmail)
        .maybeSingle();

      if (profile) {
        return NextResponse.json({ exists: true });
      }
    } catch {
      // ignore
    }

    // 2. Check admin listUsers if valid service role key is configured
    const admin = adminClient();
    if (admin) {
      try {
        let page = 1;
        const perPage = 200;
        for (let i = 0; i < 5; i += 1) {
          const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
          if (error || !data?.users?.length) break;
          if (data.users.some((u) => (u.email || '').toLowerCase() === trimmedEmail)) {
            return NextResponse.json({ exists: true });
          }
          if (data.users.length < perPage) break;
          page += 1;
        }
      } catch {
        // ignore
      }
    }

    return NextResponse.json({ exists: false });
  } catch (err) {
    return NextResponse.json({ exists: false }, { status: 200 });
  }
}
