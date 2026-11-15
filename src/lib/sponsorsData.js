/**
 * Official Festival Sponsors & Partners Catalog
 *
 * Add partners/sponsors below when confirmed.
 * When this array is empty, the website gracefully shows a "Partner With Us /
 * Slots Open" invitation state so the layout looks intentional and ready for sponsors.
 */
export const SPONSORS_DATA = [
  // Future sponsors can be added here like:
  // {
  //   id: 'sample-sponsor',
  //   name: 'Sponsor Name',
  //   tier: 'Title Partner', // 'Title Partner' | 'Powered By' | 'Associate Partner' | 'Media Partner'
  //   logo: '/assets/sponsors/sample.png',
  //   website: 'https://example.com',
  //   description: 'Official partner of Dhanak 2026',
  // },
];

export const SPONSOR_TIERS = [
  {
    id: 'title',
    name: 'Title Partner',
    tierLabel: 'Title Partner',
    accentColor: '#FFB300',
    glowColor: 'rgba(255, 179, 0, 0.35)',
    badge: '👑 Tier 1',
    description: 'Headline festival co-branding, mainstage spotlight, and nationwide campaign presence.',
    perks: ['Main Stage Naming Rights', 'Keynote Address Opportunity', 'Frontpage Logo Placement'],
  },
  {
    id: 'powered-by',
    name: 'Powered By',
    tierLabel: 'Powered By Partner',
    accentColor: '#FF7043',
    glowColor: 'rgba(255, 112, 67, 0.35)',
    badge: '⚡ Tier 2',
    description: 'Premier hackathon & workshop branding, live product demos, and campus booth activations.',
    perks: ['Hackathon & Track Sponsorship', 'Booth Space in Central Arena', 'Direct Resume Database Access'],
  },
  {
    id: 'associate',
    name: 'Associate Partners',
    tierLabel: 'Associate Partner',
    accentColor: '#FFA726',
    glowColor: 'rgba(255, 167, 38, 0.35)',
    badge: '🤝 Tier 3',
    description: 'Flagship competition prizes, student interaction sessions, and merchandise branding.',
    perks: ['Competition Category Co-Host', 'Festival Kit Inclusion', 'Digital Outreach to 10k+ Students'],
  },
  {
    id: 'ecosystem',
    name: 'Media & Innovation Partners',
    tierLabel: 'Media & Community',
    accentColor: '#FFCA28',
    glowColor: 'rgba(255, 202, 40, 0.35)',
    badge: '🌐 Ecosystem',
    description: 'Digital press distribution, live streaming coverage, and community newsletter blasts.',
    perks: ['Press Release Attribution', 'Social Media Cross-Promotion', 'Exclusive Interview Slots'],
  },
];

