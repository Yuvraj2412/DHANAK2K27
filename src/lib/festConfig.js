/**
 * festConfig.js — SINGLE SOURCE OF TRUTH for Dhanak 2027
 *
 * Change values here to update branding across the entire website.
 * No need to hunt through 50 files.
 */

export const FEST_NAME = 'Dhanak';
export const FEST_YEAR = '2027';
export const FEST_FULL_NAME = 'Dhanak 2027';
export const FEST_TAGLINE = 'Embers from Ashes';
export const FEST_SUBTITLE = 'The Annual Cultural Festival of IIST';
export const FEST_INSTITUTE = 'Indian Institute of Space Science and Technology';
export const FEST_INSTITUTE_SHORT = 'IIST';
export const FEST_LOCATION = 'Valiamala, Thiruvananthapuram, Kerala';

/** Set to true once theme & dates are officially revealed */
export const THEME_REVEALED = false;

/** Approximate dates – set actual when confirmed */
export const FEST_DATE_DISPLAY = 'Coming Soon · 2027';
export const FEST_DATES = null; // { start: '2027-02-20', end: '2027-02-22' }

/** Attendee ID prefix — previously CNS- for Conscientia */
export const ATTENDEE_ID_PREFIX = 'DHN';

/** Social links */
export const SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/dhanak.iist?exln=YTFpbmd0a3MxcWF2',
  linkedin:  'https://www.linkedin.com/in/dhanak-iist-b2ba83bb?utm_source=share_via&utm_content=profile&utm_medium=member_android',
  youtube:   'https://youtube.com/@dhanakiist?si=GP4HH6EEQnmvVLbO',
};

/** Contact */
export const CONTACT_EMAIL = 'TBD';

/** Brand colors as JS constants (mirrors the CSS vars) */
export const BRAND = {
  bg:       '#0C0A09',  // deep obsidian / charcoal
  bg2:      '#161210',  // slightly lighter ash
  ember:    '#FF4500',  // core ember orange
  emberHot: '#FF8C00',  // bright ember
  gold:     '#FFB800',  // molten gold
  crimson:  '#DC143C',  // deep crimson / red ember
  ash:      '#3D3530',  // cool ash grey
  white:    '#F5F0EB',  // warm off-white
};

/** Nav links for Dhanak */
export const NAV_LINKS = [
  { label: 'HOME',          path: '/' },
  { label: 'ABOUT',         path: '/about' },
  { label: 'WORKSHOPS',     path: '/workshop' },
  { label: 'EVENTS',        path: '/events' },
  { label: 'PRONITES',      path: '/pronites' },
  { label: 'MERCH',         path: '/merch' },
  { label: 'ACCOMMODATION', path: '/accommodation' },
  { label: 'SPONSORS',      path: '/sponsors' },
  { label: 'CONTACT US',    path: '/contact-us' },
];

/** Main festival days (Flagship Main Events) */
export const FESTIVAL_DAYS = [
  {
    day: 0,
    id: 'group-dance',
    label: 'Main Event · Day 0',
    headline: 'Group Dance',
    description: 'An electrifying evening where rhythm meets passion. Dance crews from across the nation set the Open Air Theatre ablaze.',
    status: 'live',
    color: '#FF4500',
    href: '/events/group-dance',
    image: '/assets/events/group-dance.jpg',
  },
  {
    day: 1,
    id: 'battle-of-bands',
    label: 'Main Event · Day 1',
    headline: 'Battle of Bands',
    description: 'Feel the earth shake as bands clash in the ultimate musical showdown. Rock, metal, indie, and fusion on the main stage.',
    status: 'live',
    color: '#FF8C00',
    href: '/events/battle-of-bands',
    image: '/assets/events/battle-of-bands.jpg',
  },
  {
    day: 2,
    id: 'fashion-show',
    label: 'Main Event · Day 2',
    headline: 'Fashion Show',
    description: 'Creativity ignites the runway. Witness avant-garde couture, bold choreography, and stunning performances in a spectacle of style.',
    status: 'live',
    color: '#FFB800',
    href: '/events/fashion-show',
    image: '/assets/events/fashion-show.jpg',
  },
];

