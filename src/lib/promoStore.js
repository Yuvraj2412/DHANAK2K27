import { supabase, isSupabaseConfigured } from './supabaseClient';

export const DEFAULT_PROMOS = {
  limited_drop: {
    badge_label: 'Limited drop',
    heading: 'Gear up for DHANAK 2027',
    description: 'ISRO Mission Man on Moon 2040 Zip Hoodie — ₹799 (₹849 if shipping out).',
    price: '₹799',
    link: '/merch',
    image_front: '/merch/isro-hoodie-front.jpg',
    image_back: '/merch/isro-hoodie-back.jpg',
    accent_color: '#FF6B00',
    secondary_color: '#FFB800',
  },
  exclusive: {
    badge_label: 'Exclusive',
    heading: 'Gear up for DHANAK 2027',
    description: 'ISRO Mission Man on Moon 2040 Zip Hoodie — ₹799 (₹849 if shipping out)',
    price: '₹799',
    link: '/merch',
    image_front: '/merch/isro-hoodie-front.jpg',
    image_back: '/merch/isro-hoodie-back.jpg',
    accent_color: '#FF6B00',
    secondary_color: '#FFB800',
  },
};

export const DEFAULT_PROMO = DEFAULT_PROMOS.limited_drop;

/** One promo slot ('limited_drop' | 'exclusive') by id. */
export async function getPromo(id = 'limited_drop') {
  const fallback = DEFAULT_PROMOS[id] || DEFAULT_PROMOS.limited_drop;
  if (!isSupabaseConfigured()) {
    return fallback;
  }

  try {
    const { data, error } = await supabase.from('promo_settings').select('*').eq('id', id).maybeSingle();
    if (error && Object.keys(error).length > 0) {
      return fallback;
    }
    return data ? { ...fallback, ...data } : fallback;
  } catch (err) {
    return fallback;
  }
}

/** Both promo slots at once, keyed by id. */
export async function getPromos() {
  if (!isSupabaseConfigured()) {
    return DEFAULT_PROMOS;
  }

  try {
    const { data, error } = await supabase
      .from('promo_settings')
      .select('*')
      .in('id', ['limited_drop', 'exclusive']);
    if (error && Object.keys(error).length > 0) {
      return DEFAULT_PROMOS;
    }
    const byId = Object.fromEntries((data || []).map((row) => [row.id, row]));
    return {
      limited_drop: { ...DEFAULT_PROMOS.limited_drop, ...(byId.limited_drop || {}) },
      exclusive: { ...DEFAULT_PROMOS.exclusive, ...(byId.exclusive || {}) },
    };
  } catch (err) {
    return DEFAULT_PROMOS;
  }
}
