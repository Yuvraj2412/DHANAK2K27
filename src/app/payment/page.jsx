'use client';

import { Suspense, useEffect, useState, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  Lock,
  CreditCard,
  Building2,
  Smartphone,
  QrCode,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import useProfile from '../hooks/useProfile';
import { loadRazorpayScript, saveCheckoutSessionToStorage } from '@/lib/checkout';
import { RAZORPAY_LOGO_DATA_URL } from '@/lib/razorpayLogo';
import TeamRosterBuilder from '../components/TeamRosterBuilder';

export default function PaymentGatewayPage() {
  return (
    <Suspense fallback={<PaymentSkeleton />}>
      <RazorpayStandardCheckoutPage />
    </Suspense>
  );
}

function PaymentSkeleton() {
  return (
    <div className="min-h-screen bg-[#090B0E] flex items-center justify-center text-white">
      <p className="text-xs font-mono uppercase tracking-widest text-white/60">
        Loading Razorpay Standard Checkout…
      </p>
    </div>
  );
}

function RazorpayStandardCheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { items, clear } = useCart();
  const { profile } = useProfile();

  const [mounted, setMounted] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [gatewayStatus, setGatewayStatus] = useState({
    loading: true,
    configured: false,
    mode: 'unconfigured',
    keyId: null,
  });

  const [processing, setProcessing] = useState(false);
  const [processStep, setProcessStep] = useState('');
  const [errorBanner, setErrorBanner] = useState(null);
  const [activeOrderId, setActiveOrderId] = useState('');
  const [teamState, setTeamState] = useState({ teams: {}, isAllTeamsValid: true });
  const [remainingSeconds, setRemainingSeconds] = useState(null);

  const autoStartedRef = useRef(false);
  const rzpInstanceRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const paymentCompletedOrVerifyingRef = useRef(false);

  const clearPaymentTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setRemainingSeconds(null);
  }, []);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setMounted(true);
    loadRazorpayScript().then((ok) => {
      if (ok) setSdkReady(true);
    });

    fetch('/api/razorpay/create-order')
      .then((res) => res.json())
      .then((data) => {
        setGatewayStatus({
          loading: false,
          configured: Boolean(data?.configured),
          mode: data?.mode || 'unconfigured',
          keyId: data?.keyId || null,
        });
      })
      .catch(() => {
        setGatewayStatus((prev) => ({ ...prev, loading: false }));
      });
  }, []);

  // Resolve cart items from CartContext or saved checkout session in localStorage
  const displayItems = useMemo(() => {
    if (items && items.length > 0) return items;

    if (typeof window !== 'undefined') {
      try {
        const stored = window.localStorage.getItem('selected_workshops_meta');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {
        // ignore
      }
    }

    return [
      {
        id: 'basic-uav-tech',
        kind: 'workshop',
        title: 'Basic UAV Technology and Careers in the UAV Domain',
        subtitle: '27th December 2026 · Online Live Workshop',
        qty: 1,
        unitPrice: 349,
      },
    ];
  }, [items]);

  // Resolve attendee details from localStorage or profile/auth
  const attendeeDetails = useMemo(() => {
    let storedDetails = {};
    if (typeof window !== 'undefined') {
      try {
        storedDetails = JSON.parse(
          window.localStorage.getItem('registration_details') || '{}'
        );
      } catch {
        storedDetails = {};
      }
    }

    return {
      name:
        storedDetails.name ||
        profile?.name ||
        user?.user_metadata?.name ||
        'Dhanak Participant',
      email:
        storedDetails.email ||
        user?.email ||
        (typeof window !== 'undefined'
          ? window.localStorage.getItem('registration_email')
          : '') ||
        '',
      phone: storedDetails.phone || profile?.phone || '',
      college: storedDetails.college || profile?.college || '',
      college_id: storedDetails.college_id || profile?.college_id || '',
      aadhaar_number:
        storedDetails.aadhaar_number || profile?.aadhaar_number || '',
      city: storedDetails.city || profile?.city || '',
      gender: storedDetails.gender || profile?.gender || '',
      userId: storedDetails.userId || user?.id || '',
    };
  }, [profile, user]);

  const totalAmount = useMemo(() => {
    return displayItems.reduce((acc, item) => {
      const p = typeof item.unitPrice === 'number' ? item.unitPrice : 0;
      const q = item.qty || 1;
      return acc + p * q;
    }, 0);
  }, [displayItems]);

  /**
   * Official Razorpay Standard Checkout Flow:
   * Step 1.2: Create Order on Server (`POST /api/razorpay/create-order`)
   * Step 1.3: Open Razorpay Standard Checkout (`https://checkout.razorpay.com/v1/checkout.js`)
   * Step 1.4 & 1.5: Verify HMAC-SHA256 Signature on Server (`POST /api/razorpay/verify`)
   * Step 1.6: Redirect to `/payment-success` & issue passes
   */
  const handleRazorpayCheckout = useCallback(async () => {
    if (processing) return;
    setErrorBanner(null);

    // Trigger check: verify all teams are complete or explicitly permitted
    if (!teamState.isAllTeamsValid) {
      setErrorBanner({
        title: 'Team Roster Incomplete',
        message:
          'Please complete all required team members or check the confirmation box to proceed with an incomplete team.',
      });
      return;
    }

    setProcessing(true);
    setProcessStep('Creating Razorpay order on server…');

    try {
      // Save checkout snapshot in localStorage so /payment-success has full context
      saveCheckoutSessionToStorage(displayItems, attendeeDetails, teamState.teams);

      // Step 1: Load official Razorpay checkout.js script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || typeof window.Razorpay !== 'function') {
        throw new Error(
          'Razorpay Checkout SDK failed to load. Please check your internet connection and try again.'
        );
      }
      setSdkReady(true);

      // Step 2: Create Razorpay Order on the backend (`POST /api/razorpay/create-order`)
      const orderRes = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totalAmount,
          currency: 'INR',
          receipt: `dhn_${Date.now()}`,
          items: displayItems,
          customer: attendeeDetails,
          notes: {
            email: attendeeDetails.email,
            name: attendeeDetails.name,
            phone: attendeeDetails.phone,
            college: attendeeDetails.college,
            college_id: attendeeDetails.college_id,
            user_id: attendeeDetails.userId,
            workshop_ids: displayItems.map((i) => i.id).join(','),
          },
        }),
      });

      const orderData = await orderRes.json().catch(() => ({}));

      if (!orderRes.ok || !orderData.success) {
        throw new Error(
          orderData.message ||
            'Could not create Razorpay order. Please check your API keys in .env.local.'
        );
      }

      // Handle ₹0 (Free) orders directly
      if (orderData.free) {
        const freeUid = orderData.orderId || `free_${Date.now()}`;
        window.localStorage.setItem('tiqr_booking_uid', freeUid);
        await clear();
        router.push(`/payment-success?uid=${encodeURIComponent(freeUid)}`);
        return;
      }

      setActiveOrderId(orderData.orderId);
      window.localStorage.setItem('razorpay_order_id', orderData.orderId);
      setProcessStep('Opening Razorpay Standard Checkout…');

      const itemSummary = displayItems
        .map((i) => i.title)
        .filter(Boolean)
        .join(', ')
        .slice(0, 240);

      const timeoutSecs = Number(orderData.timeoutSeconds) || 300; // 5 minutes
      const expiresAtMs =
        Number(orderData.expiresAt) || Date.now() + timeoutSecs * 1000;
      paymentCompletedOrVerifyingRef.current = false;

      // Step 3: Configure Official Razorpay Standard Checkout Options
      const options = {
        key:
          orderData.keyId ||
          gatewayStatus.keyId ||
          process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount, // Amount in currency subunits (paise)
        currency: orderData.currency || 'INR',
        name: 'Dhanak 2027 · IIST',
        description: itemSummary || 'Dhanak 2027 Fest Registration & Passes',
        image: RAZORPAY_LOGO_DATA_URL,
        order_id: orderData.orderId,
        timeout: timeoutSecs, // Official Razorpay 5-minute (300s) payment window
        prefill: {
          name: attendeeDetails.name || '',
          email: attendeeDetails.email || '',
          contact: String(attendeeDetails.phone || '')
            .replace(/\D/g, '')
            .slice(-10),
        },
        notes: {
          email: attendeeDetails.email || '',
          name: attendeeDetails.name || '',
          phone: attendeeDetails.phone || '',
          college: attendeeDetails.college || '',
          college_id: attendeeDetails.college_id || '',
          workshop_ids: displayItems
            .map((i) => i.id)
            .join(',')
            .slice(0, 240),
        },
        theme: {
          color: '#FF4500',
        },
        modal: {
          confirm_close: true,
          ondismiss: function () {
            if (paymentCompletedOrVerifyingRef.current) return;
            clearPaymentTimer();
            setProcessing(false);
            setProcessStep('');
          },
        },
        // Step 4 & 5: Handle successful payment & verify HMAC-SHA256 signature on server
        handler: async function (response) {
          paymentCompletedOrVerifyingRef.current = true;
          clearPaymentTimer();
          try {
            setProcessing(true);
            setProcessStep('Verifying payment signature with Razorpay…');

            const {
              razorpay_payment_id,
              razorpay_order_id,
              razorpay_signature,
            } = response;

            window.localStorage.setItem(
              'razorpay_payment_id',
              razorpay_payment_id || ''
            );
            window.localStorage.setItem(
              'razorpay_order_id',
              razorpay_order_id || ''
            );
            window.localStorage.setItem(
              'razorpay_signature',
              razorpay_signature || ''
            );
            window.localStorage.setItem(
              'tiqr_booking_uid',
              razorpay_payment_id || ''
            );

            const verifyRes = await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature,
                email: attendeeDetails.email,
                user_id: attendeeDetails.userId,
                workshop_ids: displayItems.map((i) => i.id),
                items: displayItems,
                details: attendeeDetails,
                amount: totalAmount,
                teams: teamState.teams || null,
              }),
            });

            const verifyData = await verifyRes.json().catch(() => ({}));

            if (!verifyRes.ok || !verifyData.success || !verifyData.verified) {
              throw new Error(
                verifyData.message ||
                  'Payment signature verification failed. Please contact support with your Payment ID: ' +
                    razorpay_payment_id
              );
            }

            setProcessStep('Payment verified! Generating your fest passes…');
            await clear();

            const query = new URLSearchParams({
              uid: razorpay_payment_id,
              order_id: razorpay_order_id,
              signature: razorpay_signature,
            });
            router.push(`/payment-success?${query.toString()}`);
          } catch (verifyErr) {
            setProcessing(false);
            setProcessStep('');
            const failQuery = new URLSearchParams({
              order_id: response?.razorpay_order_id || '',
              payment_id: response?.razorpay_payment_id || '',
              reason:
                verifyErr.message ||
                'Could not verify payment signature. Please check your profile or contact support.',
            });
            router.push(`/payment-failure?${failQuery.toString()}`);
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzpInstanceRef.current = rzp;

      // Official Step: Handle payment failure event from Razorpay Standard Checkout
      rzp.on('payment.failed', function (response) {
        if (paymentCompletedOrVerifyingRef.current) return;
        clearPaymentTimer();
        const errInfo = response?.error || {};
        const reason =
          errInfo.description ||
          errInfo.reason ||
          'Your payment could not be completed.';
        const failureQuery = new URLSearchParams({
          order_id: errInfo.metadata?.order_id || orderData.orderId || '',
          payment_id: errInfo.metadata?.payment_id || '',
          reason: reason,
          code: errInfo.code || '',
        });
        setProcessing(false);
        setProcessStep('');
        router.push(`/payment-failure?${failureQuery.toString()}`);
      });

      // Start 5-Minute (300s) Wall-Clock Payment Window Countdown + Boundary Race Catch
      clearPaymentTimer();
      setRemainingSeconds(timeoutSecs);
      timerIntervalRef.current = setInterval(async () => {
        if (paymentCompletedOrVerifyingRef.current) {
          clearPaymentTimer();
          return;
        }
        const secsLeft = Math.max(0, Math.ceil((expiresAtMs - Date.now()) / 1000));
        setRemainingSeconds(secsLeft);

        if (secsLeft <= 0) {
          clearPaymentTimer();
          if (paymentCompletedOrVerifyingRef.current) return;

          // Close the Razorpay modal if still open
          try {
            rzpInstanceRef.current?.close();
          } catch {
            // ignore
          }

          // THE BOUNDARY CATCH: What if the user paid right as the 5-minute timer ended?
          // Reconcile the order directly with Razorpay servers before cancelling!
          setProcessing(true);
          setProcessStep('5-minute window ended — checking for boundary payment…');

          try {
            const reconRes = await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                reconcile: true,
                order_id: orderData.orderId,
                email: attendeeDetails.email,
                user_id: attendeeDetails.userId,
                workshop_ids: displayItems.map((i) => i.id),
                items: displayItems,
                details: attendeeDetails,
                amount: totalAmount,
                teams: teamState.teams || null,
              }),
            });
            const reconData = await reconRes.json().catch(() => ({}));

            if (reconRes.ok && reconData.verified && reconData.paymentId) {
              // User paid right at the 5:00 buzzer! Honor the payment & issue pass!
              paymentCompletedOrVerifyingRef.current = true;
              window.localStorage.setItem('razorpay_payment_id', reconData.paymentId);
              window.localStorage.setItem('razorpay_order_id', orderData.orderId);
              window.localStorage.setItem('tiqr_booking_uid', reconData.paymentId);
              setProcessStep('Boundary payment confirmed! Generating your fest passes…');
              await clear();
              const successQuery = new URLSearchParams({
                uid: reconData.paymentId,
                order_id: orderData.orderId,
                reconciled: '1',
              });
              router.push(`/payment-success?${successQuery.toString()}`);
              return;
            }
          } catch {
            // Proceed to timeout cancellation below
          }

          setProcessing(false);
          setProcessStep('');
          const timeoutQuery = new URLSearchParams({
            order_id: orderData.orderId || '',
            code: 'PAYMENT_TIMEOUT',
            reason:
              'Payment window expired (5:00 timeout). Your order was automatically cancelled because payment was not completed within 5 minutes.',
          });
          router.push(`/payment-failure?${timeoutQuery.toString()}`);
        }
      }, 1000);

      rzp.open();
    } catch (err) {
      setProcessing(false);
      setProcessStep('');
      setErrorBanner({
        title: 'Unable to Initiate Razorpay Checkout',
        message: err.message || 'Something went wrong starting the payment.',
      });
    }
  }, [
    attendeeDetails,
    clear,
    clearPaymentTimer,
    displayItems,
    gatewayStatus.keyId,
    processing,
    router,
    teamState,
    totalAmount,
  ]);

  if (!mounted) {
    return <PaymentSkeleton />;
  }

  return (
    <div
      data-no-lava="true"
      className="min-h-screen bg-[#090B0E] text-white pt-20 pb-16 px-4 sm:px-6"
    >
      {/* Official Razorpay Standard Checkout JS SDK */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
        onLoad={() => setSdkReady(true)}
      />

      <div className="mx-auto max-w-4xl">
        {/* Top Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/cart"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-[#12151B] text-white/80 hover:border-orange-500/40"
              title="Back to Cart"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-orange-400">
                Dhanak 2027 · Official Razorpay Integration
              </p>
              <h1 className="text-lg sm:text-xl font-bold text-white">
                Standard Checkout
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {!gatewayStatus.loading && (
              <div
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-mono uppercase tracking-wider ${
                  gatewayStatus.mode === 'live'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : gatewayStatus.mode === 'test'
                      ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                      : 'border-orange-500/30 bg-orange-500/10 text-orange-300'
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    gatewayStatus.mode === 'live'
                      ? 'bg-emerald-400'
                      : gatewayStatus.mode === 'test'
                        ? 'bg-amber-400'
                        : 'bg-orange-400'
                  }`}
                />
                <span>
                  {gatewayStatus.mode === 'live'
                    ? 'Razorpay Live'
                    : gatewayStatus.mode === 'test'
                      ? 'Razorpay Test Mode'
                      : 'Awaiting API Keys'}
                </span>
              </div>
            )}

            <div className="hidden sm:flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>PCI-DSS Compliant</span>
            </div>
          </div>
        </div>

        {/* Main Two-Column Layout */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left Column: Order Summary & Attendee Details */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-xl border border-white/10 bg-[#111318] p-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-3.5 mb-3.5">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-white/45">
                    {activeOrderId ? 'Razorpay Order ID' : 'Order Status'}
                  </p>
                  <p className="font-mono text-xs font-semibold text-white/90">
                    {activeOrderId || 'Ready to Create Order'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-white/45">
                    Total Payable
                  </p>
                  <p className="text-xl font-bold text-orange-400">
                    ₹{totalAmount}
                  </p>
                </div>
              </div>

              {/* Cart Items Breakdown */}
              <div className="space-y-2.5 mb-4">
                {displayItems.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="flex items-start justify-between rounded-lg border border-white/5 bg-[#0B0D11] p-3 text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-semibold text-white line-clamp-2">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-white/45 mt-0.5">
                        Qty: {item.qty || 1}
                      </p>
                    </div>
                    <span className="font-mono font-semibold text-orange-300 whitespace-nowrap">
                      ₹{(item.unitPrice || 0) * (item.qty || 1)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/10 pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-white/60">
                  <span>Subtotal</span>
                  <span className="font-mono">₹{totalAmount}.00</span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span>Currency</span>
                  <span className="font-mono text-white/80">
                    INR ({totalAmount * 100} paise)
                  </span>
                </div>
                <div className="flex justify-between border-t border-white/10 pt-2 text-sm font-bold text-white">
                  <span>Amount Payable</span>
                  <span className="font-mono text-orange-400">
                    ₹{totalAmount}.00
                  </span>
                </div>
              </div>

              {/* Attendee Info */}
              <div className="mt-4 rounded-lg border border-white/10 bg-[#0B0D11] p-3 text-xs space-y-1">
                <p className="text-[10px] font-mono uppercase tracking-wider text-orange-400">
                  Registrant Details (Prefilled in Razorpay)
                </p>
                <p className="font-semibold text-white truncate">
                  {attendeeDetails.name}
                </p>
                {attendeeDetails.email && (
                  <p className="text-[11px] text-white/60 truncate">
                    {attendeeDetails.email}
                  </p>
                )}
                {attendeeDetails.phone && (
                  <p className="text-[11px] text-white/50 font-mono">
                    +91 {String(attendeeDetails.phone).replace(/\D/g, '').slice(-10)}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#111318] p-3.5 text-xs text-white/55 flex items-start gap-2.5">
              <Lock className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Payments are processed securely via Razorpay Standard Checkout and verified on the server using HMAC-SHA256 cryptographic signatures.
              </p>
            </div>
          </div>

          {/* Right Column: Official Razorpay Standard Checkout Trigger */}
          <div className="lg:col-span-7">
            <div className="rounded-xl border border-white/10 bg-[#111318] p-6 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-orange-400">
                    <ShieldCheck className="h-4 w-4" />
                    Official Razorpay Standard Checkout
                  </span>
                  <h2 className="text-lg font-bold text-white mt-1">
                    Complete Your Payment
                  </h2>
                  <p className="text-xs text-white/55 mt-1">
                    Click below to launch the official Razorpay Checkout modal supporting UPI, QR, Cards, NetBanking, and Wallets.
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="inline-block rounded-md border border-white/10 bg-[#0B0D11] px-2.5 py-1 font-mono text-[10px] text-white/70">
                    {sdkReady ? 'SDK Loaded ✓' : 'Loading SDK…'}
                  </span>
                </div>
              </div>

              {/* Error / Failure Alert if any */}
              {errorBanner && (
                <div className="rounded-xl border border-red-500/35 bg-red-500/10 p-4 text-xs text-red-200 flex items-start gap-3">
                  <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <p className="font-bold text-red-300">{errorBanner.title}</p>
                    <p className="text-red-200/85 leading-relaxed">
                      {errorBanner.message}
                    </p>
                    {(errorBanner.orderId || errorBanner.paymentId) && (
                      <p className="font-mono text-[11px] text-red-300/70 pt-1">
                        {errorBanner.orderId ? `Order: ${errorBanner.orderId} ` : ''}
                        {errorBanner.paymentId ? `· Payment: ${errorBanner.paymentId}` : ''}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Supported Payment Methods on Razorpay Desktop */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] font-mono uppercase tracking-wider text-white/50">
                    Desktop Payment Options on Razorpay
                  </p>
                  <span className="text-[10px] font-mono text-orange-400/80 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                    3 Channels Available
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Option 1: Cards */}
                  <div className="rounded-xl border border-white/10 bg-[#0B0D11] p-4 flex flex-col justify-between hover:border-orange-500/30 transition-colors">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <CreditCard className="h-5 w-5 text-orange-400" />
                        <span className="text-[9px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                          Instant
                        </span>
                      </div>
                      <p className="text-sm font-bold text-white mb-1">Cards</p>
                      <p className="text-[11px] text-white/50 leading-relaxed mb-3">
                        Credit & Debit cards with RBI-compliant tokenization and 3D Secure OTP.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-white/5">
                      <span className="text-[10px] font-mono text-white/70 bg-white/5 px-2 py-0.5 rounded">Visa</span>
                      <span className="text-[10px] font-mono text-white/70 bg-white/5 px-2 py-0.5 rounded">Mastercard</span>
                      <span className="text-[10px] font-mono text-white/70 bg-white/5 px-2 py-0.5 rounded">RuPay</span>
                    </div>
                  </div>

                  {/* Option 2: Netbanking */}
                  <div className="rounded-xl border border-white/10 bg-[#0B0D11] p-4 flex flex-col justify-between hover:border-orange-500/30 transition-colors">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Building2 className="h-5 w-5 text-orange-400" />
                        <span className="text-[9px] font-mono uppercase tracking-wider text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded">
                          50+ Banks
                        </span>
                      </div>
                      <p className="text-sm font-bold text-white mb-1">Netbanking</p>
                      <p className="text-[11px] text-white/50 leading-relaxed mb-3">
                        Direct internet banking access across all major Indian retail and corporate banks.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-white/5">
                      <span className="text-[10px] font-mono text-white/70 bg-white/5 px-2 py-0.5 rounded">SBI</span>
                      <span className="text-[10px] font-mono text-white/70 bg-white/5 px-2 py-0.5 rounded">HDFC</span>
                      <span className="text-[10px] font-mono text-white/70 bg-white/5 px-2 py-0.5 rounded">ICICI</span>
                      <span className="text-[10px] font-mono text-white/70 bg-white/5 px-2 py-0.5 rounded">Axis</span>
                    </div>
                  </div>

                  {/* Option 3: Wallets */}
                  <div className="rounded-xl border border-white/10 bg-[#0B0D11] p-4 flex flex-col justify-between hover:border-orange-500/30 transition-colors">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Smartphone className="h-5 w-5 text-orange-400" />
                        <span className="text-[9px] font-mono uppercase tracking-wider text-white/60 bg-white/5 px-1.5 py-0.5 rounded">
                          Wallets
                        </span>
                      </div>
                      <p className="text-sm font-bold text-white mb-1">Wallets</p>
                      <p className="text-[11px] text-white/50 leading-relaxed mb-3">
                        Quick checkout with your pre-linked digital wallet balances and postpaid credits.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-white/5">
                      <span className="text-[10px] font-mono text-white/70 bg-white/5 px-2 py-0.5 rounded">Mobikwik</span>
                      <span className="text-[10px] font-mono text-white/70 bg-white/5 px-2 py-0.5 rounded">Airtel</span>
                      <span className="text-[10px] font-mono text-white/70 bg-white/5 px-2 py-0.5 rounded">Ola</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3.5 flex items-center gap-2 rounded-lg border border-white/5 bg-[#080A0E] px-3.5 py-2 text-[11px] text-white/45">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-400 shrink-0" />
                  <span>
                    <strong className="text-white/70">Next:</strong> On Android & iOS mobile devices, direct UPI Intent redirection (Google Pay, PhonePe, Paytm) will be configured in the next phase.
                  </span>
                </div>
              </div>

              {/* Integration Pipeline Steps */}
              <div className="rounded-xl border border-white/10 bg-[#0B0D11] p-4 space-y-2.5 text-xs">
                <p className="text-[10px] font-mono uppercase tracking-wider text-white/45">
                  Verification Pipeline
                </p>
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="flex items-center gap-2 text-white/75">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>1. Server Order API</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/75">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>2. Standard Checkout</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/75">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>3. SHA256 Verification</span>
                  </div>
                </div>
              </div>

              {/* Team Formation Section (renders automatically if any group event is in checkout) */}
              <TeamRosterBuilder
                items={displayItems}
                profile={profile}
                user={user}
                onChange={setTeamState}
                className="pt-1"
              />

              {/* Primary Action Button */}
              <button
                type="button"
                onClick={handleRazorpayCheckout}
                disabled={processing || !teamState.isAllTeamsValid}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-400 px-6 py-4 text-xs sm:text-sm font-bold uppercase tracking-wider text-black transition-colors disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>
                      {processStep || 'Processing with Razorpay…'}
                      {remainingSeconds !== null && remainingSeconds > 0
                        ? ` (${Math.floor(remainingSeconds / 60)}:${String(
                            remainingSeconds % 60
                          ).padStart(2, '0')})`
                        : ''}
                    </span>
                  </>
                ) : !teamState.isAllTeamsValid ? (
                  <span>Complete Team Roster to Pay (₹{totalAmount}) ›</span>
                ) : (
                  <span>Continue to Payment (₹{totalAmount}) ›</span>
                )}
              </button>

              {/* Legal & Razorpay Policy Links */}
              <p className="text-center text-[11px] leading-relaxed text-white/45 pt-1">
                By proceeding with payment, you agree to our{' '}
                <Link href="/terms-and-conditions" className="text-orange-400 hover:underline">
                  Terms &amp; Conditions
                </Link>
                ,{' '}
                <Link href="/privacy-policy" className="text-orange-400 hover:underline">
                  Privacy Policy
                </Link>
                ,{' '}
                <Link href="/refund-policy" className="text-orange-400 hover:underline">
                  Refund &amp; Cancellation Policy
                </Link>
                , and{' '}
                <Link href="/shipping-policy" className="text-orange-400 hover:underline">
                  Shipping &amp; Delivery Policy
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Processing Modal Overlay (when creating order or verifying signature) */}
      {processing && processStep && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 px-4 pointer-events-none">
          <div className="w-full max-w-sm rounded-xl border border-white/15 bg-[#111318] p-6 text-center text-white shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">
              Razorpay Secure Gateway
            </h3>
            <p className="text-xs text-orange-400 font-mono mb-2">
              {processStep}
            </p>
            {remainingSeconds !== null && remainingSeconds > 0 && (
              <p className="inline-block rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 font-mono text-[11px] font-bold text-amber-300 mb-2">
                5-Min Payment Window: {Math.floor(remainingSeconds / 60)}:
                {String(remainingSeconds % 60).padStart(2, '0')} remaining
              </p>
            )}
            <p className="text-[11px] text-white/45">
              Please complete payment within 5 minutes in the Razorpay window and do not close this tab.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
