'use client';

import { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { generateUniqueCode } from '@/lib/uniqueCode';
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

    // If Supabase is not configured, load from local storage or create fallback
    if (!isSupabaseConfigured()) {
      if (typeof window !== 'undefined') {
        const stored = window.localStorage.getItem(PROFILE_STORAGE_KEY);
        if (stored) {
          try {
            const parsed = sanitizeProfile(JSON.parse(stored));
            window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(parsed));
            setProfile(parsed);
            setLoading(false);
            return;
          } catch {
            // ignore JSON error
          }
        }
        const initial = getFallbackProfile(user);
        window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(initial));
        setProfile(initial);
      }
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error || !data) {
        // Fallback to local storage if Supabase returned error or empty
        if (typeof window !== 'undefined') {
          const stored = window.localStorage.getItem(PROFILE_STORAGE_KEY);
          if (stored) {
            try {
              const parsed = sanitizeProfile(JSON.parse(stored));
              window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(parsed));
              setProfile(parsed);
              setLoading(false);
              return;
            } catch {
              // ignore
            }
          }
        }
        const fallback = getFallbackProfile(user);
        setProfile(fallback);
      } else {
        const clean = sanitizeProfile(data);
        setProfile(clean);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(clean));
        }
      }
    } catch {
      const fallback = getFallbackProfile(user);
      setProfile(fallback);
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

      const current = profile || getFallbackProfile(user);
      const updated = {
        ...current,
        ...fields,
        user_id: user.id,
        email: user.email?.toLowerCase() || current.email,
        updated_at: new Date().toISOString(),
      };

      // Always persist to localStorage for instant reliable local caching
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
      }
      setProfile(updated);

      if (!isSupabaseConfigured()) {
        return { data: updated };
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .upsert(
            {
              user_id: user.id,
              unique_code: updated.unique_code || generateUniqueCode(),
              email: user.email?.toLowerCase() || null,
              ...fields,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          )
          .select()
          .maybeSingle();
        if (error) {
          console.warn('[ProfileContext] upsert failed, cached locally', error);
          return { data: updated };
        }
        if (data) setProfile(data);
        return { data: data || updated };
      } catch (err) {
        console.warn('[ProfileContext] network error, cached locally', err);
        return { data: updated };
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
