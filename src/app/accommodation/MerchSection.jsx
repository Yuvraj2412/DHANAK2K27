'use client';

import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import ChunkyImage from '../components/ChunkyImage';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ShoppingCart, Minus, Plus, Truck, Ruler, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import useProfile from '../hooks/useProfile';
import { MERCH_ITEMS, MERCH_REVEAL_VIDEO, ticketFor } from './merchData';
import { getCostMap } from '@/lib/ticketStore';
import { showCartToast } from '@/lib/cartToast';
import useBodyScrollLock from '../hooks/useBodyScrollLock';

function QtyStepper({ qty, onChange, label }) {
  const [flash, setFlash] = useState(false);
  const bump = (delta) => {
    setFlash(true);
    setTimeout(() => setFlash(false), 300);
    onChange(Math.max(1, qty + delta));
  };
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 px-2 py-1">
      <motion.button
        type="button"
        whileTap={{ scale: 0.9 }}
        onClick={() => bump(-1)}
        className="rounded-full p-1 text-slate-300 hover:text-white"
        aria-label={`Decrease ${label || 'quantity'}`}
      >
        <Minus size={14} />
      </motion.button>
      <span
        className={`w-8 rounded text-center text-sm transition-colors duration-300 ${
          flash ? 'bg-gradient-to-r from-orange-500 to-amber-500/30 text-amber-200' : ''
        }`}
      >
        {qty}
      </span>
      <motion.button
        type="button"
        whileTap={{ scale: 0.9 }}
        onClick={() => bump(1)}
        className="rounded-full p-1 text-slate-300 hover:text-white"
        aria-label={`Increase ${label || 'quantity'}`}
      >
        <Plus size={14} />
      </motion.button>
    </div>
  );
}

const SIZE_CHART_SRC = '/merch/isro-hoodie-chart.jpg';

function ImageZoomModal({ src, alt, onClose }) {
  useBodyScrollLock(true);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/92 p-4"
    >
      <div className="relative h-[85dvh] w-full max-w-4xl">
        <ChunkyImage
          src={src}
          alt={alt}
          priority
          targetWidth={1080}
          className="w-full h-full object-contain"
        />
      </div>
    </div>,
    document.body
  );
}

function SizeChartZoom({ onClose }) {
  return (
    <ImageZoomModal
      src={SIZE_CHART_SRC}
      alt="Merch measurements chart (zoomed)"
      onClose={onClose}
    />
  );
}

