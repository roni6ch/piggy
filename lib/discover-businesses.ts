import { unstable_cache } from 'next/cache';
import type { DiscoveryCategoryType, GooglePlace } from '@/common/types';
import {
  DISCOVERY_CATEGORY_TO_GOOGLE_TYPE,
  DISCOVERY_CATEGORY_LABELS,
} from '@/common/types';

const PLACES_API_URL = 'https://places.googleapis.com/v1/places:searchText';
const DEFAULT_LAT = 32.0853;
const DEFAULT_LNG = 34.7818;
const DEFAULT_RADIUS_M = 50000;
const PAGE_SIZE = 20;
const CACHE_REVALIDATE_S = 86400; // 24 hours

const PLACES_FIELD_MASK =
  'places.id,places.displayName,places.formattedAddress,places.types,places.location,places.nationalPhoneNumber,places.rating,places.userRatingCount,places.photos,places.regularOpeningHours';

/** Raw place from Google Places API (New) – fields we request for full card display. */
interface GooglePlaceDiscoveryResponse {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  types?: string[];
  location?: { latitude?: number; longitude?: number };
  nationalPhoneNumber?: string;
  rating?: number;
  userRatingCount?: number;
  photos?: Array<{ name?: string }>;
  regularOpeningHours?: { weekdayDescriptions?: string[] };
}

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

function openingHoursFromPlace(p: GooglePlaceDiscoveryResponse): { today?: string; weekdays?: string[] } {
  const desc = p.regularOpeningHours?.weekdayDescriptions;
  if (!desc?.length) return {};
  const weekdays = desc.map((d) => d?.trim()).filter(Boolean);
  const weekdaysSundayFirst = reorderWeekdaysSundayFirst(weekdays);
  const today = new Date().getDay();
  const todayLine = weekdaysSundayFirst[today];
  return { today: todayLine, weekdays: weekdaysSundayFirst.length ? weekdaysSundayFirst : undefined };
}

function normalizePlace(p: GooglePlaceDiscoveryResponse): GooglePlace | null {
  const rawId = p.id?.trim();
  const name = p.displayName?.text?.trim();
  if (!rawId || !name) return null;
  const placeId = rawId.replace(/^places\//, '');
  const hours = openingHoursFromPlace(p);
  return {
    placeId,
    name,
    address: p.formattedAddress?.trim() || undefined,
    phone: p.nationalPhoneNumber?.trim() || undefined,
    rating: p.rating,
    userRatingsTotal: p.userRatingCount,
    photoName: p.photos?.[0]?.name,
    openingHours: hours.today,
    openingHoursWeekdays: hours.weekdays,
  };
}

async function fetchDiscoverBusinessesUncached(
  categoryType: DiscoveryCategoryType,
  latitude: number,
  longitude: number
): Promise<GooglePlace[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_PLACES_API_KEY is not configured');
  }

  const includedType = DISCOVERY_CATEGORY_TO_GOOGLE_TYPE[categoryType];
  const textQuery = DISCOVERY_CATEGORY_LABELS[categoryType];

  const body = {
    textQuery,
    includedType,
    pageSize: PAGE_SIZE,
    rankPreference: 'DISTANCE' as const,
    locationBias: {
      circle: {
        center: { latitude, longitude },
        radius: DEFAULT_RADIUS_M,
      },
    },
  };

  const response = await fetch(PLACES_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': PLACES_FIELD_MASK,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Places API discover error:', response.status, errText);
    throw new Error(
      response.status === 403
        ? 'Places API (New) disabled or billing not enabled.'
        : response.status === 401
          ? 'Invalid or missing Google Places API key.'
          : `Places API error: ${response.status}`
    );
  }

  const data = (await response.json()) as {
    places?: GooglePlaceDiscoveryResponse[];
  };
  const places = (data.places ?? [])
    .map(normalizePlace)
    .filter((p): p is GooglePlace => p != null);

  return places;
}

/**
 * Fetch businesses by category from Google Places API (New).
 * Returns full place data (image, hours, rating, address) for card display.
 * Cached for 24 hours per (categoryType, rounded lat, rounded lng).
 */
export async function getDiscoverBusinesses(
  categoryType: DiscoveryCategoryType,
  lat?: number,
  lng?: number
): Promise<GooglePlace[]> {
  const latitude = lat ?? DEFAULT_LAT;
  const longitude = lng ?? DEFAULT_LNG;
  const latR = Math.round(latitude * 100) / 100;
  const lngR = Math.round(longitude * 100) / 100;
  const cacheKey = `discover-${categoryType}-${latR}-${lngR}`;

  return unstable_cache(
    () => fetchDiscoverBusinessesUncached(categoryType, latitude, longitude),
    [cacheKey],
    { revalidate: CACHE_REVALIDATE_S }
  )();
}

/** Map category name (e.g. from DB or default list) to discovery type. Case-insensitive. */
export function getDiscoveryCategoryTypeFromName(categoryName: string): DiscoveryCategoryType | null {
  const lower = categoryName.trim().toLowerCase();
  if (lower === 'cinema') return 'cinema';
  if (lower === 'gym') return 'gym';
  if (lower === 'coffee' || lower === 'cafe') return 'cafe';
  if (lower === 'restaurants' || lower === 'restaurant') return 'restaurant';
  return null;
}
