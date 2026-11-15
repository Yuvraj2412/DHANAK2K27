"use client";

/**
 * IntroController
 * ─────────────────────────────────────────────────────────────────────────────
 * Manages the intro sequence: Logo → Text Animation → Page Content
 *
 * State machine:
 *   "logo"    → CinematicIntro (logo video) plays
 *   "text"    → TextIntro (cinematic text) plays
 *   "revealed" → Page content is visible
 */

import React, { useState, useCallback, useEffect, useRef } from "react";
import { CinematicIntro } from "./intro";
import WorkshopIntro from "./intro/WorkshopIntro";

export default function IntroController({
  children,
  TextIntroComponent = WorkshopIntro,
}) {
  const [phase, setPhase] = useState("logo");
  const risersRef = useRef(null);

  // Prevent scroll during intro
  useEffect(() => {
    if (phase !== "revealed") {
      document.documentElement.style.overflow = "hidden";
    } else {
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [phase]);

  const handleLogoEnd = useCallback(() => {
    // Sound effects removed per user request
  }, []);

  const handleLogoComplete = useCallback(() => {
    setPhase("text");
  }, []);

  // Fade out risers on unmount
  useEffect(() => {
    return () => {
      if (risersRef.current) {
        try {
          risersRef.current.pause();
        } catch {}
      }
    };
  }, []);

  const handleTextComplete = useCallback(() => {
    setPhase("revealed");
  }, []);

  return (
  <>
    {/* Main page is always mounted so it can load while the intro plays */}
    <div
      style={{
        opacity: phase === "revealed" ? 1 : 0,
        transition: "opacity 0.4s ease-out",
      }}
    >
      {children}
    </div>

    {/* Phase 1: Logo video */}
    {phase === "logo" && (
      <CinematicIntro onComplete={handleLogoComplete} onLogoEnd={handleLogoEnd} />
    )}

    {/* Phase 2: Cinematic text animation */}
    {phase === "text" && (
      <TextIntroComponent risersRef={risersRef} onComplete={handleTextComplete} />
    )}
  </>
);
}
