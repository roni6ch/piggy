import { getBusiness } from '@/queries/businesses/businessQueries';
import { getAllDeals } from '@/queries/deals/dealsQueries';

const MAX_DEALS_TO_SCAN = 500;

/**
 * Returns Google Place IDs for businesses that have at least one active (non-expired) deal.
 * Used to show "Has perks" badge on discovery results.
 */
export async function getPlaceIdsWithActiveDeals(): Promise<Set<string>> {
  const { data: deals } = await getAllDeals(MAX_DEALS_TO_SCAN, 1);
  const now = new Date();
  const activeBusinessIds = new Set<string>();
  for (const deal of deals) {
    const businessId =
      typeof deal.businessId === 'string'
        ? deal.businessId
        : (deal.businessId as { _id?: string })?._id;
    if (!businessId) continue;
    const exp =
      deal.expirationDate instanceof Date
        ? deal.expirationDate
        : new Date(deal.expirationDate);
    if (exp >= now) {
      activeBusinessIds.add(businessId);
    }
  }

  const placeIds = new Set<string>();
  await Promise.all(
    Array.from(activeBusinessIds).map(async (businessId) => {
      const business = await getBusiness(businessId);
      if (business?.googlePlaceId) {
        placeIds.add(business.googlePlaceId);
      }
    })
  );
  return placeIds;
}
