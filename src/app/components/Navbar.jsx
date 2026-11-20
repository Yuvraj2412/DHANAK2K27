"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserRound, ShoppingCart } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useMusic } from "../context/MusicContext";
import useProfile from "../hooks/useProfile";
import useBodyScrollLock from "../hooks/useBodyScrollLock";
import { NAV_LINKS, FEST_NAME, FEST_TAGLINE, FEST_INSTITUTE, SOCIAL_LINKS } from "@/lib/festConfig";

function MusicDisc({
  playing,
  muted,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
  onPointerCancel,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
      onPointerCancel={onPointerCancel}
      title="Tap to play/pause background music"
      aria-label={playing && !muted ? "Pause background music" : "Play background music"}
      className="relative flex items-center justify-center transition-all duration-300 hover:scale-110"
      style={{ width: 32, height: 32 }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: "radial-gradient(circle at 35% 35%, #3D2A1A, #0C0A09)",
          border: "1.5px solid rgba(255,107,0,0.4)",
          boxShadow:
            playing && !muted
              ? "0 0 12px rgba(255,107,0,0.5), inset 0 0 6px rgba(255,69,0,0.3)"
              : "none",
          animation: playing && !muted ? "vinylSpin 2.4s linear infinite" : "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: muted ? "#555" : "#FF6B00",
            boxShadow: muted ? "none" : "0 0 6px #FF6B00",
          }}
        />
      </div>
    </button>
  );
}

const socialLinks = [
  {
    label: "Instagram",
    href: SOCIAL_LINKS.instagram,
    icon: "/icons/instagram.svg",
  },
  {
    label: "LinkedIn",
    href: SOCIAL_LINKS.linkedin,
    icon: "/icons/linkedin.svg",
  },
  {
    label: "YouTube",
    href: SOCIAL_LINKS.youtube,
    icon: "/icons/youtube.svg",
  },
];

