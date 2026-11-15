import { supabase, isSupabaseConfigured } from './supabaseClient';

let cache = null;

function parseCost(raw) {
  if (raw == null) return null;
  const n = Number(String(raw).replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : null;
}

async function loadAll() {
  if (cache) return cache;
  if (!isSupabaseConfigured()) {
    cache = {
      'merch-tshirt': { ticketId: 3999, cost: 499 },
    };
    return cache;
  }

  try {
    const { data, error } = await supabase.from('tickets').select('id, ticket_id, cost');
    if (error && Object.keys(error).length > 0) {
      console.warn('[ticketStore] loadAll warning:', error.message || error);
      return {};
    }
    cache = Object.fromEntries(
      (data || []).map((row) => [row.id, { ticketId: row.ticket_id, cost: parseCost(row.cost) }])
    );
    return cache;
  } catch (err) {
    return {};
  }
}

/** Ticket id for a single id (e.g. 'accommodation', 'breakfast', 'c1', 'rocket'). */
export async function getTicketId(id) {
  const all = await loadAll();
  return all[id]?.ticketId;
}

/** Every ticket id at once, keyed by id — for pages that need several. */
export async function getTicketMap() {
  const all = await loadAll();
  return Object.fromEntries(Object.entries(all).map(([id, row]) => [id, row.ticketId]));
}

/** Price (as a plain number, e.g. 599) for a single id. */
export async function getTicketCost(id) {
  const all = await loadAll();
  return all[id]?.cost ?? null;
}

/** Every price at once, keyed by id — for pages that need several. */
export async function getCostMap() {
  const all = await loadAll();
  return Object.fromEntries(Object.entries(all).map(([id, row]) => [id, row.cost]));
}
