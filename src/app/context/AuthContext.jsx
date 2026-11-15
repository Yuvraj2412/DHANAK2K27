'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { CHECKOUT_STORAGE_KEYS } from '@/lib/checkout';

const AuthContext = createContext({
  user: null,
  loading: true,
  authenticate: async () => ({ error: 'not_ready' }),
  authenticateWithGoogle: async () => ({ error: 'not_ready' }),
  devLogin: async () => ({ user: null }),
  signOut: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    // Check if we have a persisted dev user in localStorage first
    if (typeof window !== 'undefined') {
      try {
        const cachedUser = window.localStorage.getItem('dhanak_auth_user');
        if (cachedUser) {
          const parsed = JSON.parse(cachedUser);
          if (parsed && parsed.email) {
            setUser(parsed);
            setLoading(false);
          }
        }
      } catch (err) {
        console.warn('[AuthContext] error reading cached dev user', err);
      }
    }

    if (!isSupabaseConfigured()) {
      setLoading(false);
      return () => {
        active = false;
      };
    }

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      if (data?.session) {
        setUser(data.session.user);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('dhanak_auth_user', JSON.stringify(data.session.user));
        }
        setLoading(false);
        return;
      }
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!active) return;
        if (userData?.user) {
          setUser(userData.user);
          if (typeof window !== 'undefined') {
            window.localStorage.setItem('dhanak_auth_user', JSON.stringify(userData.user));
          }
        }
      } catch {
        // Fallback or offline
      } finally {
        if (active) setLoading(false);
      }
    }).catch(() => {
      if (active) setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (session) {
        setUser(session.user);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('dhanak_auth_user', JSON.stringify(session.user));
        }
        setLoading(false);
        return;
      }
      if (event === 'SIGNED_OUT') {
        setUser(null);
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('dhanak_auth_user');
        }
      }
      setLoading(false);
    });

    return () => {
      active = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  // Fast 1-click dev login helper for Dhanak demo & testing
  const devLogin = useCallback(async (customEmail) => {
    const email = (customEmail || 'dhanak2026@iist.ac.in').toLowerCase();
    const hexPart = Math.random().toString(36).substring(2, 8);
    const mockUser = {
      id: `dhanak_user_${hexPart}`,
      email,
      user_metadata: { name: 'Dhanak Participant' },
      aud: 'authenticated',
      role: 'authenticated',
    };
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('dhanak_auth_user', JSON.stringify(mockUser));
    }
    setUser(mockUser);
    return { user: mockUser, created: false };
  }, []);

  // Single "log in, or create an account if none exists" call
  const authenticate = useCallback(async (email, password, mode = 'login') => {
    const trimmedEmail = email.trim().toLowerCase();

    // If Supabase is unconfigured, immediately use devLogin
    if (!isSupabaseConfigured()) {
      return devLogin(trimmedEmail);
    }

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, password, mode }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.error) {
        if (data.devMode || !isSupabaseConfigured()) {
          return devLogin(trimmedEmail);
        }
        return { error: data.error || 'Authentication failed.' };
      }

      if (data?.session?.user) {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('dhanak_auth_user', JSON.stringify(data.session.user));
        }
        setUser(data.session.user);
        try {
          await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          });
        } catch {
          // If setSession fails due to mock tokens, user is still authenticated in state
        }
        return { user: data.session.user, created: data.created };
      }

      return { error: 'Authentication failed. Please check your credentials.' };
    } catch (err) {
      if (!isSupabaseConfigured()) {
        return devLogin(trimmedEmail);
      }
      return { error: err.message || 'Connection error. Please try again.' };
    }
  }, [devLogin]);

  const authenticateWithGoogle = useCallback(async (idToken) => {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: idToken }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.error) {
      return { error: data.error || 'Google sign-in failed.' };
    }

    if (data?.session?.user) {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('dhanak_auth_user', JSON.stringify(data.session.user));
      }
      setUser(data.session.user);
      try {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
      } catch {
        // Ignore mock token failure
      }
      return { user: data.session.user, created: data.created };
    }

    return { error: 'Invalid Google session' };
  }, []);

  const signOut = useCallback(async () => {
    try {
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut();
      }
    } catch {
      // Ignore
    }
    if (typeof window !== 'undefined') {
      CHECKOUT_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
      window.localStorage.removeItem('conscientia_cart');
      window.localStorage.removeItem('dhanak_auth_user');
      window.localStorage.removeItem('dhanak_profile_data');
    }
    setUser(null);
  }, []);

  const loginWithPhoneUser = useCallback((sessionUser) => {
    if (!sessionUser) return;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('dhanak_auth_user', JSON.stringify(sessionUser));
    }
    setUser(sessionUser);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authenticate,
        authenticateWithGoogle,
        loginWithPhoneUser,
        devLogin,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
