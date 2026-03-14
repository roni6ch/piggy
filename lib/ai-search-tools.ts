/**
 * Internal tools for AI search: DB and in-app search.
 * Used by /api/ai-search to gather stores, deals, user cards, and compute best combos.
 */
import type { Business, Card, DealDocument } from '@/common/types';
import { searchBusinessesByName } from '@/queries/businesses/businessQueries';
import { getDealsByBusinessId } from '@/queries/deals/dealsQueries';
import { getUserCards } from '@/queries/users/userQueries';
import { getCategories } from '@/queries/categories/categoryQueries';

const DEALS_LIMIT = 50;
const DEALS_PAGE = 1;

export async function toolSearchStores(query: string, limit = 20): Promise<Business[]> {
  return searchBusinessesByName(query, limit) as Promise<Business[]>;
}

/** Returns deals for a business (with card populated). */
export async function toolGetDealsByBusiness(businessId: string): Promise<DealDocument[]> {
  const { data } = await getDealsByBusinessId(businessId, DEALS_LIMIT, DEALS_PAGE);
  return data as DealDocument[];
}

/** Returns user's cards (populated). */
export async function toolGetUserCards(userEmail: string): Promise<Card[]> {
  const user = await getUserCards(userEmail);
  if (!user || !Array.isArray(user.cards)) return [];
  return user.cards as unknown as Card[];
}

export async function toolGetCategories(): Promise<Awaited<ReturnType<typeof getCategories>>['data']> {
  const { data } = await getCategories(100, 1);
  return data ?? [];
}

/**
 * Build "best combos": deals at the given stores that match the user's cards.
 * Prioritizes: store in list + deal's card is in userCards.
 */
export function buildBestCombos(
  stores: Business[],
  dealsByStore: Record<string, DealDocument[]>,
  userCards: Card[]
): { summary: string; items: Array<{ store: Business; card: Card; deal: DealDocument; reason?: string }> } {
  const userCardIds = new Set((userCards ?? []).map((c) => c._id));
  const items: Array<{ store: Business; card: Card; deal: DealDocument; reason?: string }> = [];

  for (const store of stores) {
    const deals = dealsByStore[store._id] ?? [];
    for (const deal of deals) {
      const card = typeof deal.cardId === 'object' ? deal.cardId : null;
      if (!card || !userCardIds.has(card._id)) continue;
      items.push({
        store,
        card,
        deal,
        reason: `You have ${card.club} – use it at ${store.name} for this deal.`,
      });
    }
  }

  const summary =
    items.length > 0
      ? `We found ${items.length} deal(s) at your searched stores that match your cards. Use the card shown for each to get the discount.`
      : '';

  return { summary, items };
}
