"use client";

import Image from "next/image";

/**
 * Dhanak 2026 Loading State
 * Renders the majestic Dhanak Phoenix flapping its wings inside a glowing molten aura.
 */
export default function LoadingState({
  label = "Igniting Fest",
  accentColor = "#FF6B00",
  inline = false,
}) {
  return (
    <div
      style={{
        position: inline ? "relative" : "fixed",
        inset: inline ? undefined : 0,
        zIndex: inline ? undefined : 200,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.75rem",
        minHeight: inline ? "40vh" : undefined,
        width: "100%",
        background: inline ? "transparent" : "rgba(8, 6, 5, 0.88)",
        backdropFilter: inline ? undefined : "blur(14px)",
        WebkitBackdropFilter: inline ? undefined : "blur(14px)",
        animation: "phoenixLoadingFadeIn 0.25s ease-out",
        userSelect: "none",
      }}
    >
      {/* 3D Flapping Phoenix Emblem Container */}
      <div
        style={{
          position: "relative",
          width: "110px",
          height: "110px",
          perspective: 800,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Pulsing Molten Aura */}
        <div
          style={{
            position: "absolute",
            inset: -8,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(255, 69, 0, 0.45) 0%, rgba(255, 184, 0, 0.15) 55%, transparent 75%)",
            animation: "phoenixAuraPulse 1.8s ease-in-out infinite alternate",
            pointerEvents: "none",
          }}
        />

        {/* Outer Golden Medallion Ring */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "1.5px solid rgba(255, 184, 0, 0.5)",
            boxShadow:
              "0 0 25px rgba(255, 69, 0, 0.5), inset 0 0 15px rgba(255, 184, 0, 0.25)",
            animation: "phoenixRingRotate 18s linear infinite",
          }}
        />

        {/* Official Dhanak Emblem Layer */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            transformStyle: "preserve-3d",
            animation: "phoenixBodySway 2.2s ease-in-out infinite alternate",
          }}
        >
          <Image
            src="/assets/dhanak-logo.png"
            alt="Official Dhanak Logo"
            width={120}
            height={120}
            sizes="120px"
            priority
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              filter: "drop-shadow(0 0 16px rgba(255, 107, 0, 0.85)) drop-shadow(0 0 32px rgba(255, 60, 0, 0.45))",
            }}
          />
        </div>
      </div>

      {/* Label in Cinzel royal typography with molten heat shimmer */}
      <div style={{ textAlign: "center" }}>
        <p
          className="brand-text-gold"
          style={{
            fontSize: "clamp(0.95rem, 2.5vw, 1.15rem)",
            fontWeight: 800,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            marginBottom: "0.25rem",
          }}
        >
          {label}
          <span className="loading-dots" />
        </p>
        <p
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: "0.65rem",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "rgba(255, 180, 0, 0.55)",
          }}
        >
          Dhanak 2027 · IIST
        </p>
      </div>

      <style>{`
        @keyframes phoenixLoadingFadeIn {
          from { opacity: 0; transform: scale(0.97); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes phoenixAuraPulse {
          0%   { transform: scale(0.92); opacity: 0.6; }
          100% { transform: scale(1.15); opacity: 0.95; }
        }
        @keyframes phoenixRingRotate {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes phoenixBodySway {
          0%   { transform: translateZ(8px) translateY(0px) rotateZ(-1deg); }
          100% { transform: translateZ(14px) translateY(-4px) rotateZ(1.5deg); }
        }
        @keyframes phoenixWingFlap {
          0% {
            transform: translateZ(26px) rotateY(-28deg) rotateZ(-12deg) scaleX(0.92);
          }
          50% {
            transform: translateZ(36px) rotateY(32deg) rotateZ(16deg) scaleX(1.08);
          }
          100% {
            transform: translateZ(26px) rotateY(-28deg) rotateZ(-12deg) scaleX(0.92);
          }
        }
        .loading-dots::after {
          display: inline-block;
          width: 1.4em;
          text-align: left;
          content: "";
          animation: loadingDotsText 1.2s steps(4, end) infinite;
        }
        @keyframes loadingDotsText {
          0%   { content: ""; }
          25%  { content: "."; }
          50%  { content: ".."; }
          75%  { content: "..."; }
          100% { content: ""; }
        }
      `}</style>
    </div>
  );
}
