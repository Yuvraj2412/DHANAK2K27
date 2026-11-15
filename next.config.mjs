import os from 'node:os';

function getAllowedDevOrigins() {
  const origins = new Set([
    'localhost',
    '127.0.0.1',
    '*.local',
    '10.**',
    '172.**',
    '192.168.**',
  ]);
  for (const ifaces of Object.values(os.networkInterfaces())) {
    for (const iface of ifaces || []) {
      if (iface.family === 'IPv4' && !iface.internal && iface.address) {
        origins.add(iface.address);
      }
    }
  }
  return Array.from(origins);
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Off because @supabase/gotrue-js's cross-tab auth lock doesn't tolerate
  // Strict Mode's double-invoked effects in dev: the abandoned first
  // invocation holds the lock, every other Supabase call then stalls ~5s
  // waiting on it and force-recovers into an inconsistent state, which
  // shows up as random sign-outs while navigating. Doesn't affect prod
  // (Strict Mode's double-invoke is dev-only regardless of this flag).
  reactStrictMode: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    qualities: [25, 50, 75, 100],
    minimumCacheTTL: 86400,
    // Admins can set workshop/event image links to arbitrary external URLs
    // from /admin's Catalog tab, so next/image needs to accept any host.
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
  allowedDevOrigins: getAllowedDevOrigins(),
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(), geolocation=(), payment=(self "https://checkout.razorpay.com" "https://api.razorpay.com")',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
