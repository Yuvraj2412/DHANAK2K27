// /api/get-registration/route.js

import { NextResponse } from 'next/server';
import { createServerSupabase } from '../_supabase-server';
import { findRegistrationForUser } from '@/lib/registrationLookup';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('user_id');
  const email = searchParams.get('email');

  if (!userId && !email) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const isConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('example.com')
  );

  if (!isConfigured) {
    return NextResponse.json({ success: true, data: null, devMode: true });
  }

  let supabase;
  try {
    supabase = createServerSupabase();
  } catch {
    return NextResponse.json({ success: true, data: null, devMode: true });
  }

  if (userId) {
    try {
      const data = await findRegistrationForUser(supabase, userId);
      return NextResponse.json({ success: true, data });
    } catch {
      return NextResponse.json({ success: true, data: null });
    }
  }

  try {
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: true, data: null });
    }

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: true, data: null });
  }
}
