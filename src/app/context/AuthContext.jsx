'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { CHECKOUT_STORAGE_KEYS } from '@/lib/checkout';
import { generateUniqueCode } from '@/lib/uniqueCode';

const AuthContext = createContext({
  user: null,
  loading: true,
  authenticate: async () => ({ error: 'not_ready' }),
  verifyEmailOtp: async () => ({ error: 'not_ready' }),
  resendVerificationEmail: async () => ({ error: 'not_ready' }),
  requestPasswordReset: async () => ({ error: 'not_ready' }),
  resetPasswordWithOtp: async () => ({ error: 'not_ready' }),
  authenticateWithGoogle: async () => ({ error: 'not_ready' }),
  signInWithGoogleOAuth: async () => ({ error: 'not_ready' }),
  devLogin: async () => ({ user: null }),
  signOut: async () => {},
});

function isVerifiedUser(u) {
  if (!u || !u.email) return false;
  // Verified via Google Identity Services or Google OAuth
  if (
    String(u.id || '').startsWith('dhanak_google_') ||
    u.app_metadata?.provider === 'google' ||
    (Array.isArray(u.app_metadata?.providers) && u.app_metadata.providers.includes('google'))
  ) {
    return true;
  }
  // Verified via phone OTP
  if (u.user_metadata?.phone_verified) {
    return true;
  }
  // Email-password user must have email_confirmed_at set
  return Boolean(u.email_confirmed_at || u.confirmed_at);
}

