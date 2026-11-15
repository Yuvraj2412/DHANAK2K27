"use client";

/**
 * TrialCursor — subtle ember trail. Small embers shed behind the cursor,
 * rise on heat, flicker, and cool from orange to dark red before fading.
 * The loop sleeps when nothing is alive.
 */

import { useEffect } from "react";

const MAX_EMBERS = 32;

export default function TrialCursor() {
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.style.cssText =
      "position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:99998;";
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d");

    let W = 0, H = 0;
    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W;
      canvas.height = H;
    };
    resize();
    window.addEventListener("resize", resize);

    const embers = [];
    let lx = null, ly = null, carry = 0;
    let raf = 0, running = false, last = 0;

    const spawn = (x, y, vx, vy) => {
      if (embers.length >= MAX_EMBERS) embers.shift();
      embers.push({
        x: x + (Math.random() - 0.5) * 4,
        y: y + (Math.random() - 0.5) * 4,
        vx: vx * 0.08 + (Math.random() - 0.5) * 20,
        vy: vy * 0.08 - 10 - Math.random() * 25,
        r: 0.6 + Math.random() * 1.3,
        life: 1,
        ttl: 0.5 + Math.random() * 0.7,
        seed: Math.random() * 100,
      });
    };

    const onMove = (e) => {
      const x = e.clientX, y = e.clientY;
      if (lx !== null) {
        const dx = x - lx, dy = y - ly;
        const dist = Math.hypot(dx, dy);
        carry += dist / 14; // one ember per ~14px travelled
        while (carry >= 1) {
          carry -= 1;
          spawn(x, y, dx * 30, dy * 30);
        }
      }
      lx = x;
      ly = y;
      if (!running && embers.length) {
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };

    const tick = (now) => {
      const dt = Math.min(0.04, (now - last) / 1000);
      last = now;
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";

      for (let i = embers.length - 1; i >= 0; i--) {
        const p = embers[i];
        p.life -= dt / p.ttl;
        if (p.life <= 0) { embers.splice(i, 1); continue; }
        p.vx += Math.sin(now * 0.004 + p.seed) * 18 * dt; // turbulence
        p.vy -= 30 * dt; // buoyancy
        p.vx *= Math.pow(0.3, dt);
        p.vy *= Math.pow(0.5, dt);
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        const t = p.life;
        const flick = 0.75 + 0.25 * Math.sin(now * 0.03 + p.seed * 7);
        const g = t > 0.5 ? 120 + 90 * (t - 0.5) * 2 : 40 + 80 * t * 2;
        const b = t > 0.6 ? 40 * (t - 0.6) * 2.5 : 0;
        const a = Math.min(1, t * 1.8) * flick;

        // glow
        ctx.fillStyle = `rgba(255,${(g * 0.6) | 0},10,${0.12 * a})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 4.5, 0, Math.PI * 2);
        ctx.fill();
        // core
        ctx.fillStyle = `rgba(255,${g | 0},${b | 0},${a})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.2, p.r * (0.5 + 0.5 * t)), 0, Math.PI * 2);
        ctx.fill();
      }

      if (embers.length) raf = requestAnimationFrame(tick);
      else { running = false; ctx.clearRect(0, 0, W, H); }
    };

    window.addEventListener("mousemove", onMove, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", resize);
      canvas.remove();
    };
  }, []);

  return null;
}
