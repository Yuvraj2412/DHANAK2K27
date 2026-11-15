import { createClient } from '@supabase/supabase-js';
import { processLock } from '@supabase/auth-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder';

export const isSupabaseConfigured = () => {
  return Boolean(
    supabaseUrl &&
    !supabaseUrl.includes('placeholder') &&
    !supabaseUrl.includes('example.com')
  );
};

export const supabase = createClient(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      lock: processLock,
    },
  }
);
