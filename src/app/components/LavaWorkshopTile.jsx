"use client";

import Link from "next/link";
import ChunkyImage from "./ChunkyImage";

/**
 * LavaWorkshopTile — Clean Dhanak Photo Card with Simple Hover Text Popup
 *
 * Matches the previous Dhanak website "Featured Events" card design:
 * - Full-bleed event/workshop photograph with a dark bottom gradient overlay
 * - Category label + bold white title
 * - On hover: simple text description smoothly pops up above the bottom row
 * - Bottom row: "View" button on the left + status/date caption on the right
 * - Pure CSS transitions — zero JS mousemove listeners, zero lag
 */
export default function LavaWorkshopTile({ workshop, href }) {
  if (!workshop) return null;

  const targetHref = href || `/workshop/${workshop.id}`;
  const categoryLabel = (workshop.type || workshop.section || "Event")
    .split("·")
    .pop()
    .trim();
  const popupText =
    workshop.subtitle ||
    workshop.description ||
    "Click View to explore details, schedule, and registration.";

  return (
    <Link
      href={targetHref}
      className="group relative block w-full h-[240px] sm:h-[255px] rounded-2xl overflow-hidden bg-[#111113] border border-white/10 hover:border-white/25 transition-colors duration-300 select-none"
      aria-label={`View ${workshop.title}`}
    >
      {/* Background Photograph with Adaptive & Chunky Loading */}
      {workshop.image && (
        <ChunkyImage
          src={workshop.image}
          alt={workshop.title}
          loading="lazy"
          targetWidth={640}
          className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
        />
      )}

      {/* Bottom-Anchored Dark Scrim (keeps upper photography bright & sharp) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 via-45% to-transparent group-hover:from-black/92 group-hover:via-black/50 transition-colors duration-300"
      />

      {/* Bottom-Anchored Content */}
      <div className="relative z-10 flex flex-col justify-end h-full p-5 text-left">
        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#EF4444] mb-1 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
          {categoryLabel}
        </span>

        <h3 className="text-lg sm:text-xl font-extrabold text-white leading-snug line-clamp-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
          {workshop.title}
        </h3>

        {/* Simple Text Popup on Hover (revealed cleanly on touch devices) */}
        <div className="touch-reveal grid grid-rows-[0fr] opacity-0 group-hover:grid-rows-[1fr] group-hover:opacity-100 transition-all duration-300 ease-out">
          <div className="overflow-hidden">
            <p className="text-xs sm:text-[13px] text-white/85 leading-relaxed line-clamp-2 pt-1.5">
              {popupText}
            </p>
          </div>
        </div>

        {/* Bottom Row: View Button + Caption */}
        <div className="mt-3.5 flex items-center justify-between gap-3">
          <span className="inline-flex items-center justify-center rounded-lg border border-white/20 bg-white/10 group-hover:border-amber-400/60 group-hover:bg-amber-500 group-hover:text-zinc-950 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-white backdrop-blur-sm transition-all duration-200 shrink-0">
            View
          </span>
          <span className="text-[11px] text-white/70 truncate">
            {workshop.eventDate || "Registrations welcome"}
          </span>
        </div>
      </div>
    </Link>
  );
}
