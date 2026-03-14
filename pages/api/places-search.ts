import type { NextApiRequest, NextApiResponse } from 'next';
import { placesSearchBodySchema } from '@/lib/api-schemas';
import type { GooglePlace } from '@/common/types';

const PLACES_API_URL = 'https://places.googleapis.com/v1/places:searchText';
const DEFAULT_LAT = 32.0853;
const DEFAULT_LNG = 34.7818;
const DEFAULT_RADIUS_M = 50000;
const PAGE_SIZE = 20;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/** Only request fields we use – reduces payload and cost. */
const PLACES_FIELD_MASK =
  'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.rating,places.userRatingCount,places.photos,places.regularOpeningHours';

/** In-memory cache: key = query + rounded lat/lng, value = { places, timestamp }. */
const placesCache = new Map<string, { places: GooglePlace[]; timestamp: number }>();

function cacheKey(query: string, lat: number, lng: number): string {
  const q = query.trim().toLowerCase();
  const latR = Math.round(lat * 100) / 100;
  const lngR = Math.round(lng * 100) / 100;
  return `${q}|${latR}|${lngR}`;
}

/** Raw Place from Google Places API (New) – only fields we use. */
interface GooglePlaceResponse {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  rating?: number;
  userRatingCount?: number;
  photos?: Array<{ name?: string }>;
  regularOpeningHours?: { weekdayDescriptions?: string[] };
}

/** Day order for display: week starts Sunday. Google may return Sunday-first; ensure consistent order. */
const DAY_ORDER = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function reorderWeekdaysSundayFirst(weekdays: string[]): string[] {
  if (weekdays.length !== 7) return weekdays;
  const ordered: string[] = [];
  for (const day of DAY_ORDER) {
    const found = weekdays.find((d) => d.startsWith(day));
    if (found) ordered.push(found);
  }
  return ordered.length === 7 ? ordered : weekdays;
}

/** Get today's line and full week from weekdayDescriptions (Sunday = 0). */
function openingHoursFromPlace(p: GooglePlaceResponse): { today?: string; weekdays?: string[] } {
  const desc = p.regularOpeningHours?.weekdayDescriptions;
  if (!desc?.length) return {};
  const weekdays = desc.map((d) => d?.trim()).filter(Boolean);
  const weekdaysSundayFirst = reorderWeekdaysSundayFirst(weekdays);
  const today = new Date().getDay();
  const todayLine = weekdaysSundayFirst[today];
  return { today: todayLine, weekdays: weekdaysSundayFirst.length ? weekdaysSundayFirst : undefined };
}

function normalizePlace(p: GooglePlaceResponse): GooglePlace | null {
  const name = p.displayName?.text?.trim();
  if (!name) return null;
  const firstPhoto = p.photos?.[0]?.name;
  const hours = openingHoursFromPlace(p);
  return {
    placeId: p.id ?? '',
    name,
    address: p.formattedAddress ?? undefined,
    phone: p.nationalPhoneNumber ?? undefined,
    rating: p.rating,
    userRatingsTotal: p.userRatingCount,
    photoName: firstPhoto ?? undefined,
    openingHours: hours.today,
    openingHoursWeekdays: hours.weekdays,
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ places: GooglePlace[] } | { error: string }>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) {
    return res.status(500).json({ error: 'Google Places API key not configured' });
  }

  const parsed = placesSearchBodySchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    const first = parsed.error.flatten().formErrors[0];
    return res.status(400).json({
      error: typeof first === 'string' ? first : 'Missing or invalid "query" in body',
    });
  }

  const { query, lat, lng } = parsed.data;
  const latitude = lat ?? DEFAULT_LAT;
  const longitude = lng ?? DEFAULT_LNG;

  const ck = cacheKey(query, latitude, longitude);
  const cached = placesCache.get(ck);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return res.status(200).json({ places: cached.places });
  }

  const body = {
    textQuery: query,
    pageSize: PAGE_SIZE,
    rankPreference: 'DISTANCE' as const,
    locationBias: {
      circle: {
        center: { latitude, longitude },
        radius: DEFAULT_RADIUS_M,
      },
    },
  };

  try {
    const response = await fetch(PLACES_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': PLACES_FIELD_MASK,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Places API error:', response.status, errText);
      let message = 'Places search failed. Check API key and billing.';
      try {
        const errJson = JSON.parse(errText) as { error?: { message?: string; status?: string; code?: number } };
        const msg = errJson?.error?.message ?? errJson?.error?.status;
        if (msg) message = msg;
        else if (response.status === 403) message = 'Places API (New) disabled or billing not enabled. Enable it in Google Cloud Console.';
        else if (response.status === 401) message = 'Invalid or missing Google Places API key.';
      } catch {
        if (response.status === 403) message = 'Places API (New) disabled or billing not enabled. Enable it in Google Cloud Console.';
        else if (response.status === 401) message = 'Invalid or missing Google Places API key.';
      }
      return res.status(502).json({ error: message });
    }

    const data = (await response.json()) as {
      places?: GooglePlaceResponse[];
    };
    const places = (data.places ?? [])
      .map(normalizePlace)
      .filter((p): p is GooglePlace => p != null);

    placesCache.set(ck, { places, timestamp: Date.now() });

    return res.status(200).json({ places });
  } catch (err) {
    console.error('places-search error:', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal Server Error',
    });
  }
}
