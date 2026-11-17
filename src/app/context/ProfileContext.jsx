'use client';

import { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { useAuth } from './AuthContext';

const ProfileContext = createContext({
  profile: null,
  loading: true,
  refresh: async () => {},
  save: async () => ({ error: 'not_ready' }),
});

const PROFILE_STORAGE_KEY = 'dhanak_profile_data';

function sanitizeProfile(data) {
  if (!data || typeof data !== 'object') return data;
  const copy = { ...data };
  if (copy.phone === '9876543210') copy.phone = '';
  if (copy.college === 'Indian Institute of Space Science and Technology (IIST)') copy.college = '';
  if (copy.college_id === 'IIST-2026-DHN' || copy.college_id === 'IIST-2027-DHN') copy.college_id = '';
  if (copy.aadhaar_number === '884219203810') copy.aadhaar_number = '';
  if (copy.city === 'Thiruvananthapuram' && !copy.phone) copy.city = '';
  if (copy.gender === 'male' && !copy.phone) copy.gender = '';
  if (typeof copy.address === 'string' && copy.address.includes('IIST Campus, Valiamala')) copy.address = '';
  return copy;
}

function getFallbackProfile(user) {
  if (!user) return null;
  const emailName = user.email ? user.email.split('@')[0] : 'Participant';
  const capitalizedName = emailName
    .replace(/[._]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    user_id: user.id,
    unique_code: `DHN-${Math.floor(100000 + Math.random() * 900000)}`,
    email: user.email?.toLowerCase() || '',
    name: user.user_metadata?.name || capitalizedName || 'Participant',
    phone: '',
    college: '',
    college_id: '',
    aadhaar_number: '',
    city: '',
    gender: '',
    address: '',
    created_at: new Date().toISOString(),
  };
}

function readCachedProfileForUser(userId) {
  if (typeof window === 'undefined' || !userId) return null;
  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = sanitizeProfile(JSON.parse(raw));
    if (parsed && parsed.user_id === userId) {
      return parsed;
    }
    // Clear stale cache belonging to another user
    window.localStorage.removeItem(PROFILE_STORAGE_KEY);
  } catch {
    // ignore JSON error
  }
  return null;
}

function writeCachedProfile(data) {
  if (typeof window === 'undefined' || !data) return;
  try {
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore storage quota errors
  }
}

export function ProfileProvider({ children }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);

    const isLocalMockUser = String(user.id || '').startsWith('dhanak_user_');

    // Only use local-only fallback when Supabase is not configured (or dev mock login)
    if (!isSupabaseConfigured() || isLocalMockUser) {
      const cached = readCachedProfileForUser(user.id);
      if (cached) {
        writeCachedProfile(cached);
        setProfile(cached);
      } else {
        const initial = getFallbackProfile(user);
        writeCachedProfile(initial);
        setProfile(initial);
      }
      setLoading(false);
      return;
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        // Without a verified Supabase session, do not invent a fake DHN-ID profile.
        setProfile(null);
        setLoading(false);
        return;
      }

      // Prefer server /api/profile route (creates row if absent & bypasses transient client RLS quirks)
      try {
        const res = await fetch('/api/profile', {
          method: 'GET',
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: 'no-store',
        });
        const json = await res.json().catch(() => ({}));
        if (res.ok && json?.success && json?.data) {
          const clean = sanitizeProfile(json.data);
          setProfile(clean);
          writeCachedProfile(clean);
          return;
        }
      } catch {
        // Fall through to direct Supabase query
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && data) {
        const clean = sanitizeProfile(data);
        setProfile(clean);
        writeCachedProfile(clean);
      } else {
        setProfile(readCachedProfileForUser(user.id));
      }
    } catch {
      setProfile(readCachedProfileForUser(user.id));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const save = useCallback(
    async (fields) => {
      if (!user) return { error: 'Not signed in.' };

      const isLocalMockUser = String(user.id || '').startsWith('dhanak_user_');

      if (!isSupabaseConfigured() || isLocalMockUser) {
        const current = profile || getFallbackProfile(user);
        const updated = {
          ...current,
          ...fields,
          user_id: user.id,
          email: user.email?.toLowerCase() || current.email,
          updated_at: new Date().toISOString(),
        };
        writeCachedProfile(updated);
        setProfile(updated);
        return { data: updated };
      }

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token;

        if (!accessToken) {
          return {
            error:
              'Your login session could not be verified. Please sign out and sign in again to save your profile.',
          };
        }

        const res = await fetch('/api/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ fields }),
        });

        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json?.success || !json?.data) {
          return {
            error:
              json?.error ||
              'Failed to save profile to Supabase. Please check your connection and try again.',
          };
        }

        const clean = sanitizeProfile(json.data);
        writeCachedProfile(clean);
        setProfile(clean);
        return { data: clean };
      } catch (err) {
        return {
          error:
            err?.message ||
            'Network error while saving profile. Nothing was saved — please try again.',
        };
      }
    },
    [user, profile]
  );

  return (
    <ProfileContext.Provider value={{ profile, loading, refresh, save }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
