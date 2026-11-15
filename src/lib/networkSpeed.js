'use client';

import { useSyncExternalStore } from 'react';

/**
 * Network Speed & Adaptive Image Loading System
 *
 * Detects real-world network connection speed and data-saver preference via
 * the Network Information API (navigator.connection) plus bidirectional
 * transfer-timing feedback (for iOS Safari / Firefox and congested Wi-Fi):
 *  - 'slow':   2G, slow-2g, Save-Data enabled, or sustained stalls (< 0.75 Mbps)
 *  - 'medium': 3G or sustained moderate stalls -> compressed adaptive fallback
 *  - 'fast':   4G/5G, Broadband, WiFi -> delivers ORIGINAL full-resolution image
 */

let currentTier = 'fast';
let measuredOverride = null; // { tier, expiresAt }
let stallStreak = 0;
let fastStreak = 0;
const listeners = new Set();

const TIER_RANK = { slow: 0, medium: 1, fast: 2 };
const STORAGE_KEY = 'dhanak_net_tier_v4';
const OVERRIDE_TTL_MS = 45 * 1000;

function persistOverride(next) {
  measuredOverride = next;
  try {
    if (next) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Ignore private mode / storage quota restrictions
  }
}

function hydrateMeasuredOverride() {
  try {
    sessionStorage.removeItem('dhanak_net_tier_v1');
    sessionStorage.removeItem('dhanak_net_tier_v2');
    sessionStorage.removeItem('dhanak_net_tier_v3');
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.expiresAt > Date.now() && parsed.tier in TIER_RANK) {
      measuredOverride = parsed;
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Ignore storage read errors
  }
}

function detectNavigationSlowHint() {
  if (typeof performance === 'undefined' || !performance.getEntriesByType) return null;
  const nav = performance.getEntriesByType('navigation')[0];
  if (!nav || !nav.responseStart) return null;
  // Only flag genuinely severe transfer delays so iOS Safari streaming SSR doesn't downgrade fast Wi-Fi/5G
  const bodyDownloadMs = nav.responseEnd - nav.responseStart;
  if (bodyDownloadMs > 8500) return 'slow';
  if (bodyDownloadMs > 5500) return 'medium';
  return null;
}

function detectNetworkTier() {
  if (typeof window === 'undefined') return 'fast';

  let apiTier = 'fast';
  const conn =
    navigator.connection ||
    navigator.mozConnection ||
    navigator.webkitConnection;

  if (conn) {
    if (conn.saveData) {
      return 'slow';
    }

    const effectiveType = conn.effectiveType;
    if (effectiveType === 'slow-2g' || effectiveType === '2g') {
      apiTier = 'slow';
    } else if (effectiveType === '3g') {
      apiTier = 'medium';
    } else if (effectiveType === '4g') {
      // Android Chrome reports '4g' for 4G/5G/Wi-Fi and often estimates conservative
      // downlink (1.2-3.4 Mbps). Only downgrade '4g' if link is genuinely choked.
      if (typeof conn.downlink === 'number' && conn.downlink > 0 && conn.downlink < 0.75) {
        apiTier = 'medium';
      }
    } else if (typeof conn.downlink === 'number' && conn.downlink > 0) {
      if (conn.downlink < 0.75) apiTier = 'slow';
      else if (conn.downlink < 1.5) apiTier = 'medium';
    }

    if (typeof conn.rtt === 'number' && conn.rtt > 950) {
      apiTier = 'slow';
    } else if (typeof conn.rtt === 'number' && conn.rtt > 650 && apiTier === 'fast') {
      apiTier = 'medium';
    }
  } else {
    const navHint = detectNavigationSlowHint();
    if (navHint) apiTier = navHint;
  }

  if (measuredOverride && measuredOverride.expiresAt > Date.now()) {
    if (TIER_RANK[measuredOverride.tier] < TIER_RANK[apiTier]) {
      return measuredOverride.tier;
    }
  } else if (measuredOverride) {
    persistOverride(null);
  }

  return apiTier;
}

function updateTier() {
  const nextTier = detectNetworkTier();
  if (nextTier !== currentTier) {
    currentTier = nextTier;
    for (const fn of listeners) {
      fn(currentTier);
    }
  }
}

/**
 * Feeds real image transfer timing back into the tier detector bidirectionally:
 * steps down smoothly during genuine stalls/failures on iOS Safari or congested Wi-Fi,
 * and upgrades cleanly back to 'fast' (original quality) once rapid transfers resume.
 */
