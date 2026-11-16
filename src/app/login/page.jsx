'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import GoogleSignInButton from '../components/GoogleSignInButton';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTarget = searchParams?.get('redirect') || '/';
  const verifiedParam = searchParams?.get('verified') === '1';

  const {
    user,
    authenticate,
    verifyEmailOtp,
    resendVerificationEmail,
    requestPasswordReset,
    resetPasswordWithOtp,
    authenticateWithGoogle,
    signInWithGoogleOAuth,
  } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'create' | 'verify' | 'forgot' | 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState(
    verifiedParam ? 'Email verified! Please sign in below if not redirected automatically.' : ''
  );
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  // Redirect once authenticated
  useEffect(() => {
    if (user?.email) {
      window.location.href = redirectTarget;
    }
  }, [user, redirectTarget]);

  const handleGoogleCredential = async (idToken) => {
    setError('');
    setInfoMessage('');
    setGoogleBusy(true);
    const result = await authenticateWithGoogle(idToken);
    setGoogleBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    window.location.href = redirectTarget;
  };

  const handleGoogleOAuthClick = async () => {
    setError('');
    setInfoMessage('');
    setGoogleBusy(true);
    const result = await signInWithGoogleOAuth(redirectTarget);
    setGoogleBusy(false);
    if (result?.error) {
      if (/provider is not enabled|unsupported provider/i.test(result.error)) {
        setError(
          'Google Sign-In is not enabled on the Supabase project yet. Enable it in Supabase Dashboard → Authentication → Providers → Google (with your Google Client ID & Secret) or set NEXT_PUBLIC_GOOGLE_CLIENT_ID in your environment variables.'
        );
      } else {
        setError(result.error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (mode === 'create' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setBusy(true);
    const result = await authenticate(email.trim(), password, mode);
    setBusy(false);

    if (result.requiresVerification) {
      setMode('verify');
      if (result.message) setInfoMessage(result.message);
      if (result.error) setError(result.error);
      return;
    }

    if (result.error) {
      setError(result.error);
      return;
    }

    window.location.href = redirectTarget;
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    if (!otp.trim()) {
      setError('Please enter the verification code from your email.');
      return;
    }
    setBusy(true);
    const result = await verifyEmailOtp(email.trim(), otp.trim());
    setBusy(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    window.location.href = redirectTarget;
  };

  const handleResendEmail = async () => {
    setError('');
    setInfoMessage('');
    setResending(true);
    const result = await resendVerificationEmail(email.trim());
    setResending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setInfoMessage(result.message || 'Verification email resent! Please check your inbox and spam folder.');
  };

  const handleRequestPasswordReset = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    setError('');
    setInfoMessage('');
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your registered email address.');
      return;
    }
    setBusy(true);
    const result = await requestPasswordReset(trimmedEmail);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setOtp('');
    setPassword('');
    setConfirmPassword('');
    setMode('reset');
    setInfoMessage(result.message || 'Password reset OTP sent! Please check your inbox and spam folder.');
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    if (!otp.trim()) {
      setError('Please enter the verification OTP sent to your email.');
      return;
    }
    if (!password || password.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    setBusy(true);
    const result = await resetPasswordWithOtp(email.trim(), otp.trim(), password);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setOtp('');
    setPassword('');
    setConfirmPassword('');
    setMode('login');
    setInfoMessage(result.message || 'Password updated successfully! Please sign in with your new password.');
  };

  return (
    <div className="relative min-h-[calc(100dvh-12rem)] bg-[#030508] text-white overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,69,0,0.12),transparent_55%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)',
          backgroundSize: '72px 72px',
        }}
      />

      <div className="relative z-10 mx-auto max-w-md px-6 pt-32 pb-24 md:pt-36">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="section-eyebrow mb-4"
        >
          Dhanak 2027
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="section-heading text-3xl md:text-5xl mb-3"
        >
          {mode === 'verify'
            ? 'Verify Email'
            : mode === 'forgot'
              ? 'Forgot Password'
              : mode === 'reset'
                ? 'Reset Password'
                : mode === 'login'
                  ? 'Sign In'
                  : 'Create Account'}
        </motion.h1>
        <p className="text-white/50 text-xs mb-6">
          {mode === 'verify'
            ? `We sent a verification code & link to ${email}. Verify your email to activate your account.`
            : mode === 'forgot'
              ? 'Enter your registered email address and we will send a verification OTP to reset your password.'
              : mode === 'reset'
                ? `Enter the OTP sent to ${email} along with your new password.`
                : 'Sign up or sign in with Google, or use your email address below.'}
        </p>

        {(mode === 'login' || mode === 'create') && (
          <>
            {/* Google Sign-in / Sign-up */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4"
            >
              <GoogleSignInButton
                mode={mode}
                onCredential={handleGoogleCredential}
                onOAuthClick={handleGoogleOAuthClick}
                disabled={googleBusy || busy}
              />
            </motion.div>

            <div className="mb-4 flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-white/30">
              <span className="h-px flex-1 bg-white/10" />
              or {mode === 'create' ? 'sign up' : 'sign in'} with email
              <span className="h-px flex-1 bg-white/10" />
            </div>

            <div className="mb-6 inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1">
              {[
                ['login', 'Sign In'],
                ['create', 'Create Account'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setMode(key);
                    setError('');
                    setInfoMessage('');
                  }}
                  className={`rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] transition-colors cursor-pointer ${
                    mode === key
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-black'
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </>
        )}

        {mode === 'verify' ? (
          <motion.form
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleVerifyOtp}
            className="glass-card space-y-4 rounded-2xl p-6"
          >
            {infoMessage && (
              <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-300 leading-relaxed">
                {infoMessage}
              </p>
            )}

            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5 text-xs text-white/70 space-y-1.5 leading-relaxed">
              <p className="font-semibold text-amber-300">How to complete verification:</p>
              <p>1. Open the email sent to <span className="font-mono text-white">{email}</span> (check Spam/Promotions too).</p>
              <p>2. Click the <span className="text-white font-semibold">Confirm your mail</span> link in the email, OR enter the verification code below if included.</p>
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-white/40">
                Verification Code (if provided in email)
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={10}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\s+/g, ''))}
                className="w-full rounded-lg border border-white/15 bg-black/40 px-4 py-2.5 text-center font-mono text-base tracking-[0.3em] text-white outline-none focus:border-orange-500"
                placeholder="Enter code"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="btn-primary w-full cursor-pointer"
            >
              {busy ? 'Verifying…' : 'Verify Code & Sign In'}
            </button>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 text-xs">
              <button
                type="button"
                disabled={resending}
                onClick={handleResendEmail}
                className="text-orange-400 hover:text-amber-300 font-semibold underline cursor-pointer disabled:opacity-50"
              >
                {resending ? 'Resending email…' : 'Resend Verification Email'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                  setInfoMessage('Already clicked the email link? Sign in below.');
                }}
                className="text-white/50 hover:text-white cursor-pointer"
              >
                Already verified? Sign In →
              </button>
            </div>
          </motion.form>
        ) : mode === 'forgot' ? (
          <motion.form
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleRequestPasswordReset}
            className="glass-card space-y-4 rounded-2xl p-6"
          >
            <div>
              <label className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-white/40">
                Registered Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-orange-500"
                placeholder="you@example.com"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {error}
              </p>
            )}

            <button type="submit" disabled={busy} className="btn-primary w-full cursor-pointer">
              {busy ? 'Sending OTP…' : 'Send Reset OTP'}
            </button>

            <div className="flex justify-center pt-1 text-xs">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                  setInfoMessage('');
                }}
                className="text-white/60 hover:text-orange-400 cursor-pointer"
              >
                ← Back to Sign In
              </button>
            </div>
          </motion.form>
        ) : mode === 'reset' ? (
          <motion.form
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleResetPasswordSubmit}
            className="glass-card space-y-4 rounded-2xl p-6"
          >
            {infoMessage && (
              <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-300 leading-relaxed">
                {infoMessage}
              </p>
            )}

            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5 text-xs text-white/70 leading-relaxed">
              Check the password reset email sent to <span className="font-mono text-white">{email}</span> (including Spam/Promotions), enter the OTP below, and set your new password.
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-white/40">
                Verification OTP
              </label>
              <input
                type="text"
                inputMode="numeric"
                required
                maxLength={10}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\s+/g, ''))}
                className="w-full rounded-lg border border-white/15 bg-black/40 px-4 py-2.5 text-center font-mono text-base tracking-[0.3em] text-white outline-none focus:border-orange-500"
                placeholder="Enter OTP"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-white/40">
                New Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-orange-500"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-white/40">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-orange-500"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {error}
              </p>
            )}

            <button type="submit" disabled={busy} className="btn-primary w-full cursor-pointer">
              {busy ? 'Updating Password…' : 'Update Password'}
            </button>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 text-xs">
              <button
                type="button"
                disabled={busy}
                onClick={handleRequestPasswordReset}
                className="text-orange-400 hover:text-amber-300 font-semibold underline cursor-pointer disabled:opacity-50"
              >
                Resend Reset OTP
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                  setInfoMessage('');
                  setOtp('');
                  setPassword('');
                  setConfirmPassword('');
                }}
                className="text-white/50 hover:text-white cursor-pointer"
              >
                ← Back to Sign In
              </button>
            </div>
          </motion.form>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onSubmit={handleSubmit}
            className="glass-card space-y-4 rounded-2xl p-6"
          >
            {infoMessage && (
              <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                {infoMessage}
              </p>
            )}

            <div>
              <label className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-white/40">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-orange-500"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-[10px] uppercase tracking-[0.2em] text-white/40">
                  Password
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setError('');
                      setInfoMessage('');
                      setPassword('');
                      setConfirmPassword('');
                      setOtp('');
                    }}
                    className="text-[11px] font-medium text-orange-400 hover:text-amber-300 cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-orange-500"
                placeholder="••••••••"
              />
            </div>

            {mode === 'create' && (
              <div>
                <label className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-white/40">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-orange-500"
                  placeholder="••••••••"
                />
              </div>
            )}

            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {error}
              </p>
            )}

            <button type="submit" disabled={busy} className="btn-primary w-full cursor-pointer">
              {busy ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account & Verify Email'}
            </button>
          </motion.form>
        )}

        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-orange-400 transition-colors"
        >
          ← Back home
        </Link>
      </div>
    </div>
  );
}
