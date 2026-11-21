import { DHANAK_WORKSHOPS } from '@/lib/dhanakWorkshops';
import { DHANAK_EVENTS } from '@/lib/dhanakEvents';

const SITE_URL = 'https://dhanakiist.org';

export default function sitemap() {
  const now = new Date();

  const staticRoutes = [
    { path: '/', priority: 1.0, changeFrequency: 'daily' },
    { path: '/about', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/workshop', priority: 0.95, changeFrequency: 'daily' },
    { path: '/events', priority: 0.95, changeFrequency: 'daily' },
    { path: '/merch', priority: 0.7, changeFrequency: 'weekly' },
    { path: '/accommodation', priority: 0.75, changeFrequency: 'weekly' },
    { path: '/sponsors', priority: 0.65, changeFrequency: 'weekly' },
    { path: '/contact-us', priority: 0.75, changeFrequency: 'monthly' },
    { path: '/privacy-policy', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/terms-and-conditions', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/refund-policy', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/shipping-policy', priority: 0.5, changeFrequency: 'monthly' },
  ].map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const workshopRoutes = DHANAK_WORKSHOPS.map((w) => ({
    url: `${SITE_URL}/workshop/${w.id}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.85,
  }));

  const eventRoutes = DHANAK_EVENTS.map((ev) => ({
    url: `${SITE_URL}/events/${ev.id}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticRoutes, ...workshopRoutes, ...eventRoutes];
}
