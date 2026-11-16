'use client';

import { useEffect, useId, useRef, useState } from 'react';

/**
 * Renders "Sign in with Google" / "Sign up with Google".
 * - When `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is configured, renders Google Identity Services
 *   button (direct ID token verified via `/api/auth/google`).
 * - When `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is not set, renders a styled Google button that
 *   invokes `onOAuthClick` (Supabase Google OAuth provider flow).
 */
export default function GoogleSignInButton({
  onCredential,
  onOAuthClick,
  disabled,
  mode = 'login',
}) {
  const containerId = useId();
  const containerRef = useRef(null);
  const onCredentialRef = useRef(onCredential);
  onCredentialRef.current = onCredential;
  const [gsiReady, setGsiReady] = useState(false);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) return;

    let cancelled = false;

    function render() {
      if (cancelled || !window.google?.accounts?.id || !containerRef.current) return;
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => onCredentialRef.current?.(response.credential),
        });
        containerRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(containerRef.current, {
          type: 'standard',
          theme: 'filled_black',
          size: 'large',
          shape: 'pill',
          text: mode === 'create' ? 'signup_with' : 'signin_with',
          width: containerRef.current.offsetWidth || 340,
        });
        setGsiReady(true);
      } catch {
        setGsiReady(false);
      }
    }

    if (window.google?.accounts?.id) {
      render();
      return;
    }

    const existing = document.querySelector('script[data-google-identity]');
    if (existing) {
      existing.addEventListener('load', render);
      return () => existing.removeEventListener('load', render);
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.dataset.googleIdentity = 'true';
    script.onload = render;
    document.head.appendChild(script);

    return () => {
      cancelled = true;
    };
  }, [clientId, mode]);

  if (clientId) {
    return (
      <div className={disabled ? 'pointer-events-none opacity-50' : ''}>
        <div id={containerId} ref={containerRef} className="flex justify-center" />
        {!gsiReady && (
          <FallbackGoogleButton
            mode={mode}
            disabled={disabled}
            onClick={onOAuthClick}
          />
        )}
      </div>
    );
  }

  return (
    <FallbackGoogleButton
      mode={mode}
      disabled={disabled}
      onClick={onOAuthClick}
    />
  );
}

function FallbackGoogleButton({ mode, disabled, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex w-full items-center justify-center gap-3 rounded-full border border-white/20 bg-white/[0.06] px-5 py-3 text-xs font-bold tracking-wide text-white transition-all hover:border-orange-500/50 hover:bg-white/[0.12] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
    >
      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="#EA4335"
          d="M12 10.2v3.9h5.5c-.24 1.26-.96 2.33-2.04 3.05l3.3 2.56c1.92-1.77 3.04-4.38 3.04-7.49 0-.72-.06-1.42-.19-2.09H12z"
        />
        <path
          fill="#34A853"
          d="M12 22c2.75 0 5.06-.91 6.75-2.47l-3.3-2.56c-.91.61-2.08.98-3.45.98-2.65 0-4.9-1.79-5.7-4.2H2.89v2.64C4.57 19.73 8.01 22 12 22z"
        />
        <path
          fill="#FBBC05"
          d="M6.3 13.75c-.2-.61-.32-1.26-.32-1.95s.12-1.34.32-1.95V7.21H2.89A9.96 9.96 0 0 0 2 11.8c0 1.61.39 3.13 1.08 4.48l3.22-2.53z"
        />
        <path
          fill="#4285F4"
          d="M12 5.65c1.5 0 2.84.52 3.9 1.53l2.92-2.92C17.05 2.61 14.75 1.6 12 1.6 8.01 1.6 4.57 3.87 2.89 7.21l3.41 2.64c.8-2.41 3.05-4.2 5.7-4.2z"
        />
      </svg>
      <span>{mode === 'create' ? 'Sign up with Google' : 'Sign in with Google'}</span>
    </button>
  );
}