function MerchDialog({ item, initialSize, profile, deliveryFee, onClose, onConfirm }) {
  useBodyScrollLock(true);
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState(initialSize || item.sizes[0]);
  const [sizeChartZoomed, setSizeChartZoomed] = useState(false);
  const [wantsDelivery, setWantsDelivery] = useState(null); // null | true | false
  const [addressSubmitted, setAddressSubmitted] = useState(false);
  const [address, setAddress] = useState({
    houseNumber: '',
    laneName: '',
    landmark: '',
    city: '',
    pincode: '',
  });

  useEffect(() => {
    if (profile?.address && !address.houseNumber && !address.laneName) {
      // Best-effort prefill: put the saved freeform address into the first
      // field and leave the rest for the user to confirm/split.
      setAddress((prev) => ({ ...prev, houseNumber: profile.address }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.address]);

  const canSubmitDelivery =
    address.houseNumber.trim() &&
    address.laneName.trim() &&
    address.city.trim() &&
    /^\d{4,8}$/.test(address.pincode.trim());

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    if (!canSubmitDelivery) return;
    setAddressSubmitted(true);
  };

  const handleConfirm = () => {
    if (wantsDelivery && !addressSubmitted) return;
    onConfirm({
      qty,
      size,
      delivery: wantsDelivery ? address : null,
    });
  };

  const readyToConfirm = wantsDelivery === false || (wantsDelivery === true && addressSubmitted);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[150] flex items-start justify-center overflow-y-auto bg-black/85 p-4 pt-24 sm:p-6 sm:pt-24 lg:pt-28"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-card w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-2xl p-5 sm:p-7"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-orange-400 mb-1">
              {item.title} ({size})
            </p>
            <h2 className="text-xl font-bold text-white">Configure Your Order</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-white/75 hover:text-white"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quantity */}
        <div className="mb-5">
          <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-white/85">Quantity</p>
          <QtyStepper qty={qty} onChange={setQty} label={item.title} />
        </div>

        {/* Size + size chart */}
        <div className="mb-5">
          <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-white/85">Size</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {item.sizes.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={size === s}
                onClick={() => setSize(s)}
                className={`chip cursor-pointer font-bold transition-all ${
                  size === s ? 'scale-110 ring-2 ring-orange-500' : 'hover:border-white/30 hover:text-white'
                }`}
                style={
                  size === s
                    ? { borderColor: 'rgba(255,87,34,0.7)', background: 'rgba(255,87,34,0.15)', color: '#ffb800' }
                    : undefined
                }
              >
                {size === s ? <Check size={12} /> : null}
                {s}
              </button>
            ))}
          </div>
          <div className="rounded-xl border border-white/15 bg-black/50 p-3">
            <div className="mb-2 flex items-center gap-2 text-xs text-slate-200">
              <Ruler size={14} className="text-orange-400" />
              Not sure of your size? Check the chart below.
            </div>
            <button
              type="button"
              onClick={() => setSizeChartZoomed(true)}
              className="relative block h-44 w-full cursor-zoom-in overflow-hidden rounded-lg bg-white"
              aria-label="Zoom into size chart"
            >
              <ChunkyImage
                src={SIZE_CHART_SRC}
                alt="Merch measurements chart"
                targetWidth={640}
                className="w-full h-full object-contain"
              />
            </button>
          </div>
        </div>

        {sizeChartZoomed && <SizeChartZoom onClose={() => setSizeChartZoomed(false)} />}

        {/* Delivery */}
        <div className="mb-5">
          <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-white/85">Delivery</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setWantsDelivery(true);
                  setAddressSubmitted(false);
                }}
                className={wantsDelivery === true ? 'btn-primary text-[10px]' : 'btn-secondary text-[10px]'}
              >
                <Truck size={14} /> Yes, deliver (extra charges apply)
              </button>
              <button
                type="button"
                onClick={() => {
                  setWantsDelivery(false);
                  setAddressSubmitted(false);
                }}
                className={wantsDelivery === false ? 'btn-primary text-[10px]' : 'btn-secondary text-[10px]'}
              >
                No, I&apos;ll collect
              </button>
            </div>

            {wantsDelivery === true && !addressSubmitted && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                onSubmit={handleAddressSubmit}
                className="mt-4 space-y-3"
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    ['houseNumber', 'House Number and Name'],
                    ['laneName', 'Lane Name'],
                    ['landmark', 'Landmark'],
                    ['city', 'City'],
                  ].map(([field, placeholder]) => (
                    <input
                      key={field}
                      type="text"
                      value={address[field]}
                      onChange={(e) =>
                        setAddress((prev) => ({ ...prev, [field]: e.target.value }))
                      }
                      placeholder={placeholder}
                      className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-orange-500/60"
                    />
                  ))}
                  <input
                    type="text"
                    inputMode="numeric"
                    value={address.pincode}
                    onChange={(e) =>
                      setAddress((prev) => ({
                        ...prev,
                        pincode: e.target.value.replace(/\D/g, ''),
                      }))
                    }
                    placeholder="Pincode"
                    className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-orange-500/60"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!canSubmitDelivery}
                  className="btn-secondary w-full text-[10px] disabled:opacity-50"
                >
                  Save Address
                </button>
              </motion.form>
            )}

            {wantsDelivery === true && addressSubmitted && (
              <p className="mt-3 text-xs text-amber-300">
                Address saved for this order — {address.houseNumber}, {address.laneName}
                {address.landmark ? `, ${address.landmark}` : ''}, {address.city} {address.pincode}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!readyToConfirm}
            className="btn-primary w-full disabled:opacity-50"
          >
            <ShoppingCart size={14} /> Add to Cart
          </button>
        </div>
      </div>,
    document.body
  );
}

