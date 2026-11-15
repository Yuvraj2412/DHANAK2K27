'use client';

import { useState, useSyncExternalStore } from 'react';
import ChunkyImage from './ChunkyImage';

const emptySubscribe = () => () => {};
const checkWebmSupport = () => {
  const vid = document.createElement('video');
  return Boolean(vid.canPlayType && vid.canPlayType('video/webm') !== '');
};

/**
 * Plays WebM theme reveal videos on browsers that support VP8/VP9 and
 * cleanly falls back to the high-res Phoenix concept poster on iOS Safari
 * variants where WebM decoding is unavailable.
 */
export default function ThemeVideoPlayer({
  src = '/intro.webm',
  poster = '/assets/phoenix-concept-art.jpg',
  alt = 'Dhanak Theme Artwork',
}) {
  const canPlayWebm = useSyncExternalStore(emptySubscribe, checkWebmSupport, () => true);
  const [videoErrored, setVideoErrored] = useState(false);

  if (!canPlayWebm || videoErrored) {
    return (
      <div className="relative w-full h-full">
        <ChunkyImage
          src={poster}
          alt={alt}
          targetWidth={1080}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <video
      controls
      playsInline
      preload="metadata"
      poster={poster}
      onError={() => setVideoErrored(true)}
      className="w-full h-full object-cover"
    >
      <source src={src} type="video/webm" />
      Your browser does not support HTML5 video playback.
    </video>
  );
}

