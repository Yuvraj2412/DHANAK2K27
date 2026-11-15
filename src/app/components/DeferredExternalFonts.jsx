'use client';

import { useEffect } from 'react';

const EXTERNAL_FONT_STYLESHEETS = [
  'https://fonts.cdnfonts.com/css/black-mustang',
  'https://fonts.cdnfonts.com/css/bad-coma',
  'https://fonts.googleapis.com/css2?family=Rubik+Glitch&display=swap',
  'https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&family=Cinzel:wght@600;700;800&family=Google+Sans:wght@400;500;700&display=swap',
];

/**
 * Loads third-party display font stylesheets asynchronously after hydration so
 * slow or blocked font CDNs (common on campus Wi-Fi / mobile carriers) never
 * delay first paint on iOS or Android.
 */
export default function DeferredExternalFonts() {
  useEffect(() => {
    for (const href of EXTERNAL_FONT_STYLESHEETS) {
      if (document.querySelector(`link[data-deferred-font="${href}"]`)) continue;
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.dataset.deferredFont = href;
      document.head.appendChild(link);
    }
  }, []);

  return null;
}

