"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};
const getIsCoarseTouch = () =>
  Boolean(window.matchMedia?.("(hover: none), (pointer: coarse)").matches);

const CONCEPT_ART_BG = "url('/assets/phoenix-concept-art.jpg')";

// Physically-based cubic/Gaussian falloff curve:
// Starts at 100% in the core, then softly and continuously dissolves into pure black.
const STATIC_MASK =
  "radial-gradient(circle closest-side, rgba(0,0,0,1) 0%, rgba(0,0,0,0.98) 22%, rgba(0,0,0,0.85) 44%, rgba(0,0,0,0.60) 65%, rgba(0,0,0,0.32) 82%, rgba(0,0,0,0.12) 93%, rgba(0,0,0,0.02) 98%, transparent 100%)";

function getSpotlightMetrics() {
  if (typeof window !== "undefined" && window.innerWidth < 768) {
    const diameter = Math.round(Math.max(window.innerWidth * 1.35, window.innerHeight * 0.62));
    return { diameter, glowSize: diameter + 40 };
  }
  return { diameter: 500, glowSize: 540 };
}

/**
 * IlluminatedTileBackdrop — Dhanak Phoenix Concept Art Backdrop.
 * - Desktop: dark obsidian void with a cursor-following golden spotlight illuminating the phoenix concept art.
 * - Mobile (Android & iOS touch): preserves the same phoenix illumination with a smooth ambient/scroll sweep
 *   plus live touch-guided light response.
 */
