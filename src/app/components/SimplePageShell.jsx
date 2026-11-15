'use client';

import Link from 'next/link';

export default function SimplePageShell({
  eyebrow = 'Dhanak 2027',
  title,
  subtitle,
  maxWidth = 'max-w-3xl',
  children,
}) {
  return (
    <div className="relative min-h-[calc(100dvh-12rem)] text-white overflow-x-clip">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,69,0,0.12),transparent_55%)]" />

      <div className={`relative z-10 mx-auto ${maxWidth} px-6 pt-28 pb-24 md:pt-32 md:pb-28`}>
        <p
          className="font-mono text-[10px] font-bold uppercase tracking-[0.45em] text-amber-300 mb-4"
          style={{ textShadow: '0 2px 12px rgba(0, 0, 0, 0.95)' }}
        >
          {eyebrow}
        </p>
        <h1
          className="font-syncopate text-4xl md:text-6xl font-bold uppercase tracking-tighter leading-[0.95] mb-6 text-white"
          style={{ textShadow: '0 3px 18px rgba(0, 0, 0, 0.95)' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className="text-white/95 font-medium text-base md:text-lg leading-relaxed max-w-2xl mb-12 border-l-2 border-orange-500/70 pl-6"
            style={{ textShadow: '0 2px 14px rgba(0, 0, 0, 0.98), 0 0 8px rgba(0, 0, 0, 0.9)' }}
          >
            {subtitle}
          </p>
        )}
        <div
          className="max-w-none space-y-5 text-[15px] md:text-base leading-relaxed text-white/95"
          style={{ textShadow: '0 2px 12px rgba(0, 0, 0, 0.92)' }}
        >
          {children}
        </div>

        <div className="mt-14 flex flex-wrap gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-[#140B07]/90 px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:border-orange-500/60 hover:bg-orange-500/15 transition-colors"
          >
            ← Back home
          </Link>
          <Link
            href="/workshop"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-black hover:bg-white transition-colors"
          >
            Workshops
          </Link>
        </div>
      </div>
    </div>
  );
}
