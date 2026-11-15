"use client";

import React from "react";

/**
 * Dhanak3DTitle — Simple, lightweight metallic display typography for DHANAK.
 * Kept intentionally static (no 3D transforms, RAF loops, or particle effects)
 * so rendering stays crisp and lag-free on both mobile and desktop.
 */
export default function Dhanak3DTitle({
  text = "DHANAK",
  className = "",
  fontSize = "clamp(2.8rem,9vw,5.6rem)",
  letterSpacing = "0.18em",
  onClick,
  style = {},
}) {
  return (
    <div
      onClick={onClick}
      className={`relative inline-flex items-center justify-center select-none py-2 px-3 ${onClick ? "cursor-pointer" : ""} ${className}`}
      aria-label={text}
    >
      <span
        className="font-bold uppercase inline-block select-none leading-none whitespace-nowrap"
        style={{
          fontSize,
          letterSpacing,
          marginRight: `calc(-1 * ${letterSpacing})`,
          fontFamily: "var(--font-cinzel-decorative), 'Cinzel Decorative', 'Cinzel', serif",
          backgroundImage:
            "linear-gradient(180deg, #FFE4CE 0%, #FFC9A3 48%, #F4A071 80%, #DF7443 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          filter: "drop-shadow(0 4px 14px rgba(0, 0, 0, 0.9))",
          ...style,
        }}
      >
        {text}
      </span>
    </div>
  );
}
