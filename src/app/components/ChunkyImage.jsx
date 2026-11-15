'use client';

import { useState, useEffect, useRef } from 'react';
import {
  useNetworkSpeed,
  getAdaptiveImageUrl,
  getChunkyPlaceholderUrl,
  getDowngradedImageUrl,
  reportImageLoadSample,
} from '@/lib/networkSpeed';

// Session-level cache of successfully loaded image URLs
const loadedCache = new Set();

const WRAPPER_TOKEN_RE =
  /^(absolute|relative|fixed|sticky|block|inline-block|inset-.*|top-.*|right-.*|bottom-.*|left-.*|w-full|w-\[.*|h-full|h-\[.*|min-w-.*|min-h-.*|max-w-.*|max-h-.*|aspect-.*|rounded-.*|mx-auto|my-auto|shrink-.*|flex-1|z-\[?.*)$/;

function splitImageClasses(className = '') {
  const wrapperClasses = [];
  const imgClasses = [];

  for (const token of className.trim().split(/\s+/).filter(Boolean)) {
    // Strip positioning tokens from inner img if wrapper takes outer positioning
    if (token === 'absolute' || token.startsWith('inset-')) {
      wrapperClasses.push(token);
      continue;
    }
    if (WRAPPER_TOKEN_RE.test(token)) {
      wrapperClasses.push(token);
    }
    // Keep sizing/rounding/visual/hover/object tokens on the <img> element
    imgClasses.push(token);
  }

  const isAbsolute = /\babsolute\b/.test(className);
  const outerTokens = isAbsolute
    ? ['absolute', 'inset-0', 'w-full', 'h-full', ...wrapperClasses]
    : ['relative', ...wrapperClasses];

  return {
    isAbsolute,
    hasFixedBox: /\b(absolute|h-full)\b/.test(className) || /(^|\s)h-\[/.test(className),
    isContain: /\bobject-contain\b/.test(className),
    hasCustomTransition: /\btransition-(?!opacity\b)/.test(className),
    wrapperLayout: Array.from(new Set(outerTokens)).join(' '),
    imgLayout: Array.from(new Set(imgClasses)).join(' '),
  };
}

/**
 * ChunkyImage — Adaptive Progressive Image Loader
 *
 * Adapts image delivery cleanly to real connection speed:
 * - Fast (WiFi / 4G / 5G): loads ORIGINAL full-quality image directly with zero compression blur.
 * - Medium (3G): serves balanced /_next/image resolution at q=50.
 * - Slow (2G / Save-Data / stalled): shows lightweight chunky progressive preview + serves compact q=25.
 * - Container-faithful geometry: mirrors tile bounds (w-full, h-full, inset-0, rounded-*) cleanly so
 *   images never shift or offset inside cards/tiles.
 */
export default function ChunkyImage(props) {
  return <ChunkyImageInner key={props.src || 'empty'} {...props} />;
}

function ChunkyImageInner({
  src,
  alt = '',
  className = '',
  style = {},
  loading = 'lazy',
  priority = false,
  targetWidth = 1080,
  fallbackSrc,
  onLoad,
  onError,
  ...rest
}) {
  const { tier } = useNetworkSpeed();
  // Stage 0 = adaptive tier URL (original on fast), 1 = compact 640px q=25, 2 = raw src, 3 = fallbackSrc
  const [stageState, setStageState] = useState({ tier: null, stage: 0 });
  const stage = stageState.tier === tier ? stageState.stage : 0;
  const startTimeRef = useRef(0);

  const primaryUrl = getAdaptiveImageUrl(src, { width: targetWidth, tier });
  const lowBandwidthUrl = getDowngradedImageUrl(src, targetWidth);
  const resolvedUrl =
    stage === 0
      ? primaryUrl
      : stage === 1
      ? lowBandwidthUrl
      : stage === 2
      ? src
      : fallbackSrc || src;

  // Only show progressive low-res preview on genuinely slow (2G / Save-Data) links
  const showChunkyPreview = tier === 'slow';
  const placeholderUrl = showChunkyPreview ? getChunkyPlaceholderUrl(src) : null;

  const [loadedUrl, setLoadedUrl] = useState(() =>
    loadedCache.has(primaryUrl) ? primaryUrl : null
  );
  const isLoaded = loadedUrl === resolvedUrl || loadedCache.has(resolvedUrl);
  const imgRef = useRef(null);

  useEffect(() => {
    startTimeRef.current = typeof performance !== 'undefined' ? performance.now() : 0;
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      const syncTimer = setTimeout(() => {
        loadedCache.add(resolvedUrl);
        setLoadedUrl(resolvedUrl);
      }, 0);
      return () => clearTimeout(syncTimer);
    }
  }, [resolvedUrl]);

  const handleLoad = (e) => {
    if (startTimeRef.current && typeof performance !== 'undefined') {
      reportImageLoadSample({ durationMs: performance.now() - startTimeRef.current });
    }
    loadedCache.add(resolvedUrl);
    setLoadedUrl(resolvedUrl);
    if (onLoad) onLoad(e);
  };

  const handleError = (e) => {
    reportImageLoadSample({ failed: true });
    if (stage === 0 && lowBandwidthUrl && lowBandwidthUrl !== primaryUrl) {
      setStageState({ tier, stage: 1 });
      return;
    }
    if (stage < 2 && resolvedUrl !== src) {
      setStageState({ tier, stage: 2 });
      return;
    }
    if (stage < 3 && fallbackSrc && resolvedUrl !== fallbackSrc) {
      setStageState({ tier, stage: 3 });
      return;
    }
    if (onError) onError(e);
  };

  const {
    isAbsolute,
    hasFixedBox,
    isContain,
    hasCustomTransition,
    wrapperLayout,
    imgLayout,
  } = splitImageClasses(className);

  const innerFillClass = isAbsolute || hasFixedBox ? 'block w-full h-full' : 'block';

  return (
    <div
      className={`${wrapperLayout} overflow-hidden`.trim()}
      style={style}
    >
      {/* ── Progressive Preview Placeholder (2G / Save-Data networks only) ── */}
      {!isLoaded && placeholderUrl && (
        <img
          src={placeholderUrl}
          alt=""
          aria-hidden="true"
          loading={priority ? 'eager' : loading}
          decoding="async"
          className={`pointer-events-none select-none absolute inset-0 w-full h-full ${
            isContain ? 'object-contain' : 'object-cover'
          } object-center filter blur-[2px]`}
          style={{
            transition: 'opacity 0.3s ease-out',
            opacity: isLoaded ? 0 : 0.85,
          }}
        />
      )}

      {/* ── Subtle Ambient Loading Pulse while fetching ── */}
      {!isLoaded && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent animate-pulse"
        />
      )}

      {/* ── Adaptive Target Image (Original quality on fast connections) ── */}
      <img
        ref={imgRef}
        src={resolvedUrl}
        alt={alt}
        loading={priority ? 'eager' : loading}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={`${innerFillClass} ${imgLayout} ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`.trim()}
        style={
          hasCustomTransition
            ? { transitionProperty: 'opacity, transform, filter' }
            : { transition: 'opacity 0.35s ease-out' }
        }
        {...rest}
      />
    </div>
  );
}

// Export AdaptiveImage alias
export { ChunkyImage as AdaptiveImage };
