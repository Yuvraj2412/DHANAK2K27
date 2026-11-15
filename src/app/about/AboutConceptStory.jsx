'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

const DIMENSIONS = [
  {
    index: '01',
    title: 'Origin at Valiamala',
    tag: 'Founded 2008',
    body: 'Established shortly after the founding of IIST in the Western Ghats foothills, Dhanak began as a student-led cultural gathering and grew into one of Kerala’s longest-running national campus festivals.',
  },
  {
    index: '02',
    title: 'Intercollegiate Scale',
    tag: '50+ Institutions',
    body: 'Each edition welcomes vocalists, choreographers, theatre troupes, filmmakers, quizmasters, and visual designers from universities and institutes across India for four days of residential campus life.',
  },
  {
    index: '03',
    title: 'Stage & Studio Craft',
    tag: '25+ Events & Workshops',
    body: 'From solo classical vocals and street dance battles to photography walks, fashion couture, and practical workshops, events are evaluated by working practitioners and festival alumni.',
  },
  {
    index: '04',
    title: 'Embers from Ashes',
    tag: '2027 Edition',
    body: 'The 2027 edition takes its name from creative persistence — honouring the continuity of student culture built from scratch every year by cohorts who leave their own mark on the campus stage.',
  },
];

const KEY_PILLARS = [
  { label: 'Flagship Pro-Nites', detail: 'Open-air evening concerts & live bands' },
  { label: 'Performing Arts', detail: 'Classical, contemporary, street dance & theatre' },
  { label: 'Visual & Media Arts', detail: 'Photography, design, short film & fine arts' },
  { label: 'Workshops & Sessions', detail: 'Hands-on masterclasses open to all colleges' },
];

const TILE_SURFACE =
  'rounded-xl border border-white/12 bg-[#0a0908]/95 shadow-[0_16px_48px_rgba(0,0,0,0.88)]';

export default function AboutConceptStory() {
  return (
    <div className="space-y-10 sm:space-y-14">
      {/* Section 1: Institutional Monograph & Emblem Tiles */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch"
      >
        <div className={`lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6 ${TILE_SURFACE}`}>
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <span className="h-[1px] w-6 bg-amber-400/70" aria-hidden="true" />
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber-300/90">
                Institutional Heritage · Est. 2008
              </span>
            </div>

            <h2
              className="text-2xl sm:text-4xl font-bold tracking-tight text-white leading-tight"
              style={{ fontFamily: 'var(--font-cinzel), serif' }}
            >
              Student Culture Built from the Ground Up
            </h2>

            <div className="space-y-4 text-sm sm:text-base leading-relaxed text-neutral-200">
              <p>
                Dhanak is the annual cultural festival of the Indian Institute of Space Science and Technology (IIST), Valiamala, Thiruvananthapuram. Organized wholly by an undergraduate and postgraduate student team, the festival turns an aerospace engineering campus into a shared commons for music, movement, theatre, and visual craft.
              </p>
              <p className="text-neutral-300">
                Every stage cue, competition format, hospitality desk, and acoustic setup is conceptualized, funded, and run by students—creating a grounded, artist-first space where visiting contingents and local talent share the same spotlight.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-5">
            <div>
              <p
                className="text-xl sm:text-2xl font-bold text-white"
                style={{ fontFamily: 'var(--font-cinzel), serif' }}
              >
                2008
              </p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-400">
                Inaugural Year
              </p>
            </div>
            <div>
              <p
                className="text-xl sm:text-2xl font-bold text-white"
                style={{ fontFamily: 'var(--font-cinzel), serif' }}
              >
                4 Days
              </p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-400">
                Valiamala Campus
              </p>
            </div>
            <div>
              <p
                className="text-xl sm:text-2xl font-bold text-white"
                style={{ fontFamily: 'var(--font-cinzel), serif' }}
              >
                2027
              </p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-amber-300/90">
                Embers from Ashes
              </p>
            </div>
          </div>
        </div>

        {/* Clean static crest monograph tile */}
        <div className="lg:col-span-5">
          <div className={`h-full p-6 sm:p-8 flex flex-col justify-between ${TILE_SURFACE}`}>
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-6">
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/60">
                Official Emblem
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-amber-300/85">
                2027 Edition
              </span>
            </div>

            <div className="flex items-center justify-center py-4">
              <Image
                src="/assets/dhanak-phoenix-transparent.png"
                alt="Dhanak 2027 Phoenix Emblem"
                width={260}
                height={260}
                className="h-44 sm:h-52 w-auto object-contain"
              />
            </div>

            <div className="mt-6 border-t border-white/10 pt-4 flex items-center justify-between gap-2 text-xs">
              <span
                className="font-semibold tracking-wider text-white/95"
                style={{ fontFamily: 'var(--font-cinzel), serif' }}
              >
                DHANAK
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-neutral-300">
                Embers from Ashes
              </span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Section 2: Four Individual Tiles for Festival Architecture */}
      <section aria-label="Festival Chapters" className="space-y-4 sm:space-y-5">
        <div className={`px-5 py-3.5 flex flex-wrap items-baseline justify-between gap-2 ${TILE_SURFACE}`}>
          <h2
            className="text-xl sm:text-2xl font-bold text-white"
            style={{ fontFamily: 'var(--font-cinzel), serif' }}
          >
            Festival Architecture
          </h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-300">
            Four Core Dimensions
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {DIMENSIONS.map((item) => (
            <div key={item.index} className={`p-6 sm:p-8 space-y-3 ${TILE_SURFACE}`}>
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-[11px] font-semibold tracking-[0.2em] text-amber-300">
                  {item.index}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400">
                  {item.tag}
                </span>
              </div>
              <h3
                className="text-lg sm:text-xl font-bold text-white"
                style={{ fontFamily: 'var(--font-cinzel), serif' }}
              >
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed text-neutral-200">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3: Disciplines Strip & Direct Navigation Tile */}
      <section className={`p-6 sm:p-8 space-y-6 ${TILE_SURFACE}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 border-b border-white/10 pb-6">
          {KEY_PILLARS.map((pillar) => (
            <div key={pillar.label} className="space-y-1">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-amber-200">
                {pillar.label}
              </p>
              <p className="text-xs leading-relaxed text-neutral-300">
                {pillar.detail}
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="max-w-xl">
            <p className="text-sm text-neutral-200 leading-relaxed">
              &ldquo;Built each year by students who balance orbital mechanics and avionics with music, film, literature, and design.&rdquo;
            </p>
            <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400">
              Indian Institute of Space Science and Technology · Thiruvananthapuram
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/events"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-amber-400/40 bg-amber-500/10 px-5 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-200 hover:bg-amber-500/20 hover:border-amber-300/70 transition-colors"
            >
              <span>Explore Events</span>
              <span aria-hidden="true">→</span>
            </Link>
            <Link
              href="/workshops"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-white/15 px-4 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80 hover:border-white/30 hover:text-white transition-colors"
            >
              <span>Workshops</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
