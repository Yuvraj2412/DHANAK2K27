"use client";

import React, { useState, useSyncExternalStore } from "react";
import Image from "next/image";

const emptySubscribe = () => () => { };
const supportsWebm = () => {
  const vid = document.createElement("video");
  return Boolean(vid.canPlayType && vid.canPlayType("video/webm") !== "");
};

/**
 * IntroLogo
 * ─────────────────────────────────────────────────────────────────────────────
 * Plays the animated logo video during the intro, falling back cleanly on
 * iOS Safari / browsers that cannot decode WebM.
 * Keep the outer wrapper exactly as it is because GSAP animates it.
 */

export function IntroLogo({ logoRef }) {
  const canPlayWebm = useSyncExternalStore(emptySubscribe, supportsWebm, () => true);
  const [videoErrored, setVideoErrored] = useState(false);
  const useImageFallback = !canPlayWebm || videoErrored;

  return (
    <div
      ref={logoRef}
      className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
      aria-hidden="true"
    >
      {/* Animated Logo Video (with iOS fallback emblem) */}
      <div className="relative flex items-center justify-center select-none">
        {useImageFallback ? (
          <Image
            src="/assets/dhanak-logo.png"
            alt=""
            width={320}
            height={320}
            sizes="(max-width: 768px) 220px, 320px"
            priority
            className="w-[220px] md:w-[320px] lg:w-[380px] h-auto object-contain"
          />
        ) : (
          <video
            autoPlay
            muted
            playsInline
            preload="auto"
            onError={() => setVideoErrored(true)}
            className="w-[220px] md:w-[320px] lg:w-[380px] h-auto object-contain"
          >
            {/* Preferred format */}
            <source src="/intro.webm" type="video/webm" />
          </video>
        )}
      </div>
    </div>
  );
}