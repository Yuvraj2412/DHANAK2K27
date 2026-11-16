"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, ArrowLeft, Crown } from "lucide-react";
import LavaWorkshopTile from "../components/LavaWorkshopTile";
import FetchIntro from "../components/FetchIntro";
import { getCatalog } from "@/lib/catalogStore";
import { groupBySection } from "../lib/groupBySection";
import useSound from "../hooks/useSound";

function RoyalSectionHeading({ title, accentColor = "#FFB300", count }) {
  return (
    <div className="flex items-center gap-4 mb-6 mt-2">
      <div className="flex items-center gap-2 shrink-0">
        <span
          className="inline-block w-2.5 h-2.5 rotate-45"
          style={{
            background: "linear-gradient(135deg, #FFE57F 0%, #FF8C00 100%)",
            boxShadow: `0 0 10px ${accentColor}`,
          }}
        />
        <div
          className="w-8 h-[2px] rounded-full"
          style={{
            background: `linear-gradient(90deg, ${accentColor}, transparent)`,
          }}
        />
      </div>
      <h2
        className="text-lg sm:text-2xl font-black uppercase tracking-wider"
        style={{
          fontFamily: "var(--font-cinzel), 'Cinzel Decorative', serif",
          background: "linear-gradient(135deg, #FFFFFF 0%, #FFE082 55%, #FF9800 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          filter: "drop-shadow(0 2px 12px rgba(0,0,0,0.95))",
        }}
      >
        {title}
      </h2>
      {count != null && (
        <span
          className="text-[11px] font-mono font-bold px-3 py-0.5 rounded-full border"
          style={{
            color: "#FFD54F",
            borderColor: "rgba(255, 193, 7, 0.4)",
            background: "rgba(255, 143, 0, 0.12)",
          }}
        >
          {count} {count === 1 ? "Event" : "Events"}
        </span>
      )}
      <div
        className="flex-1 h-[1px]"
        style={{
          background: "linear-gradient(90deg, rgba(255, 193, 7, 0.35), rgba(255, 87, 34, 0.12), transparent)",
        }}
      />
    </div>
  );
}

export default function EventsPage() {
  const playClick = useSound("/sounds/click.wav", 0.1, 0.08);
  const [eventCards, setEventCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;
    getCatalog("event").then((cards) => {
      if (active) {
        setEventCards(cards);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const query = search.trim().toLowerCase();
  const filteredCards = query
    ? eventCards.filter((card) =>
        [card.title, card.subtitle, card.section, card.type, ...(card.tags || [])]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(query))
      )
    : eventCards;

  const sections = groupBySection(filteredCards);

  return (
    <div className="min-h-screen bg-[#0C0A09] text-[#F5F2EB] relative">
      {/* Static Royal Amber Top Halo (Zero GPU lag) */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[75vw] h-[320px] pointer-events-none z-0"
        style={{
          background: "radial-gradient(ellipse 65% 45% at 50% 0%, rgba(255, 160, 0, 0.14) 0%, transparent 75%)",
        }}
      />

      <FetchIntro loading={loading} label="Loading Royal Arenas" accentColor="#FFB300" />

      {/* Floating Home Back Button */}
      <div className="safe-bottom fixed bottom-5 left-5 z-50">
        <Link
          href="/"
          onClick={() => playClick()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#180B05] hover:bg-[#261107] border border-[#FFB300]/45 text-[#FFD54F] text-xs font-semibold tracking-wider uppercase shadow-xl transition-all hover:scale-105 active:scale-95"
        >
          <ArrowLeft size={14} />
          <span>Home</span>
        </Link>
      </div>

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-28">
        {/* Royal Header */}
        <header className="mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[11px] font-mono font-bold tracking-widest text-[#FFD54F] bg-[#1F0B04] border border-[#FFB300]/40 uppercase mb-4 shadow-sm">
            <Crown size={13} className="text-[#FFD54F]" />
            <span>Dhanak 2027 · Official Competitions</span>
          </div>

          <h1
            className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight uppercase mb-3"
            style={{
              fontFamily: "var(--font-cinzel), 'Cinzel Decorative', serif",
              background: "linear-gradient(135deg, #FFFFFF 0%, #FFE57F 50%, #FF8C00 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 4px 18px rgba(0,0,0,0.9))",
            }}
          >
            Imperial Event Arenas
          </h1>

          <p
            className="text-sm sm:text-base text-white max-w-2xl leading-relaxed font-semibold"
            style={{ textShadow: "0 2px 14px rgba(0,0,0,0.98), 0 0 8px rgba(0,0,0,0.95)" }}
          >
            Dhanak brings together performers, musicians, quizzers, writers, and creators from across the nation.
            Select an arena tile below to inspect rules, prize pools, and register.
          </p>

          {/* Search Bar */}
          <div className="mt-6 max-w-md relative">
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#160A05] border border-[#FFB300]/35 focus-within:border-[#FFD54F] transition-colors shadow-lg">
              <Search size={16} className="text-[#FFD54F] shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events by keyword..."
                className="w-full bg-transparent text-sm text-white placeholder-white/50 outline-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="text-white/50 hover:text-white text-base leading-none cursor-pointer"
                  aria-label="Clear search"
                >
                  &times;
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Empty Search State */}
        {!loading && query && filteredCards.length === 0 && (
          <div className="text-center py-16 px-4 rounded-2xl bg-[#140804] border border-[#FFB300]/20">
            <p className="text-white/80 text-sm mb-3">No events match &ldquo;{search}&rdquo;</p>
            <button
              onClick={() => setSearch("")}
              className="text-xs font-semibold text-[#FFD54F] hover:underline uppercase tracking-wider cursor-pointer"
            >
              Clear filter
            </button>
          </div>
        )}

        {/* Sections Breakdown with Clean Dhanak Hover-Popup Photo Tiles */}
        <div className="space-y-14 sm:space-y-16">
          {sections.map(({ section, color, cards }) => (
            <section key={section}>
              <RoyalSectionHeading title={section} accentColor={color} count={cards.length} />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {cards.map((card) => (
                  <LavaWorkshopTile key={card.id} workshop={card} href={`/events/${card.id}`} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
