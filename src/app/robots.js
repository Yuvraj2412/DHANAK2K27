const SITE_URL = 'https://dhanakiist.org';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/foodfestadmin',
          '/api/',
          '/data',
          '/cart',
          '/payment',
          '/payment-success',
          '/payment-failure',
          '/payment-failed',
          '/profile',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
