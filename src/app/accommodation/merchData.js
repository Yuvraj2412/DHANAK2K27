import { getTicketId, getTicketCost } from '@/lib/ticketStore';

const SIZES = ['S', 'M', 'L', 'XL', '2XL'];

export const MERCH_ITEMS = [
  {
    id: 'merch-tshirt',
    title: 'ISRO Mission Man on Moon 2040 Hoodie',
    subtitle: 'Official Dhanak 2027 × ISRO Zip Hoodie · PSLV & Est. 1969 Sleeve Patches',
    expectedArrival: 'Expected Arrival: 3-5 days before festival kickoff',
    imageFront: '/merch/isro-hoodie-front.jpg',
    imageBack: '/merch/isro-hoodie-back.jpg',
    imageShowcase: '/merch/isro-hoodie-showcase.jpg',
    sizes: SIZES,
    accentColor: '#FF6B00',
  },
];

export const MERCH_REVEAL_VIDEO = '';

export const STAY_DATES = [
  { id: '2027-03-18', label: 'Day 0' },
  { id: '2027-03-19', label: 'Day 1' },
  { id: '2027-03-20', label: 'Day 2' },
  { id: '2027-03-21', label: 'Day 3' },
];

export const FOOD_ADDONS = [
  {
    id: 'breakfast',
    label: 'Breakfast',
    description: 'Continental breakfast, served daily at fest mess.',
    dates: ['2027-03-18', '2027-03-19', '2027-03-20', '2027-03-21'],
  },
  {
    id: 'lunch',
    label: 'Lunch',
    description: 'Full-course lunch, served daily.',
    dates: ['2027-03-18', '2027-03-19', '2027-03-20', '2027-03-21'],
  },
  {
    id: 'dinner',
    label: 'Dinner',
    description: 'Evening dinner, served daily.',
    dates: ['2027-03-18', '2027-03-19', '2027-03-20', '2027-03-21'],
  },
];

export async function ticketFor(kind) {
  return getTicketId(kind);
}

export async function priceFor(kind) {
  return getTicketCost(kind);
}
