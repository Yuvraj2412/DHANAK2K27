"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import TrialCursor from "./TrialCursor";
import IlluminatedTileBackdrop from "./IlluminatedTileBackdrop";

function SelectionGradientHighlight() {
  const [rects, setRects] = useState([]);

  useEffect(() => {
    let rafId = null;

    const updateSelectionRects = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const sel = window.getSelection?.();
        if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
          setRects((prev) => (prev.length ? [] : prev));
          return;
        }
        const nextRects = [];
        for (let i = 0; i < sel.rangeCount; i++) {
          const range = sel.getRangeAt(i);
          const clientRects = range.getClientRects();
          for (let j = 0; j < clientRects.length; j++) {
            const r = clientRects[j];
            if (r.width > 1 && r.height > 1) {
              nextRects.push({
                top: r.top,
                left: r.left,
                width: r.width,
                height: r.height,
              });
            }
          }
        }
        setRects(nextRects.slice(0, 60));
      });
    };

    document.addEventListener("selectionchange", updateSelectionRects, { passive: true });
    window.addEventListener("scroll", updateSelectionRects, { passive: true, capture: true });
    window.addEventListener("resize", updateSelectionRects, { passive: true });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      document.removeEventListener("selectionchange", updateSelectionRects);
      window.removeEventListener("scroll", updateSelectionRects, { capture: true });
      window.removeEventListener("resize", updateSelectionRects);
    };
  }, []);

  if (rects.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 9998,
        overflow: "hidden",
      }}
    >
      {rects.map((r, i) => (
        <div
          key={i}
          style={{
            position: "fixed",
            top: `${r.top}px`,
            left: `${r.left}px`,
            width: `${r.width}px`,
            height: `${r.height}px`,
            background:
              "linear-gradient(90deg, rgba(255, 69, 0, 0.32) 0%, rgba(255, 145, 0, 0.34) 50%, rgba(255, 224, 51, 0.36) 100%)",
            boxShadow: "0 0 10px rgba(255, 165, 0, 0.25)",
            borderRadius: "3px",
            mixBlendMode: "screen",
          }}
        />
      ))}
    </div>
  );
}

export default function CursorTrialWrapper() {
  const pathname = usePathname();
  const [isTouch, setIsTouch] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    setIsTouch("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  if (!mounted) return null;

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  if (pathname?.startsWith("/payment")) {
    return <SelectionGradientHighlight />;
  }

  return (
    <>
      <SelectionGradientHighlight />
      <IlluminatedTileBackdrop />
      {!isTouch && <TrialCursor />}
    </>
  );
}
