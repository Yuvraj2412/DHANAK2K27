"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { FEST_NAME, FEST_YEAR, FEST_TAGLINE, FEST_SUBTITLE, FEST_INSTITUTE, FEST_INSTITUTE_SHORT, FESTIVAL_DAYS } from "@/lib/festConfig";
import { DHANAK_WORKSHOPS } from "@/lib/dhanakWorkshops";
import { DHANAK_EVENTS } from "@/lib/dhanakEvents";
import LavaWorkshopTile from "./components/LavaWorkshopTile";
import Dhanak3DTitle from "./components/Dhanak3DTitle";
import IlluminatedTileBackdrop from "./components/IlluminatedTileBackdrop";
import ChunkyImage from "./components/ChunkyImage";

// ─────────────────────────────────────────────────────────────────────────────
// SPARK CURSOR CANVAS
// Canvas that draws dissipating spark particles following the mouse
// ─────────────────────────────────────────────────────────────────────────────
function SparkCanvas() {
  const canvasRef = useRef(null);
  const particles = useRef([]);
  const rafRef = useRef(null);
  const mouse = useRef({ x: -999, y: -999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const onMouseMove = (e) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      // Spawn 2-4 particles per move
      const count = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 2;
        particles.current.push({
          x: e.clientX,
          y: e.clientY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.8, // bias upward
          life: 1,
          decay: 0.025 + Math.random() * 0.035,
          size: 1.5 + Math.random() * 2.5,
          hue: 20 + Math.random() * 30, // orange-gold range
        });
      }
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.current = particles.current.filter((p) => p.life > 0);
      for (const p of particles.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.04; // gravity
        p.vx *= 0.98;
        p.life -= p.decay;
        if (p.life <= 0) continue;
        const radius = Math.max(0, p.size * p.life);
        if (radius <= 0) continue;

        ctx.save();
        ctx.globalAlpha = Math.min(1, Math.max(0, p.life));
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${p.hue}, 100%, 60%)`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = `hsl(${p.hue}, 100%, 55%)`;
        ctx.fill();
        ctx.restore();
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[50]"
      style={{ mixBlendMode: "screen" }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EMBER INTRO SCREEN
// Dark charcoal screen → pulsing single ember → click "Enter" → explodes
// ─────────────────────────────────────────────────────────────────────────────
function EmberIntro({ onEnter }) {
  const [phase, setPhase] = useState("idle"); // idle → exploding → done
  const canvasRef = useRef(null);
  const explodeParticles = useRef([]);
  const rafRef = useRef(null);

  const triggerExplosion = useCallback(() => {
    if (phase !== "idle") return;
    setPhase("exploding");

    const canvas = canvasRef.current;
    if (!canvas) { onEnter(); return; }
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    // Spawn 180 explosion particles
    for (let i = 0; i < 180; i++) {
      const angle = (Math.PI * 2 * i) / 180 + Math.random() * 0.3;
      const speed = 2 + Math.random() * 12;
      explodeParticles.current.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.012 + Math.random() * 0.02,
        size: 2 + Math.random() * 5,
        hue: 10 + Math.random() * 50,
      });
    }

    let startTime = null;
    const explodeDraw = (ts) => {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      explodeParticles.current = explodeParticles.current.filter((p) => p.life > 0);
      for (const p of explodeParticles.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08;
        p.vx *= 0.97;
        p.life -= p.decay;
        if (p.life <= 0) continue;
        const radius = Math.max(0, p.size * p.life);
        if (radius <= 0) continue;

        ctx.save();
        ctx.globalAlpha = Math.min(1, Math.max(0, p.life));
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${p.hue}, 100%, 60%)`;
        ctx.shadowBlur = 14;
        ctx.shadowColor = `hsl(${p.hue}, 100%, 55%)`;
        ctx.fill();
        ctx.restore();
      }
      if (elapsed < 1200 && explodeParticles.current.length > 0) {
        rafRef.current = requestAnimationFrame(explodeDraw);
      } else {
        onEnter();
      }
    };
    rafRef.current = requestAnimationFrame(explodeDraw);
  }, [phase, onEnter]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  return (
    <motion.div
      data-fest-intro="true"
      className="fixed inset-0 z-[300] flex flex-col items-center justify-center select-none"
      style={{ background: "#080604" }}
      animate={phase === "exploding" ? { opacity: 0 } : { opacity: 1 }}
      transition={{ duration: 0.8, delay: phase === "exploding" ? 0.6 : 0 }}
    >
      {/* Interactive Glowing Geometric Tile Pattern */}
      <IlluminatedTileBackdrop />

      {/* Explosion canvas */}
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-10" />

      {/* Flapping Phoenix Medallion */}
      <div className="relative flex items-center justify-center mb-10 cursor-pointer" onClick={triggerExplosion}>
        {/* Outer glow rings */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{ border: "1px solid rgba(255,69,0,0.35)", borderRadius: "50%" }}
            animate={{ width: [90, 170 + i * 40], height: [90, 170 + i * 40], opacity: [0.6, 0] }}
            transition={{ duration: 2.2 + i * 0.5, repeat: Infinity, ease: "easeOut", delay: i * 0.4 }}
          />
        ))}

        {/* Official 3D Dhanak Emblem */}
        <motion.div
          animate={{ scale: [1, 1.06, 1], y: [0, -4, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.95 }}
          className="relative z-10 w-28 h-28 sm:w-36 sm:h-36"
          style={{ perspective: 800, transformStyle: "preserve-3d" }}
        >
          {/* Pulsing Ember Aura */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(255,107,0,0.55) 0%, rgba(255,184,0,0.22) 50%, transparent 75%)",
              filter: "blur(14px)",
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Image
              src="/assets/dhanak-logo.png"
              alt="Official Dhanak Logo"
              width={144}
              height={144}
              sizes="(max-width: 640px) 112px, 144px"
              priority
              className="w-full h-full object-contain filter drop-shadow-[0_0_24px_rgba(255,107,0,0.85)] drop-shadow-[0_0_48px_rgba(255,60,0,0.45)]"
            />
          </div>
        </motion.div>
      </div>

      {/* 3D Festival name with Fire & Ash Reaction */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 1 }}
        className="text-center mb-2 max-w-full px-3"
      >
        <Dhanak3DTitle
          text={FEST_NAME}
          fontSize="clamp(2.2rem,9vw,5.6rem)"
          letterSpacing="0.16em"
        />
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
        className="brand-tagline-cinzel text-sm sm:text-base tracking-[0.24em] sm:tracking-[0.36em] mb-14 font-bold text-center px-4"
      >
        {FEST_TAGLINE}
      </motion.p>

      {/* Click-to-enter button */}
      <motion.button
        onClick={triggerExplosion}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.6 }}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.98 }}
        className="btn-primary relative px-9 py-3.5 text-xs tracking-[0.14em]"
      >
        <span>Enter the Fest</span>
        <span aria-hidden="true">→</span>
      </motion.button>

      {/* IIST credit */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.85 }}
        transition={{ delay: 2 }}
        className="absolute bottom-8 font-mono text-[10px] tracking-[0.35em] uppercase font-bold"
        style={{ color: "#FFFFFF", textShadow: "0 2px 8px #000000, 0 0 14px #000000" }}
      >
        Indian Institute of Space Science and Technology · 2027
      </motion.p>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCROLL FIRE BACKGROUND — intensity grows from grey to fire as you scroll
