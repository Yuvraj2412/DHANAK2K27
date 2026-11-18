'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X,
  Award,
  CreditCard,
  Phone,
  GraduationCap,
  BedDouble,
  QrCode,
  ShieldCheck,
  Info,
} from 'lucide-react';
import useBodyScrollLock from '../hooks/useBodyScrollLock';
import { FEST_NAME, FEST_YEAR } from '@/lib/festConfig';

const INSTRUCTIONS = [
  {
    icon: Award,
    title: 'Full Legal Name (Printed on Certificates)',
    text: `Enter your exact full name as shown on your Government ID / College ID. This exact name will appear on your official ${FEST_NAME} ${FEST_YEAR} workshop & event certificates.`,
  },
  {
    icon: CreditCard,
    title: 'Valid 12-Digit Aadhaar Number (Mandatory)',
    text: 'Enter your 12-digit Aadhaar number accurately (digits only, no spaces). Your original physical Aadhaar Card & College ID are strictly verified at the IIST Campus Registration Desk.',
  },
  {
    icon: Phone,
    title: 'Active 10-Digit Mobile Number',
    text: 'Provide a reachable, WhatsApp-active 10-digit Indian mobile number (+91). Online workshop links, schedule updates, and campus entry alerts rely on this number.',
  },
  {
    icon: GraduationCap,
    title: 'Full College Name & Roll / College ID',
    text: 'Write your complete institution name and exact Roll / Enrollment ID number as printed on your College ID card to avoid delays during physical verification.',
  },
  {
    icon: BedDouble,
    title: 'Accurate Gender & Stay Info',
    text: 'Gender is used directly for hostel room allocation and security verification at IIST Valiamala if you book accommodation or attend in-person events.',
  },
  {
    icon: QrCode,
    title: 'Non-Transferable Personal DHN-ID',
    text: 'Your DHN-ID is strictly personal and required for team event rosters, QR check-in passes, food fest pickups, and certificate verification.',
  },
];

/**
 * Shared pop-up displaying instructions to keep in mind while filling profile details.
 * Shown above ProfileCompletionModal (z-[220]) and /profile edit form.
 */
export default function ProfileInstructionsModal({ open, onClose }) {
  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[230] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-2xl border border-amber-500/35 bg-[#0F0A07] p-5 sm:p-7 shadow-[0_24px_70px_rgba(0,0,0,0.9)]"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close instructions"
              className="absolute right-4 top-4 rounded-full border border-white/10 bg-white/[0.04] p-2 text-white/60 hover:border-amber-400/50 hover:text-white transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="mb-4 flex items-center gap-2 text-amber-400">
              <ShieldCheck size={16} className="shrink-0" />
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] font-bold">
                {FEST_NAME} {FEST_YEAR} · Before You Submit
              </p>
            </div>

            <h3 className="pr-8 text-lg sm:text-xl font-bold text-white tracking-tight mb-2">
              Instructions to keep in mind while filling the profile details
            </h3>
            <p className="text-xs text-white/55 mb-5 leading-relaxed">
              Please review these key guidelines carefully so your passes, certificates, and campus verification go smoothly:
            </p>

            <div className="space-y-3 mb-6">
              {INSTRUCTIONS.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="flex items-start gap-3 rounded-xl border border-amber-500/15 bg-white/[0.03] p-3.5"
                  >
                    <div className="mt-0.5 rounded-lg border border-amber-400/25 bg-amber-500/10 p-1.5 text-amber-300 shrink-0">
                      <Icon size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-amber-100">{item.title}</p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-white/65">
                        {item.text}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3 text-xs font-black uppercase tracking-[0.2em] text-black shadow-lg shadow-orange-500/25 hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer"
            >
              I Understand, Continue Filling ›
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Shared button to open the profile filling instructions pop-up. */
export function ProfileInstructionsTrigger({ onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex w-full items-center justify-between gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-left text-xs font-semibold text-amber-200 hover:border-amber-400/60 hover:bg-amber-500/15 transition-colors cursor-pointer ${className}`.trim()}
    >
      <span className="flex items-center gap-2">
        <Info size={14} className="text-amber-400 shrink-0" />
        <span>Instructions to keep in mind while filling the profile details</span>
      </span>
      <span className="font-mono text-[10px] uppercase tracking-wider text-amber-300/80 shrink-0">
        View ›
      </span>
    </button>
  );
}
