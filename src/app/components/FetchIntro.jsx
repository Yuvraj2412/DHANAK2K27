"use client";

import { useEffect, useState } from "react";
import LoadingState from "./LoadingState";

/**
 * Fetch-driven transition overlay for Dhanak 2026.
 * Shows the flapping 3D Phoenix loading emblem against an obsidian heat backdrop.
 * Fades out smoothly once loading completes.
 */
export default function FetchIntro({ loading, label = "Loading", accentColor = "#FF6B00" }) {
  const [mounted, setMounted] = useState(loading);

  useEffect(() => {
    if (loading) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMounted(true);
      return;
    }
    const t = setTimeout(() => setMounted(false), 350);
    return () => clearTimeout(t);
  }, [loading]);

  if (!mounted) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 250,
        opacity: loading ? 1 : 0,
        transition: "opacity 0.35s ease-out",
        pointerEvents: loading ? "auto" : "none",
        overflow: "hidden",
        background: "radial-gradient(ellipse at 50% 30%, #1a0c08 0%, #080605 85%)",
      }}
    >
      <LoadingState label={label} accentColor={accentColor} />
    </div>
  );
}
