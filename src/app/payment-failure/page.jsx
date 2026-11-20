'use client';

import { Suspense, useMemo, useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  RotateCcw,
  ShoppingCart,
  HelpCircle,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { FEST_FULL_NAME, CONTACT_EMAIL } from '@/lib/festConfig';
import { useCart } from '../context/CartContext';

export default function PaymentFailurePage() {
  return (
    <Suspense fallback={<FailureSkeleton />}>
      <FailureContent />
    </Suspense>
  );
}

function FailureSkeleton() {
  return (
    <div className="min-h-screen bg-[#090B0E] flex items-center justify-center text-white">
      <p className="text-xs font-mono uppercase tracking-widest text-white/60">
        Loading Payment Status…
      </p>
    </div>
  );
}

function FailureContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clear } = useCart();

  const reasonParam = searchParams.get('reason') || searchParams.get('desc') || '';
  const codeParam = searchParams.get('code') || '';
  const orderId = searchParams.get('order_id') || searchParams.get('orderId') || '';
  const paymentId = searchParams.get('payment_id') || searchParams.get('paymentId') || '';

  const isTimeout = codeParam === 'PAYMENT_TIMEOUT';
  const [reconciling, setReconciling] = useState(false);
  const [reconcileNotice, setReconcileNotice] = useState('');
  const [lateVerified, setLateVerified] = useState(false);

  // Reconciles with Razorpay servers in case the user paid right at/after the 5-minute mark
  const checkLateBoundaryPayment = useCallback(
    async (silent = false) => {
      if (!orderId || lateVerified) return false;
      if (!silent) {
        setReconciling(true);
        setReconcileNotice('Checking with Razorpay if a late boundary payment was captured…');
      }

      try {
        let storedDetails = {};
        let storedItems = [];
        let storedTeams = null;
        let storedEmail = '';
        if (typeof window !== 'undefined') {
          try {
            storedDetails = JSON.parse(
              window.localStorage.getItem('registration_details') || '{}'
            );
            storedItems = JSON.parse(
              window.localStorage.getItem('selected_workshops_meta') || '[]'
            );
            storedTeams = JSON.parse(
              window.localStorage.getItem('dhanak_draft_teams') || 'null'
            );
            storedEmail = window.localStorage.getItem('registration_email') || '';
          } catch {
            // ignore
          }
        }

        const res = await fetch('/api/razorpay/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reconcile: true,
            order_id: orderId,
            email: storedDetails.email || storedEmail,
            user_id: storedDetails.userId || '',
            workshop_ids: Array.isArray(storedItems)
              ? storedItems.map((i) => i.id)
              : [],
            items: Array.isArray(storedItems) ? storedItems : [],
            details: storedDetails,
            teams: storedTeams,
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (res.ok && data.verified && data.paymentId) {
          setLateVerified(true);
          setReconcileNotice(
            'Late payment detected & verified! Redirecting to your confirmed pass…'
          );
          if (typeof window !== 'undefined') {
            window.localStorage.setItem('razorpay_payment_id', data.paymentId);
            window.localStorage.setItem('razorpay_order_id', orderId);
            window.localStorage.setItem('tiqr_booking_uid', data.paymentId);
          }
          await clear();
          const successQuery = new URLSearchParams({
            uid: data.paymentId,
            order_id: orderId,
            reconciled: '1',
          });
          router.push(`/payment-success?${successQuery.toString()}`);
          return true;
        } else if (!silent) {
          setReconcileNotice(
            'No completed payment was found for this order. The expired order remains cancelled.'
          );
        }
      } catch {
        if (!silent) {
          setReconcileNotice('Could not reach payment server. Please try again.');
        }
      } finally {
        if (!silent) {
          setReconciling(false);
        }
      }
      return false;
    },
    [clear, lateVerified, orderId, router]
  );

  // Automatic post-timeout grace polling (2s, 6s, 14s) in case a UPI/Bank callback settled
  // a few seconds after the 5-minute window expired.
  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    const delays = isTimeout ? [2000, 6000, 14000] : [3000];
    const timers = delays.map((ms) =>
      setTimeout(() => {
        if (!cancelled) {
          checkLateBoundaryPayment(true);
        }
      }, ms)
    );
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [checkLateBoundaryPayment, isTimeout, orderId]);

  const friendlyReason = useMemo(() => {
    if (reasonParam) return reasonParam;
    if (codeParam === 'PAYMENT_TIMEOUT') {
      return 'The 5-minute payment window expired and your order was automatically cancelled.';
    }
    if (codeParam === 'PAYMENT_CANCELLED' || codeParam === 'CANCELLED') {
      return 'The payment window was closed before completing authorization.';
    }
    if (codeParam === 'BAD_REQUEST_ERROR') {
      return 'The transaction request could not be completed by the bank or gateway.';
    }
    return 'Your payment was not completed or authorization was interrupted.';
  }, [reasonParam, codeParam]);

  return (
    <div className="relative min-h-[calc(100dvh-5rem)] bg-[#090B0E] text-white pt-24 pb-20 px-4 sm:px-6 flex items-center justify-center overflow-hidden">
      {/* Subtle crimson radial backdrop */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_25%,rgba(220,38,38,0.12),transparent_65%)]" />

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="relative z-10 w-full max-w-lg rounded-2xl border border-red-500/25 bg-[#101217] p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.8)] text-center"
      >
        {/* Glowing Warning Icon */}
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.25)]">
          {lateVerified ? (
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          ) : isTimeout ? (
            <Clock className="h-8 w-8 text-amber-400" />
          ) : (
            <AlertTriangle className="h-8 w-8" />
          )}
        </div>

        <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-red-400 font-bold mb-1.5">
          {FEST_FULL_NAME} · Payment Status
        </p>
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mb-3">
          {lateVerified
            ? 'Late Payment Verified!'
            : isTimeout
              ? 'Order Cancelled (5-Min Timeout)'
              : 'Payment Not Completed'}
        </h1>
        <p className="text-sm text-white/70 leading-relaxed max-w-md mx-auto mb-6">
          {friendlyReason}
        </p>

        {/* Reassurance Banner */}
        <div className="rounded-xl border border-white/10 bg-[#0B0D11] p-4 text-left text-xs space-y-2 mb-6">
          <div className="flex items-start gap-2.5 text-white/80">
            <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <span className="font-bold text-white">No money was lost.</span> If you completed payment right as the 5-minute window ended, our server automatically reconciles and issues your pass—or your bank will automatically refund any uncaptured debit within 3 to 5 business days.
            </p>
          </div>

          {reconcileNotice && (
            <div
              className={`mt-2 rounded-lg border px-3 py-2 text-[11px] font-medium ${
                lateVerified
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                  : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
              }`}
            >
              {reconcileNotice}
            </div>
          )}

          {(orderId || paymentId) && (
            <div className="border-t border-white/10 pt-2.5 mt-2.5 font-mono text-[11px] text-white/50 space-y-1">
              {orderId && (
                <p className="truncate">
                  <span className="text-white/30 uppercase">Order ID:</span> {orderId}
                </p>
              )}
              {paymentId && (
                <p className="truncate">
                  <span className="text-white/30 uppercase">Payment ID:</span> {paymentId}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {orderId && !lateVerified && (
            <button
              type="button"
              onClick={() => checkLateBoundaryPayment(false)}
              disabled={reconciling}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 px-4 py-3 text-xs font-bold uppercase tracking-wider text-amber-300 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${reconciling ? 'animate-spin' : ''}`} />
              <span>
                {reconciling
                  ? 'Checking Razorpay Server…'
                  : 'Paid Right at the 5-Min Mark? Verify Status'}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => router.push('/payment')}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-black hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer shadow-lg shadow-orange-500/20"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Try Payment Again</span>
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <Link
              href="/cart"
              className="flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-[#141820] px-4 py-2.5 text-xs font-semibold text-white/80 hover:text-white hover:border-white/30 transition-colors"
            >
              <ShoppingCart className="h-3.5 w-3.5 text-orange-400" />
              <span>Review Cart</span>
            </Link>

            <Link
              href="/contact-us"
              className="flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-[#141820] px-4 py-2.5 text-xs font-semibold text-white/80 hover:text-white hover:border-white/30 transition-colors"
            >
              <HelpCircle className="h-3.5 w-3.5 text-orange-400" />
              <span>Contact Support</span>
            </Link>
          </div>
        </div>

        <p className="mt-6 text-[11px] text-white/40">
          Need immediate assistance? Email us at{' '}
          <span className="text-white/70 font-mono">{CONTACT_EMAIL || 'helpdesk.dhanak2027@gmail.com'}</span>
        </p>
      </motion.div>
    </div>
  );
}