function MerchCard({ item, price, onSelect }) {
  const { hasItem } = useCart();
  const [size, setSize] = useState(item.sizes[0]);
  const [zoomImage, setZoomImage] = useState(null);
  const inCart = MERCH_SIZES(item).some((s) => hasItem(`merch:${item.id}:${s}`));

  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col">
      {item.imageShowcase ? (
        <button
          type="button"
          onClick={() => setZoomImage({ src: item.imageShowcase, alt: `${item.title} full showcase` })}
          className="group relative block mb-5 aspect-[3/2] w-full cursor-zoom-in overflow-hidden rounded-xl border border-white/15 bg-black/40 shadow-lg"
          aria-label="Zoom into merch showcase"
        >
          <ChunkyImage
            src={item.imageShowcase}
            alt={`${item.title} showcase`}
            targetWidth={750}
            className="absolute inset-0 w-full h-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </button>
      ) : null}
      <h3 className="text-base font-semibold text-white">
        {item.title} ({size})
      </h3>
      <p className="text-xs text-slate-200 mt-0.5">{item.subtitle}</p>
      <p className="mt-1.5 text-sm font-semibold" style={{ color: item.accentColor }}>
        &#8377;{price}
      </p>
      {item.expectedArrival && (
        <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 text-[10px] font-mono tracking-wider text-orange-400 self-start">
          <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
          {item.expectedArrival}
        </div>
      )}

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/85">Size</p>
          <button
            type="button"
            onClick={() => setZoomImage({ src: SIZE_CHART_SRC, alt: 'Measurements Chart' })}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-orange-400 hover:text-amber-300"
          >
            <Ruler size={12} /> Measurements Chart
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {item.sizes.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={size === s}
              onClick={() => setSize(s)}
              className={`chip cursor-pointer font-bold transition-all ${
                size === s ? 'scale-110 ring-2 ring-orange-500' : 'hover:border-white/30 hover:text-white'
              }`}
              style={
                size === s
                  ? { borderColor: 'rgba(255,87,34,0.7)', background: 'rgba(255,87,34,0.15)', color: '#ffb800' }
                  : undefined
              }
            >
              {size === s ? <Check size={12} /> : null}
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <button
          onClick={() => onSelect(item, size)}
          className="btn-primary w-full text-[10px]"
        >
          {inCart ? <Check size={14} /> : <ShoppingCart size={14} />}
          {inCart ? 'Add Another' : 'Select'} ({size})
        </button>
      </div>

      {zoomImage && (
        <ImageZoomModal
          src={zoomImage.src}
          alt={zoomImage.alt}
          onClose={() => setZoomImage(null)}
        />
      )}
    </div>
  );
}

function MERCH_SIZES(item) {
  return item.sizes;
}

export default function MerchSection() {
  const { user } = useAuth();
  const { addItem, hasItem } = useCart();
  const { profile, save } = useProfile();
  const router = useRouter();
  const [activeItem, setActiveItem] = useState(null);
  const [activeSize, setActiveSize] = useState(null);
  const [prices, setPrices] = useState({});

  useEffect(() => {
    let active = true;
    getCostMap().then((map) => {
      if (active) setPrices(map);
    });
    return () => {
      active = false;
    };
  }, []);

  const deliveryFee = prices.delivery || 0;

  const handleSelect = (item, size) => {
    if (!user) {
      router.push('/login?redirect=/merch');
      return;
    }
    setActiveItem(item);
    setActiveSize(size);
  };

  const handleConfirm = async ({ qty, size, delivery }) => {
    const item = activeItem;
    const itemPrice = prices[item.id] || 0;
    const cartKey = `merch:${item.id}:${size}`;
    addItem({
      key: cartKey,
      id: item.id,
      kind: 'merch',
      ticketId: await ticketFor(item.id),
      title: `${item.title} (${size})`,
      subtitle: item.subtitle,
      priceLabel: `₹${itemPrice}`,
      unitPrice: itemPrice,
      accentColor: item.accentColor,
      qty,
    });

    if (delivery && !hasItem('delivery')) {
      addItem({
        key: 'delivery',
        id: 'delivery',
        kind: 'addon',
        ticketId: await ticketFor('delivery'),
        title: 'Delivery',
        subtitle: 'Flat delivery fee (once per order)',
        priceLabel: `₹${deliveryFee}`,
        unitPrice: deliveryFee,
        qty: 1,
        details: delivery,
      });

      if (!profile?.address) {
        const combined = [delivery.houseNumber, delivery.laneName, delivery.landmark, delivery.city, delivery.pincode]
          .filter(Boolean)
          .join(', ');
        if (combined) save({ address: combined });
      }
    }

    showCartToast('Added to cart');
    setActiveItem(null);
    setActiveSize(null);
  };

  return (
    <section className="mb-14">
      <p className="section-eyebrow mb-2">Merch</p>
      <h2 className="section-heading mb-6 text-2xl sm:text-3xl">
        Gear up for Dhanak 2026
      </h2>

      <div className="mx-auto grid max-w-xl grid-cols-1 gap-6">
        {MERCH_ITEMS.map((item) => (
          <MerchCard key={item.id} item={item} price={prices[item.id] || 0} onSelect={handleSelect} />
        ))}
      </div>

      {MERCH_REVEAL_VIDEO ? (
        <div className="mx-auto mt-8 aspect-video max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-black/30">
          <video
            ref={(el) => {
              if (el) el.volume = 0.5;
            }}
            src={MERCH_REVEAL_VIDEO}
            autoPlay
            loop
            muted
            playsInline
            controls
            className="h-full w-full object-cover"
          />
        </div>
      ) : null}

      {activeItem && (
        <MerchDialog
          item={activeItem}
          initialSize={activeSize}
          profile={profile}
          deliveryFee={deliveryFee}
          onClose={() => {
            setActiveItem(null);
            setActiveSize(null);
          }}
          onConfirm={handleConfirm}
        />
      )}
    </section>
  );
}