async function ensureClientProfileRow(sessionUser) {
  if (!sessionUser?.id || !sessionUser?.email || !isSupabaseConfigured()) return;
  if (String(sessionUser.id).startsWith('dhanak_')) return;
  try {
    const { data: existing } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('user_id', sessionUser.id)
      .maybeSingle();

    if (!existing) {
      const displayName =
        sessionUser.user_metadata?.full_name ||
        sessionUser.user_metadata?.name ||
        null;
      await supabase.from('profiles').upsert(
        {
          user_id: sessionUser.id,
          email: sessionUser.email.toLowerCase(),
          unique_code: generateUniqueCode(),
          ...(displayName ? { name: displayName } : {}),
        },
        { onConflict: 'user_id' }
      );
    }
  } catch {
    // Non-fatal; ProfileContext will handle upsert on save
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    // Only hydrate synchronously from localStorage when Supabase is NOT configured
    // or for local-only dev/mobile sessions. Real Supabase sessions are validated
    // via `supabase.auth.getSession()` below so orphaned caches never bypass RLS or login.
    if (typeof window !== 'undefined') {
      try {
        const cachedUser = window.localStorage.getItem('dhanak_auth_user');
        if (cachedUser) {
          const parsed = JSON.parse(cachedUser);
          const isLocalOnly =
            String(parsed?.id || '').startsWith('dhanak_user_') ||
            Boolean(parsed?.user_metadata?.phone_verified);
          if (parsed && isVerifiedUser(parsed)) {
            if (!isSupabaseConfigured() || isLocalOnly) {
              setUser(parsed);
              setLoading(false);
            }
          } else {
            window.localStorage.removeItem('dhanak_auth_user');
            window.localStorage.removeItem('dhanak_profile_data');
          }
        }
      } catch (err) {
        console.warn('[AuthContext] error reading cached user', err);
      }
    }

    if (!isSupabaseConfigured()) {
      setLoading(false);
      return () => {
        active = false;
      };
    }

    // Handle email confirmation callback params (?token_hash=...&type=... or ?code=...)
    const handleUrlConfirmation = async () => {
      if (typeof window === 'undefined') return;
      try {
        const params = new URLSearchParams(window.location.search);
        const tokenHash = params.get('token_hash');
        const type = params.get('type') || 'signup';
        const code = params.get('code');

        if (tokenHash) {
          const { data } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type,
          });
          if (active && data?.session?.user && isVerifiedUser(data.session.user)) {
            setUser(data.session.user);
            window.localStorage.setItem('dhanak_auth_user', JSON.stringify(data.session.user));
            await ensureClientProfileRow(data.session.user);
          }
        } else if (code) {
          const { data } = await supabase.auth.exchangeCodeForSession(code);
          if (active && data?.session?.user && isVerifiedUser(data.session.user)) {
            setUser(data.session.user);
            window.localStorage.setItem('dhanak_auth_user', JSON.stringify(data.session.user));
            await ensureClientProfileRow(data.session.user);
          }
        }
      } catch (err) {
        console.warn('[AuthContext] URL confirmation check:', err?.message);
      }
    };

    handleUrlConfirmation().finally(() => {
      supabase.auth
        .getSession()
        .then(async ({ data }) => {
          if (!active) return;
          if (data?.session?.user && isVerifiedUser(data.session.user)) {
            setUser(data.session.user);
            if (typeof window !== 'undefined') {
              window.localStorage.setItem('dhanak_auth_user', JSON.stringify(data.session.user));
            }
            await ensureClientProfileRow(data.session.user);
            setLoading(false);
            return;
          }
          try {
            const { data: userData } = await supabase.auth.getUser();
            if (!active) return;
            if (userData?.user && isVerifiedUser(userData.user)) {
              setUser(userData.user);
              if (typeof window !== 'undefined') {
                window.localStorage.setItem('dhanak_auth_user', JSON.stringify(userData.user));
              }
              await ensureClientProfileRow(userData.user);
              return;
            }
            // No active Supabase session exists. Clear any orphaned non-dev cached user
            // so the browser cannot remain in a broken unauthenticated local-only state.
            if (typeof window !== 'undefined') {
              const rawCached = window.localStorage.getItem('dhanak_auth_user');
              if (rawCached) {
                try {
                  const parsedCached = JSON.parse(rawCached);
                  const isLocalOnly =
                    String(parsedCached?.id || '').startsWith('dhanak_user_') ||
                    Boolean(parsedCached?.user_metadata?.phone_verified);
                  if (!isLocalOnly) {
                    window.localStorage.removeItem('dhanak_auth_user');
                    window.localStorage.removeItem('dhanak_profile_data');
                    setUser(null);
                  }
                } catch {
                  window.localStorage.removeItem('dhanak_auth_user');
                  window.localStorage.removeItem('dhanak_profile_data');
                  setUser(null);
                }
              }
            }
          } catch {
            // Offline or transient failure
          } finally {
            if (active) setLoading(false);
          }
        })
        .catch(() => {
          if (active) setLoading(false);
        });
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (session?.user && isVerifiedUser(session.user)) {
        setUser(session.user);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('dhanak_auth_user', JSON.stringify(session.user));
        }
        ensureClientProfileRow(session.user);
        setLoading(false);
        return;
      }
      if (event === 'SIGNED_OUT') {
        setUser(null);
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('dhanak_auth_user');
          window.localStorage.removeItem('dhanak_profile_data');
        }
      }
      setLoading(false);
    });

    return () => {
      active = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  /**
   * Persist Supabase JWT session BEFORE updating React `user` state so
   * any redirect or profile fetch that reacts to `user` finds an active session.
   */
  const applyAuthSession = useCallback(async (session) => {
    if (!session?.user) return null;
    let resolvedUser = session.user;

    if (
      isSupabaseConfigured() &&
      session.access_token &&
      !String(session.access_token).startsWith('dhanak_token_')
    ) {
      try {
        const { data: setData, error: setErr } = await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        });
        if (!setErr && setData?.user) {
          resolvedUser = setData.user;
        }
      } catch {
        // Ignore non-JWT session error
      }
    }

    if (typeof window !== 'undefined') {
      try {
        const existingProfileRaw = window.localStorage.getItem('dhanak_profile_data');
        if (existingProfileRaw) {
          const parsedProfile = JSON.parse(existingProfileRaw);
          if (parsedProfile?.user_id && parsedProfile.user_id !== resolvedUser.id) {
            window.localStorage.removeItem('dhanak_profile_data');
          }
        }
      } catch {
        window.localStorage.removeItem('dhanak_profile_data');
      }
      window.localStorage.setItem('dhanak_auth_user', JSON.stringify(resolvedUser));
    }

    setUser(resolvedUser);
    return resolvedUser;
  }, []);

  const devLogin = useCallback(async (customEmail) => {
    const email = (customEmail || 'dhanak2026@iist.ac.in').toLowerCase();
    const hexPart = Math.random().toString(36).substring(2, 8);
    const mockUser = {
      id: `dhanak_user_${hexPart}`,
      email,
      email_confirmed_at: new Date().toISOString(),
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

  const authenticate = useCallback(
    async (email, password, mode = 'login') => {
      const trimmedEmail = email.trim().toLowerCase();

      try {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: trimmedEmail, password, mode }),
        });
        const data = await res.json().catch(() => ({}));

        if (data?.requiresVerification) {
          return {
            requiresVerification: true,
            email: data.email || trimmedEmail,
            message: data.message || null,
            error: data.error || null,
          };
        }

        if (!res.ok || data.error) {
          return { error: data.error || 'Authentication failed.' };
        }

        if (data?.session?.user) {
          const resolvedUser = await applyAuthSession(data.session);
          return { user: resolvedUser, created: data.created };
        }

        return { error: 'Authentication failed. Please check your credentials.' };
      } catch (err) {
        return { error: err.message || 'Connection error. Please try again.' };
      }
    },
    [applyAuthSession]
  );

  const verifyEmailOtp = useCallback(
    async (email, otp) => {
      const trimmedEmail = email.trim().toLowerCase();
      try {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: trimmedEmail, otp: String(otp || '').trim(), mode: 'verify-otp' }),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok || data.error) {
          return { error: data.error || 'Invalid or expired verification code.' };
        }

        if (data?.session?.user) {
          const resolvedUser = await applyAuthSession(data.session);
          return { user: resolvedUser, verified: true };
        }

        return { error: 'Could not verify code. Please try again.' };
      } catch (err) {
        return { error: err.message || 'Connection error. Please try again.' };
      }
    },
    [applyAuthSession]
  );

  const resendVerificationEmail = useCallback(async (email) => {
    const trimmedEmail = email.trim().toLowerCase();
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, mode: 'resend' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        return { error: data.error || 'Could not resend verification email.' };
      }
      return { ok: true, message: data.message || 'Verification email resent!' };
    } catch (err) {
      return { error: err.message || 'Connection error. Please try again.' };
    }
  }, []);

  const requestPasswordReset = useCallback(async (email) => {
    const trimmedEmail = email.trim().toLowerCase();
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, mode: 'forgot-password' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        return { error: data.error || 'Could not send password reset OTP.' };
      }
      return {
        ok: true,
        message: data.message || 'Password reset OTP sent! Please check your inbox and spam folder.',
      };
    } catch (err) {
      return { error: err.message || 'Connection error. Please try again.' };
    }
  }, []);

  const resetPasswordWithOtp = useCallback(async (email, otp, newPassword) => {
    const trimmedEmail = email.trim().toLowerCase();
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmedEmail,
          otp: String(otp || '').trim(),
          newPassword,
          mode: 'reset-password',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        return { error: data.error || 'Could not reset password. Please check your OTP and try again.' };
      }
      return {
        ok: true,
        message: data.message || 'Password updated successfully! Please sign in with your new password.',
      };
    } catch (err) {
      return { error: err.message || 'Connection error. Please try again.' };
    }
  }, []);

  const authenticateWithGoogle = useCallback(
    async (idToken) => {
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
        const resolvedUser = await applyAuthSession(data.session);
        return { user: resolvedUser, created: data.created };
      }

      return { error: 'Invalid Google session' };
    },
    [applyAuthSession]
  );

  const signInWithGoogleOAuth = useCallback(async (redirectPath = '/') => {
    if (!isSupabaseConfigured()) {
      return { error: 'Supabase is not configured.' };
    }
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey =
        process.env.NEXT_PUBLIC_SUPABASE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      // Verify Google provider is actually enabled in Supabase before redirecting,
      // otherwise Supabase renders a raw 400 JSON error page ("Unsupported provider").
      if (supabaseUrl && supabaseKey) {
        const settingsRes = await fetch(`${supabaseUrl}/auth/v1/settings`, {
          headers: { apikey: supabaseKey },
        }).catch(() => null);
        if (settingsRes?.ok) {
          const settings = await settingsRes.json().catch(() => null);
          if (settings?.external && settings.external.google === false) {
            return {
              error: 'Unsupported provider: provider is not enabled',
            };
          }
        }
      }

      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const redirectTo = `${origin}/login?redirect=${encodeURIComponent(redirectPath)}`;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            prompt: 'select_account',
          },
        },
      });
      if (error) {
        return { error: error.message };
      }
      return { data };
    } catch (err) {
      return { error: err.message || 'Google Sign-In failed.' };
    }
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
      window.sessionStorage.removeItem('dhanak_profile_modal_dismissed');
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
        verifyEmailOtp,
        resendVerificationEmail,
        requestPasswordReset,
        resetPasswordWithOtp,
        authenticateWithGoogle,
        signInWithGoogleOAuth,
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
