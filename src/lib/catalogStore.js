import { supabase, isSupabaseConfigured } from './supabaseClient';
import { DHANAK_WORKSHOPS } from './dhanakWorkshops';
import { DHANAK_EVENTS } from './dhanakEvents';

// catalog_items uses snake_case columns for the handful of fields that
// don't already match the camelCase field names used throughout the UI.
const COLUMN_TO_FIELD = {
  section_color: 'sectionColor',
  duration: 'Duration',
  seats: 'Seats',
  badge_icon: 'badgeIcon',
  accent_color: 'accentColor',
  glow_color: 'glowColor',
  foil_gradient: 'foilGradient',
  about_extra: 'aboutExtra',
  brochure_url: 'brochureUrl',
  prize_pool: 'prizePool',
  event_date: 'eventDate',
  group_size: 'groupSize',
  strike_price: 'strikePrice',
};

const IGNORED_COLUMNS = new Set(['kind', 'sort_order', 'updated_at', 'updated_by', 'hidden_fields']);

// Tentative workshops explicitly excluded from the public catalog
const EXCLUDED_WORKSHOP_IDS = new Set([
  'aircraft-design-aerodynamics',
  'rocketry-workshop',
]);

const TEXT_COLUMNS_DEFAULT_EMPTY = new Set([
  'title', 'subtitle', 'type', 'section', 'section_color',
  'eligibility', 'venue', 'timing', 'image', 'badge_icon',
  'accent_color', 'glow_color', 'foil_gradient', 'description',
  'format', 'certificate', 'brochure_url', 'prize_pool', 'event_date', 'strike_price',
]);

function rowToCard(row) {
  const hidden = new Set(Array.isArray(row.hidden_fields) ? row.hidden_fields : []);
  const card = {};
  for (const [column, value] of Object.entries(row)) {
    if (IGNORED_COLUMNS.has(column)) continue;
    if (hidden.has(column)) continue;
    const resolved = value == null && TEXT_COLUMNS_DEFAULT_EMPTY.has(column) ? '' : value;
    card[COLUMN_TO_FIELD[column] || column] = resolved;
  }
  return card;
}

function withTicket(card, ticket) {
  return { ...card, price: ticket.cost, ticketId: ticket.ticket_id };
}

/** All workshop or event cards, in their configured display order. */
export async function getCatalog(kind) {
  if (kind === 'workshop') {
    if (!isSupabaseConfigured()) {
      return DHANAK_WORKSHOPS;
    }
    try {
      const [{ data: tickets }, { data: content }] = await Promise.all([
        supabase.from('tickets').select('*').eq('type', 'workshop'),
        supabase.from('catalog_items').select('*').eq('kind', 'workshop').order('sort_order', { ascending: true }),
      ]);

      const contentById = Object.fromEntries((content || []).map((row) => [row.id, rowToCard(row)]));
      const localIds = new Set(DHANAK_WORKSHOPS.map((w) => w.id));

      // Keep all 7 confirmed official Dhanak workshops authoritative for titles/schedule/sections,
      // plus append any non-tentative custom workshops created via the Admin dashboard.
      const extraDbCards = (tickets || [])
        .filter(
          (ticket) =>
            !localIds.has(ticket.id) &&
            !EXCLUDED_WORKSHOP_IDS.has(ticket.id) &&
            contentById[ticket.id]?.title &&
            !/tentative/i.test(contentById[ticket.id]?.title || '')
        )
        .map((ticket) => withTicket(contentById[ticket.id], ticket));

      return [...DHANAK_WORKSHOPS, ...extraDbCards];
    } catch {
      return DHANAK_WORKSHOPS;
    }
  }

  if (kind === 'event') {
    if (!isSupabaseConfigured()) {
      return DHANAK_EVENTS;
    }
    try {
      const [{ data: tickets }, { data: content }] = await Promise.all([
        supabase.from('tickets').select('*').eq('type', 'event'),
        supabase.from('catalog_items').select('*').eq('kind', 'event').order('sort_order', { ascending: true }),
      ]);

      const contentById = Object.fromEntries((content || []).map((row) => [row.id, rowToCard(row)]));
      const localIds = new Set(DHANAK_EVENTS.map((e) => e.id));

      // Keep all 27 official Dhanak events authoritative for titles/categories/details,
      // plus append any custom events created via the Admin dashboard.
      const extraDbCards = (tickets || [])
        .filter((ticket) => !localIds.has(ticket.id) && contentById[ticket.id]?.title)
        .map((ticket) => withTicket(contentById[ticket.id], ticket));

      return [...DHANAK_EVENTS, ...extraDbCards];
    } catch {
      return DHANAK_EVENTS;
    }
  }

  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const [{ data: tickets, error: ticketsError }, { data: content, error: contentError }] =
      await Promise.all([
        supabase.from('tickets').select('*').eq('type', kind),
        supabase.from('catalog_items').select('*').eq('kind', kind).order('sort_order', { ascending: true }),
      ]);

    if (ticketsError && Object.keys(ticketsError).length > 0) {
      console.warn('[catalogStore] getCatalog tickets warning:', ticketsError.message || ticketsError);
    }
    if (contentError && Object.keys(contentError).length > 0) {
      console.warn('[catalogStore] getCatalog content warning:', contentError.message || contentError);
    }

    const contentById = Object.fromEntries((content || []).map((row) => [row.id, rowToCard(row)]));
    const contentOrder = (content || []).map((row) => row.id);

    const cards = (tickets || [])
      .filter((ticket) => contentById[ticket.id]?.title)
      .map((ticket) => withTicket(contentById[ticket.id], ticket));

    cards.sort((a, b) => {
      const ai = contentOrder.indexOf(a.id);
      const bi = contentOrder.indexOf(b.id);
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });

    return cards;
  } catch {
    return [];
  }
}

/** A single workshop or event card by id. */
export async function getCatalogItem(kind, id) {
  if (kind === 'workshop') {
    if (EXCLUDED_WORKSHOP_IDS.has(id)) return null;
    const local = DHANAK_WORKSHOPS.find((w) => w.id === id);
    if (local) return local;
    if (!isSupabaseConfigured()) return null;
  } else if (kind === 'event') {
    const local = DHANAK_EVENTS.find((e) => e.id === id);
    if (local) return local;
    if (!isSupabaseConfigured()) return null;
  } else if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const [{ data: ticket }, { data: contentRow }] =
      await Promise.all([
        supabase.from('tickets').select('*').eq('type', kind).eq('id', id).maybeSingle(),
        supabase.from('catalog_items').select('*').eq('kind', kind).eq('id', id).maybeSingle(),
      ]);

    if (!ticket || !contentRow?.title) {
      if (kind === 'workshop') {
        return DHANAK_WORKSHOPS.find((w) => w.id === id) || null;
      }
      if (kind === 'event') {
        return DHANAK_EVENTS.find((e) => e.id === id) || null;
      }
      return null;
    }
    return withTicket(rowToCard(contentRow), ticket);
  } catch {
    if (kind === 'workshop') {
      return DHANAK_WORKSHOPS.find((w) => w.id === id) || null;
    }
    if (kind === 'event') {
      return DHANAK_EVENTS.find((e) => e.id === id) || null;
    }
    return null;
  }
}