// ─────────────────────────────────────────────────────────────────────────────
function ScrollFireBg({ progress }) {
  const fireOpacity = useTransform(progress, [0, 0.5, 1], [0.22, 0.55, 0.9]);
  return (
    <motion.div
      className="fixed inset-0 pointer-events-none z-0"
      style={{
        opacity: fireOpacity,
        willChange: "opacity",
        background:
          "radial-gradient(ellipse 100% 70% at 50% 0%, rgba(255,110,0,0.38) 0%, #0C0A09 72%)",
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: HERO
// ─────────────────────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section className="relative z-10 min-h-[100dvh] flex flex-col items-center justify-center text-center px-4 sm:px-6 pt-20 sm:pt-28 pb-16 sm:pb-20 overflow-hidden">
      {/* Eyebrow */}
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.7 }}
        className="font-mono text-[10px] sm:text-xs tracking-[0.2em] sm:tracking-[0.45em] uppercase mb-5 font-black px-3.5 sm:px-4 py-1.5 rounded-full max-w-full"
        style={{
          color: "#FFFFFF",
          background: "rgba(8, 6, 5, 0.94)",
          border: "1px solid rgba(255, 190, 40, 0.55)",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.98)",
          textShadow: "0 2px 8px #000000, 0 0 14px #000000",
        }}
      >
        {FEST_INSTITUTE_SHORT} · Valiamala · Cultural Festival {FEST_YEAR}
      </motion.p>

      {/* Dhanak Phoenix Medallion */}
      <motion.div
        initial={{ opacity: 0, scale: 0.7, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="relative mb-4 sm:mb-6 pointer-events-none"
      >
        <div className="relative w-32 h-32 sm:w-44 sm:h-44 mx-auto">
          {/* Pulsing ambient flame aura behind logo */}
          <div
            className="absolute inset-0 rounded-full animate-pulse"
            style={{
              background: "radial-gradient(circle, rgba(255,100,0,0.55) 0%, rgba(255,184,0,0.22) 50%, transparent 75%)",
              filter: "blur(22px)",
            }}
          />
          <Image
            src="/assets/dhanak-logo.png"
            alt="Official Dhanak Festival Logo"
            width={176}
            height={176}
            sizes="(max-width: 640px) 128px, 176px"
            priority
            className="relative z-10 w-full h-full object-contain filter drop-shadow-[0_0_28px_rgba(255,107,0,0.85)] drop-shadow-[0_0_54px_rgba(255,60,0,0.4)]"
          />
        </div>
      </motion.div>

      {/* 3D Main headline with Fire & Ash Reaction */}
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.9, ease: [0.23, 1, 0.32, 1] }}
        className="relative mb-4 text-center max-w-full"
      >
        <Dhanak3DTitle
          text={FEST_NAME}
          fontSize="clamp(2.55rem,13vw,9.8rem)"
          letterSpacing="0.12em"
        />
      </motion.div>

      {/* Theme tagline */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.7, duration: 0.7 }}
        className="mb-5"
      >
        <span
          className="inline-block brand-tagline-cinzel text-sm sm:text-lg tracking-[0.24em] sm:tracking-[0.42em] font-bold max-w-full"
        >
          {FEST_TAGLINE}
        </span>
      </motion.div>

      {/* IIST Logo & Institute Name */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.82, duration: 0.7 }}
        className="flex flex-col items-center gap-2.5 mb-8"
      >
        <div
          className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-white border border-white/40"
          style={{
            boxShadow: "0 0 22px rgba(255, 255, 255, 0.22), 0 4px 16px rgba(0, 0, 0, 0.85)",
          }}
        >
          <Image
            src="/assets/iist-header-logo.jpg"
            alt={`${FEST_INSTITUTE} Logo`}
            width={64}
            height={64}
            sizes="(max-width: 640px) 56px, 64px"
            priority
            className="w-full h-full object-cover"
          />
        </div>
        <p
          className="font-mono text-[10px] sm:text-xs tracking-[0.22em] sm:tracking-[0.3em] uppercase font-bold text-center px-2"
          style={{
            color: "#FFFFFF",
            textShadow: "0 2px 10px #000000, 0 0 18px #000000, 0 0 4px #000000",
          }}
        >
          {FEST_INSTITUTE}
        </p>
      </motion.div>

      {/* Sub-description */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.95, duration: 0.7 }}
        className="max-w-md text-sm sm:text-base leading-relaxed mb-14 font-extrabold"
        style={{
          color: "#FFFFFF",
          textShadow: "0 2px 10px #000000, 0 0 18px #000000, 0 0 4px #000000",
        }}
      >
        {FEST_SUBTITLE}. Where culture reignites and every spark becomes a flame.
      </motion.p>

      {/* CTA Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.6 }}
        className="flex flex-wrap gap-3.5 justify-center"
      >
        <Link href="/events" className="btn-primary px-6 py-3">
          <span>Explore Events</span>
          <span aria-hidden="true">→</span>
        </Link>
        <Link
          href="/workshop"
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[10px] border border-amber-400/45 bg-[#0C0A09]/80 backdrop-blur-md px-6 py-3 text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-amber-200 hover:border-amber-300/75 hover:bg-amber-500/15 hover:text-white transition-all duration-200 cursor-pointer"
        >
          <span>Workshops</span>
          <span aria-hidden="true">→</span>
        </Link>
        <Link
          href="/about"
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[10px] border border-white/20 bg-[#0C0A09]/75 backdrop-blur-md px-6 py-3 text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-white/90 hover:border-white/40 hover:bg-white/[0.08] hover:text-white transition-all duration-200 cursor-pointer"
        >
          <span>About Dhanak</span>
        </Link>
      </motion.div>

      {/* Scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
      >
        <span className="font-mono text-[9px] tracking-[0.35em] uppercase" style={{ color: "rgba(255,180,0,0.5)" }}>scroll</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          style={{ width: 1, height: 32, background: "linear-gradient(180deg, rgba(255,107,0,0.5), transparent)" }}
        />
      </motion.div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: MAIN EVENTS (Day 0, Day 1, Day 2)
// ─────────────────────────────────────────────────────────────────────────────
const DAY_GRADIENTS = [
  "linear-gradient(135deg, #1a0a00 0%, #3D1200 100%)",  // Day 0 — deep ember
  "linear-gradient(135deg, #1a0d00 0%, #4A2000 100%)",  // Day 1 — orange
  "linear-gradient(135deg, #1a1000 0%, #4A3000 100%)",  // Day 2 — gold
];
const DAY_ACCENTS = ["#FF4500", "#FF7A00", "#FFB800"];
const DAY_GLOWS = ["rgba(255,69,0,0.35)", "rgba(255,122,0,0.3)", "rgba(255,184,0,0.25)"];

function EventsSection() {
  return (
    <section className="relative z-10 px-4 sm:px-6 py-20 sm:py-24 max-w-7xl mx-auto">
      {/* Section eyebrow */}
      <div className="mb-14 sm:mb-16 text-center">
        <p
          className="font-mono text-[10px] tracking-[0.45em] uppercase mb-3 font-semibold"
          style={{ color: "#FFD54F", textShadow: "0 2px 12px rgba(0,0,0,0.95)" }}
        >
          Headline Events
        </p>
        <h2
          className="font-black uppercase"
          style={{
            fontSize: "clamp(2rem,6vw,4rem)",
            fontFamily: "var(--font-cinzel), 'Cinzel Decorative', serif",
            background: "linear-gradient(135deg, #FFFFFF 0%, #FFE082 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter: "drop-shadow(0 4px 18px rgba(0,0,0,0.95))",
          }}
        >
          The Nights That Burn
        </h2>
      </div>

      {/* Day cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7">
        {FESTIVAL_DAYS.map((day, i) => (
          <motion.div
            key={day.day}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: i * 0.12, duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
          >
            <Link href={day.href || "/events"} className="block">
              <div
                className="group relative rounded-2xl overflow-hidden h-[440px] sm:h-[480px] md:h-[500px] flex flex-col justify-end p-6 sm:p-7 cursor-pointer"
                style={{
                  background: DAY_GRADIENTS[i],
                  border: `1px solid ${DAY_ACCENTS[i]}33`,
                  boxShadow: `0 8px 40px ${DAY_GLOWS[i]}`,
                  transition: "transform 0.35s ease, box-shadow 0.35s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-6px)";
                  e.currentTarget.style.boxShadow = `0 20px 60px ${DAY_GLOWS[i]}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = `0 8px 40px ${DAY_GLOWS[i]}`;
                }}
              >
                {/* Background image */}
                {day.image && (
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <ChunkyImage
                      src={day.image}
                      alt={day.headline}
                      targetWidth={828}
                      className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    {/* Dark gradient overlay — soft in resting state so the photo shines, deepens on hover for text clarity */}
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10 group-hover:from-black/95 group-hover:via-black/75 group-hover:to-black/25 transition-colors duration-400"
                    />
                  </div>
                )}

                {/* Animated ember inner glow */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: `radial-gradient(ellipse 60% 40% at 50% 100%, ${DAY_ACCENTS[i]}25, transparent 70%)` }}
                />

                {/* Coal texture dots */}
                <div className="absolute top-6 right-6 z-10 flex gap-1.5">
                  {[0, 1, 2].map((d) => (
                    <div key={d} style={{ width: 5, height: 5, borderRadius: "50%", background: `${DAY_ACCENTS[i]}60` }} />
                  ))}
                </div>

                {/* Day label */}
                <span
                  className="relative z-10 font-mono text-[10px] sm:text-[11px] tracking-[0.4em] uppercase mb-1.5 font-bold"
                  style={{ color: DAY_ACCENTS[i] }}
                >
                  {day.label}
                </span>

                {/* Event name */}
                <h3
                  className="relative z-10 font-black uppercase leading-tight"
                  style={{
                    fontFamily: "'Cinzel Decorative', serif",
                    fontSize: "clamp(1.35rem,2.8vw,1.95rem)",
                    color: "#F5F0EB",
                    textShadow: `0 0 24px ${DAY_ACCENTS[i]}50`,
                  }}
                >
                  {day.headline}
                </h3>

                {/* Dynamic Text Popup on Hover (revealed cleanly on touch devices) */}
                <div className="touch-reveal relative z-10 grid grid-rows-[0fr] opacity-0 group-hover:grid-rows-[1fr] group-hover:opacity-100 transition-all duration-300 ease-out">
                  <div className="overflow-hidden">
                    <p
                      className="text-xs sm:text-[13px] leading-relaxed pt-2.5 pb-1 font-medium"
                      style={{ color: "rgba(255, 250, 245, 0.92)", textShadow: "0 1px 8px rgba(0,0,0,0.8)" }}
                    >
                      {day.description}
                    </p>
                  </div>
                </div>

                {/* Bottom Row: Status pill + Tag */}
                <div className="relative z-10 mt-3.5 flex items-center justify-between gap-3">
                  <span
                    className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 group-hover:border-amber-400/60 group-hover:bg-amber-500 group-hover:text-zinc-950 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-white backdrop-blur-sm transition-all duration-200"
                  >
                    <span>Register Now</span>
                    <span aria-hidden="true">→</span>
                  </span>
                  <span className="font-mono text-[9px] sm:text-[10px] text-white/55 uppercase tracking-widest">
                    Main Event
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: WORKSHOPS
// ─────────────────────────────────────────────────────────────────────────────
function WorkshopsSection() {
  return (
    <section className="relative z-10 px-4 sm:px-6 py-16 sm:py-20 max-w-5xl mx-auto">
      <div className="mb-8 sm:mb-10 text-center">
        <p className="font-mono text-[10px] tracking-[0.45em] uppercase mb-2" style={{ color: "#FFB800" }}>
          Workshops · Registrations Open
        </p>
        <h2
          className="font-black uppercase mb-3"
          style={{
            fontFamily: "var(--font-cinzel), 'Cinzel Decorative', serif",
            fontSize: "clamp(1.7rem, 4.8vw, 3.2rem)",
            background: "linear-gradient(135deg, #FFFFFF 0%, #FFD54F 55%, #FF8C00 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            lineHeight: 1.1,
            filter: "drop-shadow(0 4px 18px rgba(0,0,0,0.9))",
          }}
        >
          Forge Your Skills
        </h2>
        <p
          className="text-xs sm:text-sm max-w-lg mx-auto font-semibold transition-colors duration-300 hover:text-amber-200"
          style={{ color: "#FFFDF9", textShadow: "0 2px 14px rgba(0,0,0,1), 0 0 8px rgba(0,0,0,0.95)" }}
        >
          Select a masterclass tile to enter its dedicated briefing, syllabus, and registration.
        </p>
      </div>

      {/* Featured 3 workshop tiles on home page; full lineup on /workshop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
        {DHANAK_WORKSHOPS.slice(0, 3).map((w) => (
          <LavaWorkshopTile key={w.id} workshop={w} />
        ))}
      </div>

      <div className="mt-8 text-center">
        <Link href="/workshop" className="btn-secondary">
          <span>And many more...</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: WHAT IS DHANAK (About teaser with dynamic slideshow tile)
// ─────────────────────────────────────────────────────────────────────────────
const ABOUT_SLIDES = [
  {
    src: "/assets/about/slide-1.jpg",
    alt: "Live vocal & pro-nite musical performance at Dhanak",
    caption: "Live Vocals & Bands",
    positionClass: "object-[50%_18%]",
  },
  {
    src: "/assets/about/slide-2.jpg",
    alt: "Grand couture fashion show and runway choreography",
    caption: "Runway & Couture",
    positionClass: "object-[50%_22%]",
  },
  {
    src: "/assets/about/slide-3.jpg",
    alt: "Theatrical arts and stage performances under concert lighting",
    caption: "Stage & Theatre",
    positionClass: "object-[50%_40%]",
  },
  {
    src: "/assets/about/slide-4.jpg",
    alt: "Atmospheric concert night performance with spotlights",
    caption: "Pro-Nites & Arena",
    positionClass: "object-top",
  },
  {
    src: "/assets/about/slide-5.jpg",
    alt: "High-voltage group dance choreography and stage competition",
    caption: "Group Dance Championship",
    positionClass: "object-[50%_24%]",
  },
  {
    src: "/assets/about/slide-6.jpg",
    alt: "Traditional and dramatic classical fusion dance showcase",
    caption: "Classical & Folk Fusion",
    positionClass: "object-[50%_28%]",
  },
];

function AboutSlideshow() {
  const [slideState, setSlideState] = useState(() => ({
    current: 0,
    mounted: [0, 1 % ABOUT_SLIDES.length],
  }));
  const [isPaused, setIsPaused] = useState(false);
  const { current, mounted } = slideState;

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setSlideState((prev) => {
        const nextCurrent = (prev.current + 1) % ABOUT_SLIDES.length;
        const preloadNext = (nextCurrent + 1) % ABOUT_SLIDES.length;
        const mountedSet = new Set(prev.mounted);
        mountedSet.add(nextCurrent);
        mountedSet.add(preloadNext);
        return {
          current: nextCurrent,
          mounted: Array.from(mountedSet),
        };
      });
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused]);

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-white/15 bg-[#090807] aspect-[4/3] sm:aspect-[16/11] lg:aspect-auto lg:h-full lg:min-h-[360px]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {ABOUT_SLIDES.map((slide, idx) =>
        mounted.includes(idx) ? (
          <div
            key={slide.src}
            className={`absolute inset-0 transition-opacity duration-700 ease-out ${
              idx === current ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <ChunkyImage
              src={slide.src}
              alt={slide.alt}
              priority={idx === 0}
              targetWidth={828}
              className={`w-full h-full object-cover ${slide.positionClass || "object-top"}`}
            />
          </div>
        ) : null
      )}

      {/* Subtle top/bottom vignette for caption legibility */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"
      />

      {/* Restrained editorial footer inside frame */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col gap-3 p-4 sm:p-5">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-amber-300/80">
            {String(current + 1).padStart(2, "0")} / {String(ABOUT_SLIDES.length).padStart(2, "0")} · Campus Archive
          </p>
          <p className="mt-0.5 truncate text-xs sm:text-sm font-medium text-white">
            {ABOUT_SLIDES[current].caption}
          </p>
        </div>

        {/* Clean thin progress rule bars (natural auto-advance) */}
        <div className="grid grid-cols-6 gap-1.5" aria-hidden="true">
          {ABOUT_SLIDES.map((slide, idx) => (
            <span
              key={slide.src}
              className={`block h-[2px] w-full rounded-full transition-colors duration-300 ${
                idx === current ? "bg-amber-400" : "bg-white/20"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function AboutSection() {
  return (
    <section
      id="about"
      className="relative z-10 border-t border-white/10 bg-[#060504]/85 px-4 sm:px-6 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-stretch">
          {/* Clean Photographic Archive Frame (Left) */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            className="lg:col-span-6"
          >
            <AboutSlideshow />
          </motion.div>

          {/* Editorial Copy & Key Metrics Tile (Right — compact height matched to slideshow) */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1], delay: 0.08 }}
            className="lg:col-span-6 rounded-xl border border-white/12 bg-[#0a0908]/95 p-5 sm:p-6 shadow-[0_16px_48px_rgba(0,0,0,0.88)] flex flex-col justify-between gap-4 text-left"
          >
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="h-[1px] w-7 bg-amber-400/70" aria-hidden="true" />
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber-300/85">
                  About Dhanak · IIST Thiruvananthapuram
                </span>
              </div>

              <h2
                className="font-bold tracking-tight text-white leading-[1.12]"
                style={{
                  fontFamily: "var(--font-cinzel), serif",
                  fontSize: "clamp(1.5rem, 2.5vw, 2.05rem)",
                }}
              >
                The Annual Cultural
                <span className="block text-amber-100/85">Festival of IIST</span>
              </h2>

              <p className="text-xs sm:text-sm leading-relaxed text-neutral-300">
                Hosted at the Indian Institute of Space Science and Technology in Valiamala, Thiruvananthapuram, Dhanak brings together college musicians, dancers, theatre ensembles, and artists for four days of competitions, pro-shows, and workshops — celebrating its 2027 edition, <span className="text-white/95">Ember from Ashes</span>.
              </p>
            </div>

            <div className="space-y-4">
              {/* Clean architectural metric rule */}
              <div className="grid grid-cols-3 gap-4 border-y border-white/10 py-3">
                <div>
                  <p
                    className="text-base sm:text-lg font-bold text-white"
                    style={{ fontFamily: "var(--font-cinzel), serif" }}
                  >
                    Est. 2008
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-400">
                    Valiamala Tradition
                  </p>
                </div>
                <div>
                  <p
                    className="text-base sm:text-lg font-bold text-white"
                    style={{ fontFamily: "var(--font-cinzel), serif" }}
                  >
                    4 Days
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-400">
                    Stage &amp; Arena
                  </p>
                </div>
                <div>
                  <p
                    className="text-base sm:text-lg font-bold text-white"
                    style={{ fontFamily: "var(--font-cinzel), serif" }}
                  >
                    50+
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-400">
                    Institutions
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/about"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-amber-400/40 bg-amber-500/10 px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200 hover:bg-amber-500/20 hover:border-amber-300/70 transition-colors"
                >
                  <span>Read the Chronicle</span>
                  <span aria-hidden="true">→</span>
                </Link>

                <Link
                  href="/events"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-white/10 px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70 hover:border-white/25 hover:text-white transition-colors"
                >
                  <span>Browse Events</span>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: FEATURED EVENTS ON HOME PAGE (Solo Singing, Anime Quiz, Painting, Solo Dance)
// ─────────────────────────────────────────────────────────────────────────────
const HOME_FEATURED_EVENT_IDS = [
  "solo-singing",
  "anime-quiz",
  "painting",
  "solo-dance",
];

function SideEventsSection() {
  const featuredEvents = HOME_FEATURED_EVENT_IDS.map((id) =>
    DHANAK_EVENTS.find((e) => e.id === id)
  ).filter(Boolean);

  return (
    <section className="relative z-10 px-4 sm:px-6 py-16 sm:py-20 max-w-6xl mx-auto">
      <div className="mb-8 sm:mb-10 text-center">
        <h2
          className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-3"
          style={{ textShadow: "0 3px 16px rgba(0,0,0,0.95)" }}
        >
          Featured Events
        </h2>
        <p
          className="text-xs sm:text-sm max-w-lg mx-auto font-semibold"
          style={{ color: "#FFFDF9", textShadow: "0 2px 14px rgba(0,0,0,1), 0 0 8px rgba(0,0,0,0.95)" }}
        >
          Hover over a card for a quick preview, or click View to register.
        </p>
      </div>

      {/* Featured 4 event tiles on home page; full 27-event lineup on /events */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
        {featuredEvents.map((ev) => (
          <LavaWorkshopTile key={ev.id} workshop={ev} href={`/events/${ev.id}`} />
        ))}
      </div>

      <div className="mt-8 text-center">
        <Link href="/events" className="btn-secondary">
          <span>And many more...</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: ABOUT IIST (INSTITUTION: THE NEXUS — from Conscientia + iist.ac.in)
// ─────────────────────────────────────────────────────────────────────────────
function AboutIISTSection() {
  return (
    <section
      id="about-iist"
      className="py-28 sm:py-36 px-6 md:px-20 border-y border-white/10 relative z-10"
      style={{ background: "rgba(8, 6, 4, 0.92)" }}
    >
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 lg:gap-24 items-center">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
          className="flex-1 space-y-10"
        >
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <Image
                src="/assets/iistlogo.png"
                alt="IIST Official Logo"
                width={52}
                height={52}
                sizes="52px"
                quality={75}
                className="w-12 h-12 object-contain drop-shadow-[0_0_12px_rgba(255,140,0,0.45)]"
              />
              <div>
                <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-orange-400">
                  About the Institution
                </p>
                <div className="w-12 h-[2px] bg-orange-500 mt-1" />
              </div>
            </div>
            <h2 className="section-heading text-4xl md:text-6xl font-black uppercase tracking-tight leading-none text-white">
              India&apos;s Space <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-300">
                Incubator
              </span>
            </h2>
          </div>

          <div className="space-y-6 text-white/95 font-normal leading-relaxed text-base md:text-lg max-w-xl">
            <p>
              The Indian Institute of Space Science and Technology (IIST) is India’s premier incubator for future leaders in space science, technology, and engineering.
            </p>
            <p>
              The institute is committed to excellence in teaching, learning and research. IIST fosters state-of-the-art research and development in space studies and provides a think-tank to explore new directions for the Indian Space Programme.
            </p>
            <p className="text-sm border-l-2 border-orange-500/60 pl-5 italic text-amber-100">
              Established in 2007 by the Dept. of Space with complete backing from ISRO.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            {[
              { label: "Established", val: "2007" },
              { label: "Under", val: "ISRO / Dept. of Space" },
            ].map((stat, i) => (
              <div
                key={i}
                className="border-l-2 border-orange-500/60 pl-6 py-3.5 bg-white/[0.03] rounded-r-xl"
              >
                <p className="text-[10px] font-syncopate text-orange-400/80 tracking-[0.35em] mb-2 uppercase font-black">
                  {stat.label}
                </p>
                <p className="font-syncopate text-sm tracking-widest text-white font-bold">
                  {stat.val}
                </p>
              </div>
            ))}
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <a
              href="https://iist.ac.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              <span>Visit Official IIST Website (iist.ac.in)</span>
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="flex-1 w-full max-w-lg aspect-[4/5] relative border border-orange-500/20 group overflow-hidden rounded-[2.5rem] shadow-[0_0_80px_rgba(0,0,0,0.7)]"
        >
          <ChunkyImage
            src="/assets/iist.png"
            alt="IIST Valiamala Campus"
            targetWidth={1080}
            className="absolute inset-0 w-full h-full object-cover opacity-95 group-hover:opacity-100 transition-all duration-500 scale-105 group-hover:scale-100"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080604] via-transparent to-transparent opacity-80" />
          <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-orange-300">
                Valiamala · Thiruvananthapuram
              </p>
              <p className="font-syncopate text-xs font-bold uppercase tracking-wider text-white mt-0.5">
                IIST Campus
              </p>
            </div>
            <a
              href="https://iist.ac.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/20 bg-black/60 backdrop-blur-md px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-widest text-amber-300 hover:border-orange-400"
            >
              iist.ac.in ↗
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function DhanakHomePage() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });

  return (
    <div ref={containerRef} className="relative" style={{ background: "#0C0A09" }}>
      {/* Scroll-reactive fire background */}
      <ScrollFireBg progress={scrollYProgress} />

      <HeroSection />
      <EventsSection />
      <WorkshopsSection />
      <AboutSection />
      <SideEventsSection />
      <AboutIISTSection />
    </div>
  );
}
