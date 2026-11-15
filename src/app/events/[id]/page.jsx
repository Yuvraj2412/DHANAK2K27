"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { ArrowLeft, Clock, Sparkles } from "lucide-react";
import FetchIntro from "@/app/components/FetchIntro";
import ChunkyImage from "@/app/components/ChunkyImage";
import { getCatalogItem } from "@/lib/catalogStore";
import useSound from "@/app/hooks/useSound";
import EventFullDetail from "./EventFullDetail";

// Reversible event unlock list: remove an event ID (or clear this Set)
// to revert that event page back to the "Announcing Later" placeholder.
const UNLOCKED_EVENT_IDS = new Set(["battle-of-bands"]);

export default function EventDetailPage() {
  const params = useParams();
  const id = params.id;

  if (UNLOCKED_EVENT_IDS.has(String(id || ""))) {
    return <EventFullDetail id={id} />;
  }

  return <AnnouncingLaterEventDetail id={id} />;
}

function AnnouncingLaterEventDetail({ id }) {
  const [card, setCard] = useState(null);
  const [cardLoading, setCardLoading] = useState(true);
  const playClick = useSound("/sounds/click.wav", 0.1, 0.08);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCardLoading(true);
    getCatalogItem("event", id).then((found) => {
      if (!active) return;
      setCard(found);
      setCardLoading(false);
    });
    return () => {
      active = false;
    };
  }, [id]);

  if (cardLoading) {
    return <FetchIntro loading label="Loading Event" accentColor="#FF7A00" />;
  }

  if (!card) {
    return (
      <div className="relative min-h-screen bg-[#080604] text-white flex items-center justify-center px-4">
        <div className="relative z-10 text-center max-w-md">
          <h1 className="text-3xl font-bold mb-3">Event Not Found</h1>
          <p className="text-white/65 mb-6">
            The requested competition could not be found in the Dhanak catalog.
          </p>
          <Link
            href="/events"
            className="inline-flex items-center gap-2 rounded-xl px-6 py-3 bg-gradient-to-r from-[#FF4500] to-[#FFB300] text-black font-bold text-sm hover:brightness-110 transition"
          >
            <ArrowLeft size={16} />
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#080604] text-white overflow-x-hidden">
      {/* Top Warm Ambient Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[85vw] h-[380px] z-0"
        style={{
          background:
            "radial-gradient(ellipse 65% 45% at 50% 0%, rgba(255, 115, 0, 0.14) 0%, transparent 75%)",
        }}
      />

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-24">
        {/* ── Top Breadcrumb Bar ──────────────────────────────── */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link
            href="/events"
            onClick={() => playClick()}
            className="inline-flex min-h-[44px] sm:min-h-0 items-center gap-2 rounded-full border border-amber-500/25 bg-[#160D08]/90 px-4 py-1.5 text-xs sm:text-sm font-semibold text-amber-200 hover:border-amber-400/60 hover:text-white transition-colors"
          >
            <ArrowLeft size={15} />
            <span>Back to All Events</span>
          </Link>

          <span className="text-xs font-mono uppercase tracking-widest text-amber-300/65 hidden sm:inline">
            Dhanak · {card.section || "Official Event"}
          </span>
        </div>

        {/* ── Hero Banner (Event Title + Image Preserved) ─────── */}
        <section className="relative rounded-2xl bg-gradient-to-br from-[#1B100A]/95 via-[#130C08]/95 to-[#0D0806]/95 border border-amber-500/25 overflow-hidden mb-8 shadow-[0_20px_60px_rgba(0,0,0,0.75)]">
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-amber-400/80 to-transparent" />

          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Left: Event Title & Status Badge */}
            <div className="lg:col-span-7 p-6 sm:p-8 md:p-10 flex flex-col justify-center">
              <div className="flex flex-wrap items-center gap-2.5 mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-gradient-to-r from-orange-500/20 to-amber-500/15 text-amber-300 border border-amber-400/35">
                  {card.badgeIcon && <span>{card.badgeIcon}</span>}
                  <span>{card.section || card.type || "Event"}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-amber-500/15 text-amber-200 border border-amber-400/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span>Announcing Later</span>
                </span>
              </div>

              <h1
                className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight mb-3"
                style={{
                  background: "linear-gradient(135deg, #FFFFFF 0%, #FFE599 65%, #FFB300 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {card.title}
              </h1>

              {card.subtitle && (
                <p className="text-sm sm:text-base text-white/75 leading-relaxed">
                  {card.subtitle}
                </p>
              )}
            </div>

            {/* Right: Cover Image (Preserved) */}
            <div className="lg:col-span-5 relative min-h-[250px] sm:min-h-[310px] bg-black">
              {card.image && (
                <ChunkyImage
                  src={card.image}
                  alt={card.title}
                  priority
                  targetWidth={1080}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#130C08] via-transparent to-transparent lg:bg-gradient-to-r lg:from-[#130C08] lg:via-transparent lg:to-transparent pointer-events-none" />
            </div>
          </div>
        </section>

        {/* ── Announcing Later Notice ─────────────────────────── */}
        <section className="rounded-2xl bg-gradient-to-b from-[#1B110B]/95 to-[#120B07]/95 border border-amber-500/25 p-8 sm:p-12 text-center shadow-[0_20px_50px_rgba(0,0,0,0.75)]">
          <div className="mx-auto max-w-xl flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500/25 to-amber-500/10 border border-amber-400/35 flex items-center justify-center text-amber-300 shadow-[0_0_24px_rgba(255,140,0,0.2)] mb-5">
              <Clock size={26} />
            </div>

            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-[0.22em] text-amber-300 bg-amber-500/10 border border-amber-400/30 mb-4">
              <Sparkles size={12} />
              <span>Event Details</span>
            </span>

            <h2
              className="text-2xl sm:text-4xl font-black tracking-tight uppercase mb-3"
              style={{
                background: "linear-gradient(135deg, #FFFFFF 0%, #FFE599 60%, #FF9800 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Announcing Later
            </h2>

            <p className="text-sm sm:text-base text-white/70 leading-relaxed mb-8">
              Full rules, schedule, venue, prize pool, and registrations for{" "}
              <span className="text-white font-semibold">{card.title}</span> are
              being finalized and will be announced soon.
            </p>

            <Link
              href="/events"
              onClick={() => playClick()}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl px-6 py-3 bg-gradient-to-r from-[#FF4500] via-[#FF7A00] to-[#FFB300] text-black font-extrabold text-xs sm:text-sm uppercase tracking-wider hover:brightness-110 transition-all shadow-[0_8px_28px_rgba(255,90,0,0.3)]"
            >
              <ArrowLeft size={16} />
              <span>Explore All Events</span>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