export function reportImageLoadSample({ durationMs = 0, stalled = false, failed = false } = {}) {
  if (typeof window === 'undefined') return;

  if (failed || stalled || durationMs > 7000) {
    fastStreak = 0;
    stallStreak += 1;
    // Require repeated genuine slowdowns or failures before downgrading the session tier
    if (stallStreak >= 3 || durationMs > 9500) {
      const nextTier = stallStreak >= 4 || durationMs > 11000 ? 'slow' : 'medium';
      const now = Date.now();
      if (
        !measuredOverride ||
        measuredOverride.expiresAt <= now ||
        TIER_RANK[nextTier] < TIER_RANK[measuredOverride.tier]
      ) {
        persistOverride({ tier: nextTier, expiresAt: now + OVERRIDE_TTL_MS });
        updateTier();
      }
    }
    return;
  }

  if (durationMs > 0 && durationMs < 2000) {
    stallStreak = 0;
    fastStreak += 1;
    if (fastStreak >= 2 && measuredOverride) {
      persistOverride(null);
      updateTier();
    }
  } else if (durationMs >= 2000 && durationMs <= 7000) {
    fastStreak = 0;
  }
}

if (typeof window !== 'undefined') {
  hydrateMeasuredOverride();
  currentTier = detectNetworkTier();
  const conn =
    navigator.connection ||
    navigator.mozConnection ||
    navigator.webkitConnection;

  if (conn && typeof conn.addEventListener === 'function') {
    conn.addEventListener('change', () => {
      stallStreak = 0;
      fastStreak = 0;
      persistOverride(null);
      updateTier();
    });
  }
}

export function getNetworkSpeedTier() {
  if (typeof window === 'undefined') return 'fast';
  return currentTier;
}

export function subscribeNetworkSpeed(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/**
 * React hook that returns current network tier and details.
 */
export function useNetworkSpeed() {
  const tier = useSyncExternalStore(
    subscribeNetworkSpeed,
    getNetworkSpeedTier,
    () => 'fast'
  );

  return {
    tier,
    isSlow: tier === 'slow',
    isMedium: tier === 'medium',
    isFast: tier === 'fast',
  };
}

// Next.js allowed device & image sizes:
// [32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840]
const VALID_WIDTHS = [32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920];

function snapToValidWidth(w) {
  if (!w) return 1080;
  for (const size of VALID_WIDTHS) {
    if (size >= w) return size;
  }
  return 1920;
}

/**
 * Returns an image URL adapted to the user's internet speed:
 * - 'fast'   -> original src untouched (full original resolution & quality)
 * - 'medium' -> compressed 3G-friendly variant (q=50, up to 1080px)
 * - 'slow'   -> compact 2G/Save-Data variant (q=25, up to 640px)
 */
export function getAdaptiveImageUrl(src, { width = 1080, tier = currentTier } = {}) {
  if (!src || typeof src !== 'string') return src;

  if (src.endsWith('.svg') || src.startsWith('data:') || src.startsWith('blob:')) {
    return src;
  }

  if (tier === 'fast') {
    return src;
  }

  if (tier === 'slow') {
    const targetWidth = snapToValidWidth(Math.min(width, 640));
    return `/_next/image?url=${encodeURIComponent(src)}&w=${targetWidth}&q=50`;
  }

  // Medium (3G): balanced clarity without excessive payload
  const targetWidth = snapToValidWidth(Math.min(Math.max(width, 828), 1080));
  return `/_next/image?url=${encodeURIComponent(src)}&w=${targetWidth}&q=75`;
}

/**
 * Returns a compact optimized fallback URL (~6-15 KB) used when a higher-res
 * request stalls or fails on weak mobile connections.
 */
export function getDowngradedImageUrl(src, width = 640) {
  if (!src || typeof src !== 'string') return src;
  if (src.endsWith('.svg') || src.startsWith('data:') || src.startsWith('blob:')) {
    return src;
  }
  const targetWidth = snapToValidWidth(Math.min(width, 640));
  return `/_next/image?url=${encodeURIComponent(src)}&w=${targetWidth}&q=50`;
}

/**
 * Returns a micro-resolution URL for immediate progressive loading on
 * genuinely slow 2G/Save-Data connections.
 */
export function getChunkyPlaceholderUrl(src) {
  if (!src || typeof src !== 'string') return src;
  if (src.endsWith('.svg') || src.startsWith('data:') || src.startsWith('blob:')) {
    return src;
  }
  return `/_next/image?url=${encodeURIComponent(src)}&w=64&q=25`;
}
