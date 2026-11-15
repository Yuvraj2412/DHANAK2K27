"use client";

/**
 * LavaEruption — Ultra-fast, zero-lag molten lava splash.
 *
 * Optimizations:
 * - NO expensive canvas shadowBlur (avoids CPU Gaussian blur freezes)
 * - NO synchronous DOM style mutations during route navigation
 * - Hardware-accelerated 2D canvas with direct radial fills
 * - 16 lightweight sparks with ballistic arcs & thermal blackbody cooling
 */

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function LavaEruption() {
  const pathname = usePathname();
  const isHiddenRoute = pathname?.startsWith("/payment") || pathname?.startsWith("/admin");
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const runningRef = useRef(false);
  const rafRef = useRef(0);

  useEffect(() => {
    if (isHiddenRoute) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const canvas = document.createElement("canvas");
    canvas.style.cssText = `
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 999996;
      mix-blend-mode: screen;
    `;
    document.body.appendChild(canvas);
    canvasRef.current = canvas;
    const ctx = canvas.getContext("2d", { alpha: true });

    let W = window.innerWidth;
    let H = window.innerHeight;

    const resize = () => {
      // Cap DPR to 1.5 to prevent massive 4K fill-rate stalls on high-DPI screens
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });

    const spawnSparks = (x, y) => {
      if (document.body.getAttribute('data-menu-open') === 'true') return;
      const count = 5 + Math.floor(Math.random() * 3);
      const particles = particlesRef.current;

      // Cap max particles to prevent any build-up
      if (particles.length > 15) {
        particles.splice(0, particles.length - 8);
      }

      for (let i = 0; i < count; i++) {
        const isBig = i < 2;
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * (Math.PI * 1.5);
        const speed = isBig ? 130 + Math.random() * 120 : 190 + Math.random() * 180;

        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          r: isBig ? 3.0 + Math.random() * 2.0 : 1.4 + Math.random() * 1.2,
          life: 1.0,
          ttl: isBig ? 0.45 + Math.random() * 0.25 : 0.35 + Math.random() * 0.2,
          isBig,
        });
      }

      if (!runningRef.current) {
        runningRef.current = true;
        lastTime = performance.now();
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    let lastTime = 0;

    const tick = (now) => {
      const dt = Math.min(0.033, (now - lastTime) / 1000);
      lastTime = now;

      ctx.clearRect(0, 0, W, H);
      const particles = particlesRef.current;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= dt / p.ttl;

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        // Ballistics: Gravity + slight drag
        p.vy += 580 * dt;
        p.vx *= Math.pow(0.92, dt * 60);
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        const progress = Math.max(0, p.life);
        const curR = p.r * (0.4 + 0.6 * progress);

        // Blazing blackbody colors: White-Hot -> Lava Orange -> Ruby Magma
        let r, g, b;
        if (progress > 0.65) {
          r = 255;
          g = Math.round(210 + 45 * ((progress - 0.65) / 0.35));
          b = Math.round(120 * ((progress - 0.65) / 0.35));
        } else if (progress > 0.3) {
          const t = (progress - 0.3) / 0.35;
          r = 255;
          g = Math.round(70 + 130 * t);
          b = 10;
        } else {
          const t = progress / 0.3;
          r = Math.round(180 + 75 * t);
          g = Math.round(20 + 40 * t);
          b = 5;
        }

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${progress * 0.95})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, curR, 0, Math.PI * 2);
        ctx.fill();

        // Soft outer glow without software Gaussian blur
        if (p.isBig && progress > 0.35) {
          ctx.fillStyle = `rgba(255, 100, 0, ${progress * 0.22})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, curR * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (particles.length > 0) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        runningRef.current = false;
        ctx.clearRect(0, 0, W, H);
      }
    };

    const handlePointerDown = (e) => {
      const target = e.target;
      if (!target) return;

      const btn = target.closest(
        'button, [role="button"], input[type="submit"], input[type="button"], .card-dhanak'
      );
      if (!btn || btn.closest("[data-no-lava]")) return;

      // Trigger lightweight sparks asynchronously without blocking DOM or touch/navigation events
      spawnSparks(e.clientX, e.clientY);
    };

    window.addEventListener("pointerdown", handlePointerDown, { passive: true });

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointerdown", handlePointerDown);
      canvas.remove();
    };
  }, [isHiddenRoute]);

  return null;
}
