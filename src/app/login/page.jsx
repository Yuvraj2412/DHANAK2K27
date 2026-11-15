'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
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
  const { authenticate, authenticateWithGoogle } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'create'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  const handleGoogleCredential = async (idToken) => {
    setError('');
    setGoogleBusy(true);
    const result = await authenticateWithGoogle(idToken);
    setGoogleBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    // Always redirect to home page after sign-in
    window.location.href = '/';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'create' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setBusy(true);
    const result = await authenticate(email.trim(), password, mode);
    setBusy(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    // Always redirect to home page after sign-up or sign-in
    window.location.href = '/';
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

      <div className="relative z-10 mx-auto max-w-md px-6 pt-28 pb-24 md:pt-32">
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
          {mode === 'login' ? 'Sign In' : 'Create Profile'}
        </motion.h1>
        <p className="text-white/50 text-xs mb-6">
          Sign in with Google or enter your email credentials below.
        </p>

        {/* Google Sign-in */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
          <GoogleSignInButton onCredential={handleGoogleCredential} disabled={googleBusy} />
        </motion.div>

        <div className="mb-4 flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-white/30">
          <span className="h-px flex-1 bg-white/10" />
          or sign in with email
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

        <motion.form
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="glass-card space-y-4 rounded-2xl p-6"
        >
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
            <label className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-white/40">
              Password
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
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </motion.form>

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
