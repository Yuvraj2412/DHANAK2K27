'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ChunkyImage from '../components/ChunkyImage';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import useProfile from '../hooks/useProfile';
import usePaymentReminder from '../hooks/usePaymentReminder';
import PrePaymentReminderModal from '../components/PrePaymentReminderModal';
import TeamRosterBuilder from '../components/TeamRosterBuilder';
import { startRazorpayCheckout } from '@/lib/checkout';

export default function CartPage() {
  const { user, loading } = useAuth();
  const { items, addItem, removeItem, clear } = useCart();
  const { profile, save } = useProfile();
  const { guard, modalProps } = usePaymentReminder();
  const [form, setForm] = useState({ name: '', phone: '', college: '', collegeId: '', aadhaarNumber: '', city: '', gender: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [teamState, setTeamState] = useState({ teams: {}, isAllTeamsValid: true });

  useEffect(() => {
    if (!profile) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      name: profile.name || '',
      phone: profile.phone || '',
      college: profile.college || '',
      collegeId: profile.college_id || '',
      aadhaarNumber: profile.aadhaar_number || '',
      city: profile.city || '',
      gender: profile.gender || '',
    });
  }, [profile]);

  const handleAddSampleItems = () => {
    addItem({
      id: 'dhanak-all-access-pass',
      key: 'dhanak-all-access-pass',
      kind: 'day-pass',
      title: 'Dhanak 2027 · All-Access Cultural Fest Pass',
      subtitle: '3-Day Entry to Pronites, Band Battles, Dance, & Stalls',
      priceLabel: '₹499',
      unitPrice: 499,
      qty: 1,
      accentColor: '#FF6B00',
    });
    addItem({
      id: 'dhanak-phoenix-hoodie',
      key: 'dhanak-phoenix-hoodie',
      kind: 'merch',
      title: 'Official Dhanak Phoenix Ember Hoodie (L)',
      subtitle: 'Limited Edition 2026 IIST Fest Merch',
      priceLabel: '₹399',
      unitPrice: 399,
      qty: 1,
      accentColor: '#FFA500',
    });
  };

  const isProfileComplete = Boolean(
    profile?.name &&
    profile?.phone &&
    profile?.college &&
    profile?.college_id &&
    profile?.aadhaar_number &&
    profile?.gender
  );

  const runCheckout = async () => {
    setError('');
    const attendee = {
      name: (profile?.name || form.name).trim(),
      phone: (profile?.phone || form.phone).trim(),
      college: (profile?.college || form.college).trim(),
      college_id: (profile?.college_id || form.collegeId).trim(),
      aadhaar_number: (profile?.aadhaar_number || form.aadhaarNumber).trim(),
      city: (profile?.city || form.city).trim(),
      gender: profile?.gender || form.gender,
    };

    if (!attendee.name) {
      setError('Full name is required.');
      return;
    }
    if (!attendee.phone || attendee.phone.length < 10) {
      setError('A valid 10-digit mobile number is required.');
      return;
    }
    if (!attendee.college_id || !attendee.aadhaar_number) {
      setError('College ID and Aadhaar number are required.');
      return;
    }
    if (!/^\d{12}$/.test(attendee.aadhaar_number)) {
      setError('Aadhaar number must be exactly 12 digits.');
      return;
    }
    if (!attendee.gender) {
      setError('Please select a gender to continue.');
      return;
    }

    if (!teamState.isAllTeamsValid) {
      setError(
        'Please complete your team roster or check the confirmation box to proceed with an incomplete team.'
      );
      return;
    }

    setBusy(true);
    try {
      const changed =
        !profile ||
        attendee.name !== (profile.name || '') ||
        attendee.phone !== (profile.phone || '') ||
        attendee.college !== (profile.college || '') ||
        attendee.college_id !== (profile.college_id || '') ||
        attendee.aadhaar_number !== (profile.aadhaar_number || '') ||
        attendee.city !== (profile.city || '') ||
        attendee.gender !== (profile.gender || '');

      if (changed) {
        await save(attendee);
      }

      await startRazorpayCheckout(
        items,
        {
          ...attendee,
          email: user.email,
          userId: user.id,
          unique_code: profile?.unique_code || '',
        },
        teamState.teams
      );
    } catch (err) {
      setError(err.message || 'Error initiating payment');
      setBusy(false);
    }
  };

  const handleCheckout = (e) => {
    e.preventDefault();
    guard(runCheckout);
  };

  return (
    <div className="relative min-h-[calc(100dvh-12rem)] bg-[#030508] text-white overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,69,0,0.12),transparent_55%)]" />
      <div className="relative z-10 mx-auto max-w-3xl px-6 pt-28 pb-24 md:pt-32">
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
          className="section-heading text-4xl md:text-6xl font-bold mb-10"
        >
          Your Cart
        </motion.h1>

        {loading ? null : !user ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <p className="text-white/60 mb-4">Sign in to check out your cart and register.</p>
            <Link
              href="/login?redirect=/cart"
              className="btn-primary"
            >
              Sign In / Create Account
            </Link>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-orange-500/20 bg-white/[0.02] p-8 text-center">
            <p className="text-white/50 mb-3 text-sm">Your cart is currently empty.</p>
            <p className="text-white/30 mb-6 text-xs">
              Add tickets or click below to populate sample fest passes to preview the checkout and payment gateway.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                type="button"
                onClick={handleAddSampleItems}
                className="btn-primary flex items-center gap-2"
              >
                <span>🔥</span>
                <span>Add Sample Fest Passes to Cart</span>
              </button>
              <Link href="/events" className="text-orange-400 text-xs font-bold uppercase tracking-[0.2em] hover:underline">
                Browse Events →
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4 space-y-3">
              {items.map((item) => {
                const qty = item.qty || 1;
                const unit = item.unitPrice;
                const lineTotal = typeof unit === 'number' ? unit * qty : null;
                const isLockedDelivery =
                  item.key === 'delivery' && items.some((i) => i.kind === 'merch');
                return (
                  <div
                    key={item.key}
                    className="glass-card flex items-center gap-4 rounded-xl p-3"
                    style={{ borderColor: `${item.accentColor || '#FF6B00'}33` }}
                  >
                    {item.image && (
                      <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg">
                        <ChunkyImage src={item.image} alt={item.title} targetWidth={128} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">
                        {item.title}
                        {qty > 1 && (
                          <span className="ml-1.5 text-amber-300">x{qty}</span>
                        )}
                      </p>
                      <p className="text-xs text-white/40">
                        {item.priceLabel}
                        {qty > 1 ? ` each` : ''}
                        {lineTotal !== null && qty > 1 ? ` · ₹${lineTotal} total` : ''}
                      </p>
                      {item.subtitle && (
                        <p className="truncate text-[11px] text-amber-300/70">{item.subtitle}</p>
                      )}
                      {isLockedDelivery && (
                        <p className="mt-0.5 text-[11px] text-white/30">
                          Remove all merch items to drop delivery
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => removeItem(item.key)}
                      disabled={isLockedDelivery}
                      className="text-white/30 hover:text-red-400 text-sm px-2 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:text-white/30"
                      aria-label="Remove"
                      title={isLockedDelivery ? 'Remove all merch items to drop delivery' : undefined}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>

            {(() => {
              const total = items.reduce(
                (sum, item) => sum + (typeof item.unitPrice === 'number' ? item.unitPrice * (item.qty || 1) : 0),
                0
              );
              const unpriced = items.some((item) => typeof item.unitPrice !== 'number');
              return total > 0 ? (
                <div className="mb-8 rounded-xl border border-orange-500/20 bg-orange-500/[0.04] px-4 py-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold uppercase tracking-[0.15em] text-white/70">Total Cost</span>
                    <span className="text-lg font-bold text-amber-300">₹{total}</span>
                  </div>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-white/35">
                    Informational only{unpriced ? ' — some items have no listed price and are excluded from this sum' : ''}. The amount charged at checkout is set by the ticket price on the payment page.
                  </p>
                </div>
              ) : (
                <div className="mb-8" />
              );
            })()}

            <form
              onSubmit={handleCheckout}
              className="glass-card space-y-4 rounded-2xl p-6"
            >
              {isProfileComplete ? (
                <div>
                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/10">
                    <div>
                      <p className="section-eyebrow mb-0.5 text-emerald-400">
                        ✓ Verified Attendee Profile
                      </p>
                      <p className="text-xs text-white/50">
                        Profile details taken upon login are ready for Razorpay checkout.
                      </p>
                    </div>
                    <Link
                      href="/profile"
                      className="text-xs font-semibold text-orange-400 hover:text-orange-300 underline"
                    >
                      Edit Profile
                    </Link>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 rounded-xl border border-white/10 bg-black/40 p-4 text-xs">
                    <div>
                      <span className="text-white/40 block text-[10px] uppercase font-mono tracking-wider">Name</span>
                      <span className="font-semibold text-white">{profile.name}</span>
                    </div>
                    <div>
                      <span className="text-white/40 block text-[10px] uppercase font-mono tracking-wider">Email</span>
                      <span className="text-white/80 truncate block">{user?.email}</span>
                    </div>
                    <div>
                      <span className="text-white/40 block text-[10px] uppercase font-mono tracking-wider">Mobile Phone</span>
                      <span className="font-mono text-white">+91 {profile.phone}</span>
                    </div>
                    <div>
                      <span className="text-white/40 block text-[10px] uppercase font-mono tracking-wider">College & ID</span>
                      <span className="text-white/90">{profile.college} ({profile.college_id})</span>
                    </div>
                    <div>
                      <span className="text-white/40 block text-[10px] uppercase font-mono tracking-wider">Aadhaar</span>
                      <span className="font-mono text-white/80">•••• •••• {profile.aadhaar_number?.slice(-4)}</span>
                    </div>
                    <div>
                      <span className="text-white/40 block text-[10px] uppercase font-mono tracking-wider">Gender</span>
                      <span className="capitalize text-white/90">{profile.gender}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <p className="section-eyebrow">
                      Complete Attendee Details
                    </p>
                    <p className="text-xs text-white/50 mb-3">
                      Please enter your details once to proceed to payment. These will be saved to your profile.
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      required
                      placeholder="Full Name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="rounded-lg border border-white/15 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-orange-500"
                    />
                    <input
                      required
                      placeholder="Phone Number"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="rounded-lg border border-white/15 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-orange-500"
                    />
                    <input
                      placeholder="College / Institution"
                      value={form.college}
                      onChange={(e) => setForm({ ...form, college: e.target.value })}
                      className="rounded-lg border border-white/15 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-orange-500"
                    />
                    <input
                      required
                      placeholder="College ID"
                      value={form.collegeId}
                      onChange={(e) => setForm({ ...form, collegeId: e.target.value })}
                      className="rounded-lg border border-white/15 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-orange-500"
                    />
                    <input
                      required
                      inputMode="numeric"
                      maxLength={12}
                      placeholder="Aadhaar Number (12 digits)"
                      value={form.aadhaarNumber}
                      onChange={(e) => setForm({ ...form, aadhaarNumber: e.target.value.replace(/\D/g, '') })}
                      className="rounded-lg border border-white/15 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-orange-500"
                    />
                    <input
                      placeholder="City"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="rounded-lg border border-white/15 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-orange-500"
                    />
                    <select
                      required
                      value={form.gender}
                      onChange={(e) => setForm({ ...form, gender: e.target.value })}
                      className="rounded-lg border border-white/15 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-orange-500"
                    >
                      <option value="">Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="rather_not_say">Prefer not to say</option>
                    </select>
                  </div>
                </>
              )}

              {/* Team Roster Section (renders automatically if any group event is in cart) */}
              <TeamRosterBuilder
                items={items}
                profile={profile}
                user={user}
                onChange={setTeamState}
                className="mt-6 mb-2"
              />

              {error && (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                  {error}
                </p>
              )}

              <p className="text-center text-[11px] leading-relaxed text-white/35">
                Purchased passes are automatically added to your Dhanak profile upon verified payment. By proceeding, you agree to our{' '}
                <Link href="/terms-and-conditions" className="text-orange-400/80 hover:underline">
                  Terms
                </Link>
                ,{' '}
                <Link href="/privacy-policy" className="text-orange-400/80 hover:underline">
                  Privacy
                </Link>
                ,{' '}
                <Link href="/refund-policy" className="text-orange-400/80 hover:underline">
                  Refund
                </Link>{' '}
                &amp;{' '}
                <Link href="/shipping-policy" className="text-orange-400/80 hover:underline">
                  Delivery
                </Link>{' '}
                policies.
              </p>

              <button
                type="submit"
                disabled={busy || !teamState.isAllTeamsValid}
                className="btn-primary w-full disabled:opacity-50 cursor-pointer"
              >
                {busy
                  ? 'Initiating Razorpay…'
                  : !teamState.isAllTeamsValid
                    ? 'Complete Team Roster to Proceed ›'
                    : `Pay ₹${items.reduce((sum, item) => sum + (typeof item.unitPrice === 'number' ? item.unitPrice * (item.qty || 1) : 0), 0)} with Razorpay (${items.length} item${items.length > 1 ? 's' : ''}) ›`}
              </button>
            </form>
          </>
        )}
      </div>
      <PrePaymentReminderModal {...modalProps} />
    </div>
  );
}
