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

const EDITABLE_FIELDS = [
  'name',
  'phone',
  'college',
  'college_id',
  'aadhaar_number',
  'city',
  'gender',
  'address',
];

function createStatelessAnonClient() {
  return createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function createDbClient(token) {
  if (hasValidServiceRoleKey) {
    return createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

async function authenticateCaller(req) {
  if (!isConfigured) {
    return { error: 'Supabase is not configured on the server.', status: 503 };
  }

  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return { error: 'Missing authentication token. Please sign in again.', status: 401 };
  }

  const authClient = createStatelessAnonClient();
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data?.user?.id) {
    return { error: 'Invalid or expired login session. Please sign in again.', status: 401 };
  }

  return {
    user: data.user,
    token,
    db: createDbClient(token),
  };
}

async function ensureAndFetchProfile(db, user) {
  const { data: existing, error: selectError } = await db
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (selectError) {
    throw selectError;
  }
  if (existing) {
    return existing;
  }

  const defaultName =
    (typeof user.user_metadata?.full_name === 'string' && user.user_metadata.full_name.trim()) ||
    (typeof user.user_metadata?.name === 'string' && user.user_metadata.name.trim()) ||
    (user.email ? user.email.split('@')[0] : null);

  let lastError = null;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const { data: inserted, error: insertError } = await db
      .from('profiles')
      .insert({
        user_id: user.id,
        unique_code: generateUniqueCode(),
        email: user.email?.toLowerCase() || null,
        ...(defaultName ? { name: defaultName } : {}),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (!insertError && inserted) {
      return inserted;
    }

    lastError = insertError;
    // Concurrent insert may have created the row for this user_id already
    const { data: retryRow } = await db
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    if (retryRow) return retryRow;
  }

  throw lastError || new Error('Could not initialize user profile row.');
}

function sanitizeEditableFields(rawFields) {
  const clean = {};
  if (!rawFields || typeof rawFields !== 'object') return clean;

  for (const key of EDITABLE_FIELDS) {
    if (!(key in rawFields)) continue;
    const raw = rawFields[key];
    if (raw === undefined) continue;
    if (raw === null) {
      clean[key] = null;
      continue;
    }
    const trimmed = String(raw).trim();
    if (key === 'address' || key === 'gender') {
      clean[key] = trimmed || null;
    } else {
      clean[key] = trimmed;
    }
  }
  return clean;
}

export async function GET(req) {
  try {
    const auth = await authenticateCaller(req);
    if (auth.error) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const row = await ensureAndFetchProfile(auth.db, auth.user);
    return NextResponse.json({ success: true, data: row });
  } catch (err) {
    console.error('[api/profile GET]', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to load profile from database.' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const auth = await authenticateCaller(req);
    if (auth.error) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const body = await req.json().catch(() => ({}));
    const rawFields = body?.fields && typeof body.fields === 'object' ? body.fields : body;
    const changes = sanitizeEditableFields(rawFields);

    if (Object.keys(changes).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid profile fields provided.' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const { data: existing, error: selectError } = await auth.db
      .from('profiles')
      .select('user_id, email, unique_code')
      .eq('user_id', auth.user.id)
      .maybeSingle();

    if (selectError) {
      return NextResponse.json(
        { success: false, error: selectError.message || 'Database lookup failed.' },
        { status: 500 }
      );
    }

    if (existing) {
      const { data: updated, error: updateError } = await auth.db
        .from('profiles')
        .update({
          ...changes,
          email: auth.user.email?.toLowerCase() || existing.email || null,
          updated_at: now,
        })
        .eq('user_id', auth.user.id)
        .select()
        .single();

      if (updateError) {
        console.error('[api/profile POST update]', updateError);
        return NextResponse.json(
          { success: false, error: updateError.message || 'Failed to update profile.' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, data: updated });
    }

    // Create row if it does not exist yet
    let lastInsertErr = null;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const { data: inserted, error: insertError } = await auth.db
        .from('profiles')
        .insert({
          user_id: auth.user.id,
          unique_code: generateUniqueCode(),
          email: auth.user.email?.toLowerCase() || null,
          ...changes,
          updated_at: now,
        })
        .select()
        .single();

      if (!insertError && inserted) {
        return NextResponse.json({ success: true, data: inserted });
      }
      lastInsertErr = insertError;
    }

    console.error('[api/profile POST insert]', lastInsertErr);
    return NextResponse.json(
      { success: false, error: lastInsertErr?.message || 'Failed to create profile.' },
      { status: 500 }
    );
  } catch (err) {
    console.error('[api/profile POST]', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error while saving profile.' },
      { status: 500 }
    );
  }
}
