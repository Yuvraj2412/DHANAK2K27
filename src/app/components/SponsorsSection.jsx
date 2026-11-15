"use client";

import React from "react";
import Link from "next/link";
import { Clock, Sparkles, ArrowLeft, Mail } from "lucide-react";

export default function SponsorsSection() {
  return (
    <section
      id="sponsors"
      className="relative min-h-screen bg-[#080604] text-white overflow-x-hidden flex items-center"
    >
      {/* Top Warm Ambient Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[85vw] h-[380px] z-0"
        style={{
          background:
            "radial-gradient(ellipse 65% 45% at 50% 0%, rgba(255, 115, 0, 0.14) 0%, transparent 75%)",
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto w-full px-4 sm:px-6 pt-24 sm:pt-28 pb-20">
        {/* Top Breadcrumb */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link
            href="/"
            className="inline-flex min-h-[44px] sm:min-h-0 items-center gap-2 rounded-full border border-amber-500/25 bg-[#160D08]/90 px-4 py-1.5 text-xs sm:text-sm font-semibold text-amber-200 hover:border-amber-400/60 hover:text-white transition-colors"
          >
            <ArrowLeft size={15} />
            <span>Back to Home</span>
          </Link>

          <span className="text-xs font-mono uppercase tracking-widest text-amber-300/65 hidden sm:inline">
            Dhanak · Official Sponsors
          </span>
        </div>

        {/* Announcing Later Notice */}
        <div className="rounded-2xl bg-gradient-to-b from-[#1B110B]/95 to-[#120B07]/95 border border-amber-500/25 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.75)]">
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-amber-400/80 to-transparent" />

          <div className="p-8 sm:p-12 md:p-14 text-center">
            <div className="mx-auto max-w-xl flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500/25 to-amber-500/10 border border-amber-400/35 flex items-center justify-center text-amber-300 shadow-[0_0_24px_rgba(255,140,0,0.2)] mb-5">
                <Clock size={26} />
              </div>

              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-[0.22em] text-amber-300 bg-amber-500/10 border border-amber-400/30 mb-4">
                <Sparkles size={12} />
                <span>Partners &amp; Sponsors</span>
              </span>

              <h1
                className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight uppercase mb-3"
                style={{
                  background: "linear-gradient(135deg, #FFFFFF 0%, #FFE599 60%, #FF9800 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Announcing Later
              </h1>

              <p className="text-sm sm:text-base text-white/70 leading-relaxed mb-8">
                Our official sponsors and partners for{" "}
                <span className="text-white font-semibold">Dhanak 2027</span> are
                being finalized and will be announced soon.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
                <Link
                  href="/"
                  className="w-full sm:w-auto inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-6 py-3 bg-gradient-to-r from-[#FF4500] via-[#FF7A00] to-[#FFB300] text-black font-extrabold text-xs sm:text-sm uppercase tracking-wider hover:brightness-110 transition-all shadow-[0_8px_28px_rgba(255,90,0,0.3)]"
                >
                  <ArrowLeft size={16} />
                  <span>Explore Dhanak</span>
                </Link>
                <Link
                  href="/contact-us"
                  className="w-full sm:w-auto inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-6 py-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/15 text-white/90 font-bold text-xs sm:text-sm uppercase tracking-wider transition-colors"
                >
                  <Mail size={15} className="text-amber-400" />
                  <span>Contact Team</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