export default function Nav() {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  useBodyScrollLock(isMenuOpen && !isAdminRoute);
  const [scrolled, setScrolled] = useState(false);
  const { items: cartItems } = useCart();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { playing, muted, toggle: toggleMusic } = useMusic();
  const holdTimerRef = useRef(null);
  const longPressFiredRef = useRef(false);

  const handleDiscPointerDown = () => {
    longPressFiredRef.current = false;
    holdTimerRef.current = setTimeout(() => {
      longPressFiredRef.current = true;
    }, 3000);
  };
  const clearDiscHold = () => clearTimeout(holdTimerRef.current);
  const handleDiscClick = () => {
    if (longPressFiredRef.current) {
      longPressFiredRef.current = false;
      return;
    }
    toggleMusic();
  };

  useEffect(() => {
    if (isAdminRoute) return;
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isAdminRoute]);

  useEffect(() => {
    if (isAdminRoute) return;
    if (isMenuOpen) {
      document.body.setAttribute("data-menu-open", "true");
    } else {
      document.body.removeAttribute("data-menu-open");
    }
    return () => {
      document.body.removeAttribute("data-menu-open");
    };
  }, [isMenuOpen, isAdminRoute]);

  useEffect(() => {
    if (!isMenuOpen || isAdminRoute) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMenuOpen, isAdminRoute]);

  if (isAdminRoute) return null;

  return (
    <>
      <style>{`
        @keyframes vinylSpin { to { transform: rotate(360deg); } }
      `}</style>

      {/* ── FLOATING NAVBAR ── */}
      <nav
        className={`safe-top fixed top-2 sm:top-4 left-1/2 -translate-x-1/2 w-[94%] sm:w-[95%] max-w-[100vw] z-[99999] transition-[height,background-color,border-color,box-shadow] duration-300 rounded-2xl sm:rounded-3xl flex items-center justify-between gap-2 sm:gap-4 px-2.5 sm:px-6 md:px-10 border ${scrolled
          ? "h-12 sm:h-16 border-orange-500/[0.25] bg-[#0C0A09]/92 backdrop-blur-md sm:backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.8)]"
          : "h-14 sm:h-20 md:h-24 bg-[#0C0A09]/80 backdrop-blur-md sm:backdrop-blur-xl border-orange-900/35 shadow-[0_10px_40px_rgba(0,0,0,0.6)]"
          }`}
      >
        {/* Logo / Brand + Institute */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0 leading-none select-none">
          <Link href="/" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-1.5 sm:gap-3 group transition-transform duration-200 hover:scale-[1.03]">
            <div className="relative w-7 h-7 sm:w-10 sm:h-10 shrink-0 transition-transform duration-300 group-hover:scale-110">
              <Image
                src="/assets/dhanak-logo.png"
                alt="Dhanak Festival Logo"
                width={40}
                height={40}
                sizes="(max-width: 640px) 28px, 40px"
                priority
                className="w-full h-full object-contain filter drop-shadow-[0_0_12px_rgba(255,107,0,0.7)]"
              />
            </div>
            <div className="hidden sm:flex flex-col leading-none">
              <span
                className="font-bold tracking-wider brand-text text-[0.95rem] sm:text-[1.4rem] md:text-[1.65rem]"
                style={{
                  letterSpacing: "0.08em",
                }}
              >
                {FEST_NAME}
              </span>
              <span
                className="brand-tagline-cinzel text-[0.44rem] sm:text-[0.55rem] whitespace-nowrap"
                style={{
                  letterSpacing: "0.24em",
                  fontWeight: 700,
                  marginTop: 2,
                }}
              >
                {FEST_TAGLINE}
              </span>
            </div>
          </Link>

          <span aria-hidden="true" className="h-6 sm:h-8 w-px bg-white/15 shrink-0" />

          <Link
            href="/#about-iist"
            onClick={() => setIsMenuOpen(false)}
            title={FEST_INSTITUTE}
            className="flex items-center group shrink-0"
          >
            <div className="relative w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 shrink-0 rounded-full overflow-hidden bg-white border border-white/25 shadow-[0_0_10px_rgba(255,255,255,0.18)] transition-transform duration-300 group-hover:scale-105">
              <Image
                src="/assets/iist-header-logo.jpg"
                alt={`${FEST_INSTITUTE} Logo`}
                width={36}
                height={36}
                sizes="(max-width: 640px) 28px, 36px"
                priority
                className="w-full h-full object-cover"
              />
            </div>
          </Link>
        </div>

        {/* Flexible spacer keeping brand clear of right-side controls */}
        <div aria-hidden="true" className="min-w-2 flex-1" />

        {/* Right side controls */}
        <div className="flex items-center gap-1 sm:gap-6 shrink-0 relative z-[110]">
          {/* Cart */}
          <Link
            href="/cart"
            onClick={() => setIsMenuOpen(false)}
            aria-label="Cart"
            className="relative inline-flex items-center justify-center w-9 h-9 sm:w-auto sm:h-auto sm:min-w-[44px] sm:min-h-[44px] touch-manipulation [-webkit-tap-highlight-color:transparent] text-white hover:text-amber-300 transition-transform duration-200 hover:scale-110 drop-shadow-[0_2px_8px_rgba(0,0,0,1)]"
          >
            <ShoppingCart size={18} className="sm:w-[20px] sm:h-[20px]" />
            {cartItems.length > 0 && (
              <span
                className="absolute top-0 right-0 sm:-top-1.5 sm:-right-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-black text-black"
                style={{ background: "#FF4500", boxShadow: "0 0 8px rgba(255,69,0,0.7)" }}
              >
                {cartItems.length}
              </span>
            )}
          </Link>

          {/* Profile */}
          <Link
            href="/profile"
            onClick={() => setIsMenuOpen(false)}
            aria-label="Profile"
            className="inline-flex items-center justify-center w-9 h-9 sm:w-auto sm:h-auto sm:min-w-[44px] sm:min-h-[44px] touch-manipulation [-webkit-tap-highlight-color:transparent] gap-2 text-white hover:text-amber-300 transition-transform duration-200 hover:scale-110 drop-shadow-[0_2px_8px_rgba(0,0,0,1)]"
          >
            <UserRound size={18} className="sm:w-[20px] sm:h-[20px]" />
            {user && profile?.unique_code && (
              <span
                className="hidden sm:inline-block rounded-full px-2.5 py-0.5 font-mono text-[10px] tracking-[0.1em] font-bold"
                style={{
                  border: "1px solid rgba(255,107,0,0.6)",
                  background: "rgba(12,10,9,0.9)",
                  color: "#FFAE19",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.9)",
                }}
              >
                {profile.unique_code}
              </span>
            )}
          </Link>

          {/* Music disc */}
          <MusicDisc
            playing={playing}
            muted={muted}
            onPointerDown={handleDiscPointerDown}
            onPointerUp={clearDiscHold}
            onPointerLeave={clearDiscHold}
            onPointerCancel={clearDiscHold}
            onClick={handleDiscClick}
          />

          {/* Menu / Close Button */}
          <button
            type="button"
            onClick={() => setIsMenuOpen((v) => !v)}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            className="inline-flex items-center gap-1.5 sm:gap-0 shrink-0 rounded-lg border border-white/15 bg-white/[0.06] hover:border-amber-400/50 px-2.5 h-9 sm:h-auto sm:min-w-[44px] sm:min-h-[44px] sm:border-0 sm:bg-transparent sm:p-0 touch-manipulation [-webkit-tap-highlight-color:transparent] group overflow-hidden cursor-pointer drop-shadow-[0_2px_8px_rgba(0,0,0,1)] transition-colors"
          >
            <div className="flex flex-col items-end sm:mr-3 overflow-hidden">
              <span className="font-mono text-[9px] sm:text-[10px] tracking-[0.18em] sm:tracking-[0.28em] text-white/90 sm:text-white font-semibold group-hover:text-amber-300 transition-colors duration-200">
                {isMenuOpen ? "CLOSE" : "MENU"}
              </span>
            </div>
            <div className="relative w-5 h-6 sm:w-8 sm:h-8 flex items-center justify-center">
              <div className="flex flex-col gap-1.5 items-end">
                <span
                  className={`h-[2px] bg-white group-hover:bg-amber-400 block rounded-full transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${isMenuOpen ? "w-5 translate-y-[8px] rotate-45" : "w-4 translate-y-0 rotate-0"
                    }`}
                />
                <span
                  className={`h-[2px] w-[22px] bg-white group-hover:bg-orange-400 block rounded-full transition-opacity duration-200 ${isMenuOpen ? "opacity-0" : "opacity-100"
                    }`}
                />
                <span
                  className={`h-[2px] bg-white group-hover:bg-amber-400 block rounded-full transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${isMenuOpen ? "w-5 -translate-y-[8px] -rotate-45" : "w-[13px] translate-y-0 rotate-0"
                    }`}
                />
              </div>
            </div>
          </button>
        </div>
      </nav>

      {/* ── SILKY GPU-COMPOSITED SPLIT MENU ── */}
      <div
        aria-hidden={!isMenuOpen}
        className={`fixed inset-0 z-[99998] flex overflow-hidden ${isMenuOpen ? "pointer-events-auto visible" : "pointer-events-none invisible"
          }`}
        style={{
          transition: isMenuOpen
            ? "visibility 0s linear 0s"
            : "visibility 0s linear 300ms",
        }}
      >
        {/* Left Atmospheric Backdrop (no dynamic backdrop-blur repaint during slide) */}
        <div
          onClick={() => setIsMenuOpen(false)}
          className={`w-[15%] sm:w-1/2 h-full border-r border-orange-500/15 cursor-pointer flex items-center justify-center will-change-[opacity] transition-opacity duration-300 ease-out ${isMenuOpen ? "opacity-100" : "opacity-0"
            }`}
          style={{
            contain: "layout paint",
            background:
              "radial-gradient(circle at center, rgba(22, 10, 4, 0.92) 0%, rgba(4, 3, 2, 0.97) 72%)",
          }}
        >
          <div className="pointer-events-none relative hidden sm:flex flex-col items-center justify-center p-6">
            <div
              aria-hidden="true"
              className="absolute inset-4 rounded-full opacity-45"
              style={{
                background:
                  "radial-gradient(circle, rgba(255,115,0,0.28) 0%, transparent 70%)",
              }}
            />
            <Image
              src="/assets/dhanak-logo.png"
              alt="Dhanak Official Logo"
              width={320}
              height={320}
              sizes="(max-width: 768px) 224px, 288px"
              priority
              className="relative w-36 sm:w-56 md:w-72 h-auto object-contain opacity-95"
            />
          </div>
        </div>

        {/* Right Drawer (Single isolated translate3d GPU layer — zero competing child transforms) */}
        <div
          className="relative flex h-full w-[85%] sm:w-1/2 sm:max-w-[50vw] ml-auto flex-col justify-between border-l border-orange-500/20 bg-[#050302] px-6 sm:px-10 md:px-14 lg:px-20 overflow-y-auto overflow-x-hidden will-change-transform transition-transform duration-[300ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            contain: "layout paint",
            transform: isMenuOpen ? "translate3d(0, 0, 0)" : "translate3d(100%, 0, 0)",
          }}
        >
          {/* Nav Links — crisp Cinzel serif matching Dhanak brand identity */}
          <nav
            aria-label="Primary menu"
            className="flex flex-col gap-1 sm:gap-1.5 relative z-10 my-auto pt-[max(4.75rem,calc(env(safe-area-inset-top)+4rem))] pb-4"
          >
            {NAV_LINKS.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  tabIndex={isMenuOpen ? 0 : -1}
                  onClick={() => setIsMenuOpen(false)}
                  className="group relative flex items-center min-h-[44px] sm:min-h-[42px] max-w-full py-1 touch-manipulation [-webkit-tap-highlight-color:transparent]"
                >
                  <span
                    className={`text-[clamp(1.15rem,4.5vw,1.5rem)] sm:text-[clamp(1.4rem,3.3vh,2.2rem)] font-bold uppercase leading-[1.2] tracking-[0.14em] transition-colors duration-150 ${
                      isActive
                        ? "text-amber-300"
                        : "text-white/95 group-hover:text-amber-300"
                    }`}
                    style={{
                      fontFamily: "var(--font-cinzel), 'Cinzel', serif",
                    }}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Official Dhanak Social Media Footer Inside Drawer */}
          <div className="relative z-10 pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))] sm:pb-7 flex flex-col gap-4 border-t border-white/[0.08] pt-4">
            <div className="flex flex-wrap items-center gap-4 sm:gap-7">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  tabIndex={isMenuOpen ? 0 : -1}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex min-h-[44px] sm:min-h-0 items-center touch-manipulation [-webkit-tap-highlight-color:transparent] font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-white/65 hover:text-amber-300 transition-colors duration-150"
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={social.icon}
                      alt=""
                      aria-hidden="true"
                      className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-150 group-hover:scale-110"
                    />
                    <span>{social.label}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="h-[max(3.75rem,10dvh)] shrink-0 bg-transparent" aria-hidden />
    </>
  );
}
