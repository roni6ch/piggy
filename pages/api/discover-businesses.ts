import type { NextApiRequest, NextApiResponse } from 'next';
import { discoverBusinessesBodySchema } from '@/lib/api-schemas';
import { getDiscoverBusinesses } from '@/lib/discover-businesses';
import { getPlaceIdsWithActiveDeals } from '@/lib/place-ids-with-deals';
import type { GooglePlace } from '@/common/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ businesses: GooglePlace[]; placeIdsWithPerks: string[] } | { error: string }>
) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', ['POST', 'GET']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!process.env.GOOGLE_PLACES_API_KEY) {
    return res.status(500).json({
      error: 'Google Places API key not configured',
    });
  }

  const raw = req.method === 'POST' ? req.body : req.query;
  const toNum = (v: unknown): number | undefined => {
    if (v == null) return undefined;
    const n = Number(v);
    return Number.isNaN(n) ? undefined : n;
  };
  const parsed = discoverBusinessesBodySchema.safeParse(
    req.method === 'GET'
      ? {
          categoryType: raw.categoryType,
          lat: toNum(raw.lat),
          lng: toNum(raw.lng),
        }
      : raw
  );

  if (!parsed.success) {
    const first = parsed.error.flatten().formErrors[0];
    return res.status(400).json({
      error:
        typeof first === 'string'
          ? first
          : 'Missing or invalid categoryType (cinema, gym, cafe, restaurant)',
    });
  }

  const { categoryType, lat, lng } = parsed.data;

  try {
    const [businesses, placeIdsWithPerks] = await Promise.all([
      getDiscoverBusinesses(categoryType, lat, lng),
      getPlaceIdsWithActiveDeals(),
    ]);

    return res.status(200).json({
      businesses,
      placeIdsWithPerks: Array.from(placeIdsWithPerks),
    });
  } catch (err) {
    console.error('discover-businesses error:', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal Server Error',
    });
  }
}
