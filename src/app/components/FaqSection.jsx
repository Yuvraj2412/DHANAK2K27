"use client";

import { HelpCircle } from "lucide-react";

/**
 * FaqSection — Royal Ember-Gold Accordion FAQ Component
 * Used across individual Workshop and Event detail pages.
 * Supports custom item FAQs or Conscientia-style default FAQs.
 */
export default function FaqSection({
  faqs = [],
  title = "Frequently Asked Questions",
  subtitle = "Everything You Need to Know",
}) {
  if (!Array.isArray(faqs) || faqs.length === 0) return null;

  return (
    <section className="p-6 sm:p-8">
      {/* Section Header */}
      <div className="flex items-center gap-3.5 mb-5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500/25 to-amber-500/10 border border-amber-400/35 flex items-center justify-center text-amber-300 shadow-[0_0_16px_rgba(255,140,0,0.2)] shrink-0">
          <HelpCircle size={18} />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[11px] font-mono uppercase tracking-widest text-amber-400/70">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Accordion FAQ Items */}
      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <details
            key={index}
            className="group rounded-xl border border-amber-500/15 bg-gradient-to-br from-[#1A110A] to-[#120B07] overflow-hidden transition-all duration-300 hover:border-amber-400/40"
          >
            <summary className="flex items-center justify-between p-4 sm:p-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden select-none">
              <span className="text-sm sm:text-[15px] font-semibold text-white/95 group-hover:text-amber-300 transition-colors pr-4">
                {faq.q}
              </span>
              <div className="relative flex items-center justify-center w-4 h-4 shrink-0 text-amber-400">
                <span className="absolute w-full h-0.5 bg-gradient-to-r from-orange-400 to-amber-300 rounded-full transition-transform duration-300 group-open:rotate-180" />
                <span className="absolute w-0.5 h-full bg-gradient-to-r from-orange-400 to-amber-300 rounded-full transition-transform duration-300 group-open:opacity-0" />
              </div>
            </summary>
            <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0">
              <div className="p-3.5 sm:p-4 rounded-xl bg-black/40 border-l-2 border-l-amber-500/70 text-xs sm:text-sm text-white/80 leading-relaxed">
                {faq.a}
              </div>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

