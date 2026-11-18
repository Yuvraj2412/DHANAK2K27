import { DHANAK_WORKSHOPS } from './dhanakWorkshops';
import { parsePriceLabel } from './parsePriceLabel';

const WORKSHOP_BY_ID = Object.fromEntries(
  DHANAK_WORKSHOPS.map((w) => [w.id, w])
);

/**
 * Official Dhanak 2027 Workshop Combos (auto-applied in Cart & Razorpay Checkout).
 * Each named combo pairs two specific workshops for a fixed bundle price.
 * Any remaining pair of 2 workshops qualifies for the Basic Combo (flat ₹50 off).
 */
export const WORKSHOP_COMBOS = [
  {
    id: 'uav-combo',
    name: 'UAV Combo',
    description: 'Basic UAV + Advanced UAV Workshop',
    workshopIds: ['basic-uav-tech', 'advance-uav-remote-sensing'],
    originalPrice: 748,
    comboPrice: 649,
    savings: 99,
  },
  {
    id: 'rover-combo',
    name: 'Rover Combo',
    description: 'Vision-Based Rover Autonomy + Autonomous Control (RL)',
    workshopIds: ['rovervision-ai', 'deepspace-rl'],
    originalPrice: 648,
    comboPrice: 599,
    savings: 49,
  },
];

export const BASIC_COMBO_DISCOUNT = 50;

export function getAuthoritativeWorkshopPrice(workshopId) {
  const w = WORKSHOP_BY_ID[workshopId];
  if (!w) return null;
  return parsePriceLabel(w.price);
}

export function getAuthoritativeItemUnitPrice(item) {
  if (!item) return 0;
  const officialWorkshopPrice = getAuthoritativeWorkshopPrice(item.id);
  if (officialWorkshopPrice !== null) {
    return officialWorkshopPrice;
  }
  if (typeof item.unitPrice === 'number' && Number.isFinite(item.unitPrice)) {
    return item.unitPrice;
  }
  const parsed = parsePriceLabel(item.priceLabel ?? item.price);
  return parsed ?? 0;
}

/**
 * Normalizes line prices and automatically calculates all eligible workshop combo deductions.
 * Applies whenever 2+ qualifying workshops are present together in the cart.
 */
export function calculateCartPricing(items = []) {
  const safeItems = Array.isArray(items) ? items : [];

  const normalizedItems = safeItems.map((item) => {
    const authoritativePrice = getAuthoritativeWorkshopPrice(item?.id);
    if (authoritativePrice !== null) {
      const workshopMeta = WORKSHOP_BY_ID[item.id];
      return {
        ...item,
        kind: item.kind || 'workshop',
        title: item.title || workshopMeta.title,
        priceLabel: workshopMeta.price,
        unitPrice: authoritativePrice,
      };
    }
    const resolvedUnit = getAuthoritativeItemUnitPrice(item);
    return {
      ...item,
      unitPrice:
        typeof item?.unitPrice === 'number' && Number.isFinite(item.unitPrice)
          ? item.unitPrice
          : resolvedUnit,
    };
  });

  const workshopItems = normalizedItems.filter(
    (item) => item && (item.kind === 'workshop' || Boolean(WORKSHOP_BY_ID[item.id]))
  );

  // One registration slot per distinct workshop ID in cart
  const distinctWorkshopMap = new Map();
  for (const wItem of workshopItems) {
    if (!distinctWorkshopMap.has(wItem.id)) {
      distinctWorkshopMap.set(wItem.id, wItem);
    }
  }

  const remainingIds = new Set(distinctWorkshopMap.keys());
  const appliedCombos = [];

  // 1. Apply exact named brochure combos first (Space, UAV, Rover)
  for (const combo of WORKSHOP_COMBOS) {
    if (combo.workshopIds.every((id) => remainingIds.has(id))) {
      combo.workshopIds.forEach((id) => remainingIds.delete(id));
      appliedCombos.push({
        id: combo.id,
        name: combo.name,
        description: combo.description,
        workshopIds: [...combo.workshopIds],
        originalPrice: combo.originalPrice,
        comboPrice: combo.comboPrice,
        savings: combo.savings,
      });
    }
  }

  // 2. Apply Basic Combo (Flat ₹50 OFF for any remaining pair of 2 workshops)
  const leftoverIds = Array.from(remainingIds);
  for (let i = 0; i + 1 < leftoverIds.length; i += 2) {
    const idA = leftoverIds[i];
    const idB = leftoverIds[i + 1];
    const priceA = getAuthoritativeItemUnitPrice(distinctWorkshopMap.get(idA));
    const priceB = getAuthoritativeItemUnitPrice(distinctWorkshopMap.get(idB));
    const pairOriginal = priceA + priceB;
    const savings = Math.min(BASIC_COMBO_DISCOUNT, pairOriginal);
    const titleA = distinctWorkshopMap.get(idA)?.title || idA;
    const titleB = distinctWorkshopMap.get(idB)?.title || idB;

    appliedCombos.push({
      id: `basic-combo-${appliedCombos.length + 1}`,
      name: 'Basic Combo (Any 2 Workshops)',
      description: `${titleA} + ${titleB}`,
      workshopIds: [idA, idB],
      originalPrice: pairOriginal,
      comboPrice: Math.max(0, pairOriginal - savings),
      savings,
    });
  }

  const originalSubtotal = normalizedItems.reduce((sum, item) => {
    const unit = typeof item?.unitPrice === 'number' ? item.unitPrice : 0;
    const qty = Number(item?.qty) || 1;
    return sum + unit * qty;
  }, 0);

  const totalDiscount = appliedCombos.reduce((sum, c) => sum + c.savings, 0);
  const finalTotal = Math.max(0, originalSubtotal - totalDiscount);

  return {
    normalizedItems,
    hasWorkshops: workshopItems.length > 0,
    originalSubtotal,
    appliedCombos,
    totalDiscount,
    finalTotal,
  };
}

/**
 * Returns a short combo hint banner string for a single workshop detail page.
 */
export function getWorkshopComboHint(workshopId) {
  const named = WORKSHOP_COMBOS.find((c) => c.workshopIds.includes(workshopId));
  if (named) {
    const partnerId = named.workshopIds.find((id) => id !== workshopId);
    const partnerTitle = WORKSHOP_BY_ID[partnerId]?.title || partnerId;
    return {
      namedCombo: named,
      partnerId,
      partnerTitle,
      message: `${named.name}: ₹${named.comboPrice} total when paired in cart with ${partnerTitle} (Save ₹${named.savings}), or Flat ₹50 off any 2 workshops via Basic Combo.`,
    };
  }
  return {
    namedCombo: null,
    partnerId: null,
    partnerTitle: null,
    message: 'Basic Combo: Get Flat ₹50 off automatically at checkout when you pair any 2 workshops in your cart.',
  };
}