export default function IlluminatedTileBackdrop() {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const isCoarseTouch = useSyncExternalStore(emptySubscribe, getIsCoarseTouch, () => false);
  const litLayerRef = useRef(null);
  const glowLayerRef = useRef(null);

  useEffect(() => {
    if (!mounted) return;
    const litEl = litLayerRef.current;
    const glowEl = glowLayerRef.current;
    if (!litEl || !glowEl) return;

    const prefersReducedMotion = Boolean(
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    );

    let { diameter, glowSize } = getSpotlightMetrics();
    let radius = diameter / 2;
    let glowRadius = glowSize / 2;

    const applySizing = () => {
      const next = getSpotlightMetrics();
      diameter = next.diameter;
      glowSize = next.glowSize;
      radius = diameter / 2;
      glowRadius = glowSize / 2;
      const maskSize = `${diameter}px ${diameter}px`;
      litEl.style.webkitMaskSize = maskSize;
      litEl.style.maskSize = maskSize;
      glowEl.style.width = `${glowSize}px`;
      glowEl.style.height = `${glowSize}px`;
    };
    applySizing();

    const applyPosition = (x, y) => {
      const rx = Math.round(x);
      const ry = Math.round(y);
      const pos = `${rx - radius}px ${ry - radius}px`;
      litEl.style.webkitMaskPosition = pos;
      litEl.style.maskPosition = pos;
      litEl.style.opacity = "1";

      glowEl.style.transform = `translate3d(${rx - glowRadius}px, ${ry - glowRadius}px, 0)`;
      glowEl.style.opacity = "1";
    };

    let rafId = null;
    let targetX = -9999;
    let targetY = -9999;
    let currentX = -9999;
    let currentY = -9999;
    let isInitialized = false;
    let touchOverrideUntil = 0;

    if (!isCoarseTouch) {
      // Desktop fine pointer: identical cursor-driven spotlight
      const updateMask = () => {
        rafId = null;
        if (document.body.getAttribute("data-menu-open") === "true") return;
        if (!isInitialized) {
          currentX = targetX;
          currentY = targetY;
          isInitialized = true;
        } else {
          currentX += (targetX - currentX) * 0.35;
          currentY += (targetY - currentY) * 0.35;
        }

        applyPosition(currentX, currentY);

        if (Math.abs(targetX - currentX) > 0.75 || Math.abs(targetY - currentY) > 0.75) {
          rafId = requestAnimationFrame(updateMask);
        }
      };

      const onPointerMove = (e) => {
        targetX = e.clientX;
        targetY = e.clientY;
        if (!rafId) {
          rafId = requestAnimationFrame(updateMask);
        }
      };

      const onPointerLeave = () => {
        litEl.style.opacity = "0";
        glowEl.style.opacity = "0";
        isInitialized = false;
      };

      const onResize = () => {
        applySizing();
        if (isInitialized) applyPosition(currentX, currentY);
      };

      window.addEventListener("pointermove", onPointerMove, { passive: true });
      document.addEventListener("mouseleave", onPointerLeave, { passive: true });
      window.addEventListener("resize", onResize, { passive: true });

      return () => {
        if (rafId) cancelAnimationFrame(rafId);
        window.removeEventListener("pointermove", onPointerMove);
        document.removeEventListener("mouseleave", onPointerLeave);
        window.removeEventListener("resize", onResize);
      };
    }

    // Touch devices (Android & iOS): immediate warm illumination + gentle ambient/scroll sweep & touch tracking
    currentX = window.innerWidth * 0.5;
    currentY = window.innerHeight * 0.5;
    targetX = currentX;
    targetY = currentY;
    isInitialized = true;
    applyPosition(currentX, currentY);

    if (prefersReducedMotion) {
      const onResizeStatic = () => {
        applySizing();
        applyPosition(window.innerWidth * 0.5, window.innerHeight * 0.5);
      };
      window.addEventListener("resize", onResizeStatic, { passive: true });
      return () => window.removeEventListener("resize", onResizeStatic);
    }

    let lastFrameTs = 0;
    const animateTouchSpotlight = (now) => {
      rafId = requestAnimationFrame(animateTouchSpotlight);
      if (document.hidden || document.body.getAttribute("data-menu-open") === "true") {
        return;
      }
      // Run smoothly at ~30fps on mobile to keep main thread crisp
      if (now - lastFrameTs < 32) return;
      lastFrameTs = now;

      const w = window.innerWidth;
      const h = window.innerHeight;
      if (now > touchOverrideUntil) {
        const t = now * 0.00055;
        const scrollShift = Math.sin(window.scrollY * 0.0035) * (h * 0.05);
        targetX = w * 0.5 + Math.sin(t) * (w * 0.16);
        targetY = h * 0.5 + Math.cos(t * 0.85) * (h * 0.06) + scrollShift;
      }

      currentX += (targetX - currentX) * 0.14;
      currentY += (targetY - currentY) * 0.14;
      applyPosition(currentX, currentY);
    };

    const handleTouchPoint = (x, y) => {
      targetX = x;
      targetY = y;
      touchOverrideUntil = performance.now() + 2600;
    };

    const onPointerDownOrMove = (e) => {
      if (typeof e.clientX === "number" && typeof e.clientY === "number") {
        handleTouchPoint(e.clientX, e.clientY);
      }
    };

    const onTouchMove = (e) => {
      const touch = e.touches?.[0];
      if (touch) {
        handleTouchPoint(touch.clientX, touch.clientY);
      }
    };

    const onResize = () => {
      applySizing();
    };

    window.addEventListener("pointerdown", onPointerDownOrMove, { passive: true });
    window.addEventListener("pointermove", onPointerDownOrMove, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    rafId = requestAnimationFrame(animateTouchSpotlight);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("pointerdown", onPointerDownOrMove);
      window.removeEventListener("pointermove", onPointerDownOrMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("resize", onResize);
    };
  }, [mounted, isCoarseTouch]);

  if (!mounted) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[1] overflow-hidden select-none bg-[#030201]"
      style={{ contain: "strict" }}
    >
      <style>{`
        .phoenix-poster-layer {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }
        .phoenix-portrait-vignette {
          display: none;
        }
        @media (max-width: 767px) and (orientation: portrait) {
          .phoenix-poster-layer {
            inset: auto;
            left: 50%;
            top: 50%;
            width: 100dvh;
            height: 100vw;
            background-size: contain;
            transform: translate(-50%, -50%) rotate(-90deg);
          }
          .phoenix-portrait-vignette {
            display: block;
            width: 100vw;
            height: min(100dvh, calc(100vw * 16 / 9));
          }
        }
      `}</style>

      {/* 1. Base Unlit Deep Black State (rotated -90deg on portrait mobile so full phoenix fills screen vertically) */}
      <div className="absolute inset-0 overflow-hidden" style={{ opacity: 0.01 }}>
        <div
          className="phoenix-poster-layer"
          style={{
            backgroundImage: CONCEPT_ART_BG,
            filter: "brightness(0.18) contrast(1.3) saturate(0.4)",
          }}
        />
      </div>

      {/* Atmospheric pure dark veil ensuring unlit areas stay deeply black */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(3, 2, 2, 0.92) 0%, rgba(2, 1, 1, 0.99) 100%)",
        }}
      />

      {/* 2. Illuminated Phoenix Concept Art Layer (unrotated mask wrapper so touch/pointer coords stay aligned) */}
      <div
        ref={litLayerRef}
        className="absolute inset-0 overflow-hidden transition-opacity duration-300"
        style={{
          opacity: 0,
          WebkitMaskImage: STATIC_MASK,
          maskImage: STATIC_MASK,
          WebkitMaskSize: "500px 500px",
          maskSize: "500px 500px",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "-9999px -9999px",
          maskPosition: "-9999px -9999px",
        }}
      >
        <div
          className="phoenix-poster-layer"
          style={{
            backgroundImage: CONCEPT_ART_BG,
            filter: "brightness(1.16) contrast(1.08) saturate(1.15)",
          }}
        />
      </div>

      {/* Soft top/bottom edge fade aligned to the rotated 16:9 poster on portrait mobile */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          className="phoenix-portrait-vignette"
          style={{
            background:
              "linear-gradient(to bottom, #030201 0%, rgba(3,2,1,0) 10%, rgba(3,2,1,0) 90%, #030201 100%)",
          }}
        />
      </div>

      {/* 3. Photonic Warm Light Aura */}
      <div
        ref={glowLayerRef}
        className="absolute left-0 top-0 h-[540px] w-[540px] rounded-full transition-opacity duration-300 pointer-events-none"
        style={{
          opacity: 0,
          willChange: "transform, opacity",
          transform: "translate3d(-9999px, -9999px, 0)",
          background:
            "radial-gradient(circle closest-side, rgba(255, 205, 85, 0.28) 0%, rgba(255, 155, 35, 0.16) 26%, rgba(225, 95, 15, 0.07) 55%, rgba(160, 45, 5, 0.015) 82%, transparent 100%)",
          mixBlendMode: "screen",
        }}
      />
    </div>
  );
}
