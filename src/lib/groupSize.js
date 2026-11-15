import { DHANAK_EVENTS } from './dhanakEvents';
import { DHANAK_WORKSHOPS } from './dhanakWorkshops';

/**
 * Resolves the required team size for an event or workshop from the local
 * Dhanak catalog first, falling back to Supabase `catalog_items` if needed.
 */
export async function resolveEventGroupSize(supabase, eventId) {
  const localItem =
    DHANAK_EVENTS.find((e) => e.id === eventId) ||
    DHANAK_WORKSHOPS.find((w) => w.id === eventId);

  const { data: catalogItem } = await supabase
    .from('catalog_items')
    .select('group_size, title')
    .eq('id', eventId)
    .maybeSingle();

  const groupSize = Number(localItem?.groupSize) || Number(catalogItem?.group_size) || 1;
  return {
    groupSize,
    title: localItem?.title || catalogItem?.title || eventId,
  };
}
