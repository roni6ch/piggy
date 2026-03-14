import { Card, Category, Business, Network, Deals, RecentSearch, AiSearchResponse, GooglePlace } from '@/common/types';

export enum REQ_URLS {
    AI_SEARCH = `/api/ai-search`,
    PLACES_SEARCH = `/api/places-search`,
    SEARCH_PLACEHOLDER = `/api/search-placeholder`,
    CATEGORIES = `/api/categories`,
    BUSINESSES = `/api/businesses`,
    CARDS = `/api/cards`,
    USERS = `/api/users`,
    DEALS = `/api/deals`,
    DEAL = `/api/deals`,
}
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

/** Parse JSON from fetch response; if server returns HTML (e.g. 404), return fallback to avoid "Unexpected token <" */
async function parseJsonOr<T>(res: Response, fallback: T): Promise<T> {
    const text = await res.text();
    if (!text.trim().startsWith('{') && !text.trim().startsWith('[')) return fallback;
    try {
        return JSON.parse(text) as T;
    } catch {
        return fallback;
    }
}

/* APP */
/** Fetch all card types from API (Firebase). Use for cards catalog page. */
export async function getCards(all = true): Promise<Card[]> {
    const url = all
        ? `${BASE_URL}${REQ_URLS.CARDS}?all=1`
        : `${BASE_URL}${REQ_URLS.CARDS}?limit=10&page=1`;
    const res = await fetch(url);
    const json = await parseJsonOr<{ data?: Card[] }>(res, { data: [] });
    return json.data ?? [];
}

export async function getCard({ id }: { id: string }): Promise<Card> {
    const res = await fetch(`${BASE_URL}${REQ_URLS.CARDS}?id=${id}`);
    const json = await parseJsonOr<{ data?: Card }>(res, {});
    return json.data as Card;
}

export async function getCategories(): Promise<Category[]> {
    const res = await fetch(`${BASE_URL}${REQ_URLS.CATEGORIES}`);
    const json = await parseJsonOr<{ data?: Category[] }>(res, { data: [] });
    return json.data ?? [];
}

export async function getCategory({ categoryId }: { categoryId: string }): Promise<Category> {
    const res = await fetch(`${BASE_URL}${REQ_URLS.CATEGORIES}?id=${categoryId}`);
    const json = await parseJsonOr<{ data?: Category }>(res, { data: undefined });
    return (json.data ?? { _id: '', name: '', imageSrc: '', businessIds: [] }) as Category;
}

export async function getBusinesses(): Promise<Business[]> {
    const res = await fetch(`${BASE_URL}${REQ_URLS.BUSINESSES}`);
    const json = await parseJsonOr<{ data?: Business[] } | Business[]>(res, []);
    return Array.isArray(json) ? json : (json.data ?? []);
}

export async function getBusiness({ id }: { id: string }): Promise<Business[]> {
    const res = await fetch(`${BASE_URL}${REQ_URLS.BUSINESSES}?id=${id}`);
    const json = await parseJsonOr<{ data?: Business[] }>(res, { data: [] });
    return json.data ?? [];
}

/** Fetch a single business by id (API returns the object directly). */
export async function getBusinessById(id: string): Promise<Business | null> {
    const res = await fetch(`${BASE_URL}${REQ_URLS.BUSINESSES}?id=${encodeURIComponent(id)}`);
    if (!res.ok) return null;
    const json = await parseJsonOr<Business & { message?: string }>(res, {} as Business & { message?: string });
    return json && typeof json === 'object' && json.name ? (json as Business) : null;
}

/* USER */

export async function getUserCards({ userEmail }: { userEmail: string }): Promise<Card[]> {
    const res = await fetch(`${BASE_URL}${REQ_URLS.USERS}/${userEmail}/cards`, { credentials: 'include' });
    const json = await parseJsonOr<{ cards?: Card[] }>(res, { cards: [] });
    return json.cards ?? [];
}

export async function setCard({ cardId, userEmail }: { cardId: string, userEmail: string }) {
    const res = await fetch(`${BASE_URL}${REQ_URLS.USERS}/${userEmail}/cards/${cardId}`, {
        method: Network.PUT,
    });
    return res;
}

export async function removeCard({ cardId, userEmail }: { cardId: string, userEmail: string }) {
    const res = await fetch(`${BASE_URL}${REQ_URLS.USERS}/${userEmail}/cards/${cardId}`, {
        method: Network.DELETE,
    });
    return res;
}

/** Add a user-built card (club + provider). Returns the new card. */
export async function addCardByChoice({
    userEmail,
    club,
    provider,
}: {
    userEmail: string;
    club: string;
    provider: string;
}): Promise<Card | null> {
    const res = await fetch(`${BASE_URL}${REQ_URLS.USERS}/${userEmail}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ club, provider }),
    });
    if (!res.ok) return null;
    const json = await parseJsonOr<Card>(res, {} as Card);
    return json;
}

/** Get current user profile. Requires session. */
export async function getProfile({ userEmail }: { userEmail: string }): Promise<{
    name: string;
    image: string;
    avatarAnimal?: string;
    createdAt?: string;
    buymeAmount?: number;
    buymeType?: string;
}> {
    const res = await fetch(`${BASE_URL}${REQ_URLS.USERS}/${userEmail}/profile`, { credentials: 'include' });
    const json = await parseJsonOr<{
        name?: string;
        image?: string;
        avatarAnimal?: string;
        createdAt?: string;
        buymeAmount?: number;
        buymeType?: string;
    }>(res, {});
    return {
        name: json.name ?? '',
        image: json.image ?? '',
        avatarAnimal: json.avatarAnimal,
        createdAt: json.createdAt,
        buymeAmount: json.buymeAmount,
        buymeType: json.buymeType,
    };
}

/** Update current user profile. Image is only set from SSO. Requires session. */
export async function updateProfile({
    userEmail,
    name,
    avatarAnimal,
    buymeAmount,
    buymeType,
}: {
    userEmail: string;
    name?: string;
    avatarAnimal?: string;
    buymeAmount?: number;
    buymeType?: string;
}) {
    const body: Record<string, string | number> = {};
    if (name !== undefined) body.name = name;
    if (avatarAnimal !== undefined) body.avatarAnimal = avatarAnimal;
    if (buymeAmount !== undefined) body.buymeAmount = buymeAmount;
    if (buymeType !== undefined) body.buymeType = buymeType;
    const res = await fetch(`${BASE_URL}${REQ_URLS.USERS}/${userEmail}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message || res.statusText);
    }
    return res.json();
}

/* DEALS */

export async function getDeals() {
    const res = await fetch(`${BASE_URL}${REQ_URLS.DEALS}`, {
        method: Network.GET,
    });
    const json = await parseJsonOr<{ data?: unknown[]; deals?: unknown[] }>(res, { data: [], deals: [] });
    return (json.data ?? json.deals ?? []);
}

export async function getDeal({ dealId }: { dealId: string }) {
    const res = await fetch(`${BASE_URL}${REQ_URLS.DEAL}/${dealId}`, {
        method: Network.GET,
    });
    const json = await parseJsonOr<{ deal?: unknown }>(res, { deal: [] });
    return json.deal ?? [];
}

export async function getDealsByBusiness({ businessId }: { businessId: string }): Promise<Deals> {
    const res = await fetch(`${BASE_URL}${REQ_URLS.BUSINESSES}/${businessId}/deals`, {
        method: Network.GET,
    });
    return parseJsonOr<Deals>(res, { data: [], total: 0, totalPages: 0 });
}


/* RECENT SEARCHES */
export async function getRecentSearches({ userMail }: { userMail: string }): Promise<RecentSearch[]> {
    const res = await fetch(`${BASE_URL}${REQ_URLS.USERS}/${userMail}/recent-searches`, {
        method: Network.GET,
    });
    const json = await parseJsonOr<{ data?: RecentSearch[] }>(res, { data: [] });
    return json.data ?? [];
}

export async function addTermToRecentSearch({
    userMail,
    businessId,
    name,
    imageSrc,
    imageSrcBig,
    address,
    rating,
    userRatingsTotal,
    openingHours,
    openingHoursWeekdays,
    phone,
    website,
}: {
    userMail?: string;
    businessId: string;
    name?: string;
    imageSrc?: string;
    imageSrcBig?: string;
    address?: string;
    rating?: number;
    userRatingsTotal?: number;
    openingHours?: string;
    openingHoursWeekdays?: string[];
    phone?: string;
    website?: string;
}) {
    if (userMail && businessId) {
        const payload =
            name != null ||
            imageSrc != null ||
            imageSrcBig != null ||
            address != null ||
            rating != null ||
            openingHours != null ||
            phone != null ||
            website != null
                ? {
                      name,
                      imageSrc,
                      imageSrcBig,
                      address,
                      rating,
                      userRatingsTotal,
                      openingHours,
                      openingHoursWeekdays,
                      phone,
                      website,
                  }
                : {};
        const res = await fetch(`${BASE_URL}${REQ_URLS.USERS}/${userMail}/recent-searches/${encodeURIComponent(businessId)}`, {
            method: Network.POST,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        return parseJsonOr<unknown>(res, null);
    }
}

/** Fetch a single search placeholder (e.g. "best deals at KSP", "coffee near me"). Can be backed by LLM later. */
export async function getSearchPlaceholder(): Promise<string> {
  const res = await fetch(`${BASE_URL}${REQ_URLS.SEARCH_PLACEHOLDER}`);
  const json = await parseJsonOr<{ placeholder?: string }>(res, { placeholder: 'Search stores, sales, coupons…' });
  return json.placeholder ?? 'Search stores, sales, coupons…';
}

/* USER COUPONS */
export type UserCoupon = {
  _id: string;
  storeName: string;
  amount: string;
  endDate: string;
  couponCode?: string;
  receiptImageUrl?: string;
  receiptImageData?: string;
  createdAt: string;
};

export async function getUserCoupons({ userEmail }: { userEmail: string }): Promise<UserCoupon[]> {
  const res = await fetch(`${BASE_URL}${REQ_URLS.USERS}/${userEmail}/coupons`, { credentials: 'include' });
  if (!res.ok) return [];
  const json = await parseJsonOr<UserCoupon[]>(res, []);
  return Array.isArray(json) ? json : [];
}

export async function addCoupon({
  userEmail,
  storeName,
  amount,
  endDate,
  couponCode,
  receiptImage,
}: {
  userEmail: string;
  storeName: string;
  amount?: string;
  endDate?: string;
  couponCode?: string;
  receiptImage?: string;
}): Promise<UserCoupon | null> {
  const res = await fetch(`${BASE_URL}${REQ_URLS.USERS}/${userEmail}/coupons`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ storeName, amount: amount ?? '', endDate: endDate ?? '', couponCode, receiptImage }),
  });
  if (!res.ok) return null;
  const json = await parseJsonOr<UserCoupon | null>(res, null);
  return json;
}

export async function updateCoupon({
  userEmail,
  couponId,
  storeName,
  amount,
  endDate,
  couponCode,
  receiptImage,
}: {
  userEmail: string;
  couponId: string;
  storeName: string;
  amount?: string;
  endDate?: string;
  couponCode?: string;
  receiptImage?: string;
}): Promise<UserCoupon | null> {
  const res = await fetch(`${BASE_URL}${REQ_URLS.USERS}/${userEmail}/coupons/${couponId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ storeName, amount: amount ?? '', endDate: endDate ?? '', couponCode, receiptImage }),
  });
  if (!res.ok) return null;
  const json = await parseJsonOr<UserCoupon | null>(res, null);
  return json;
}

export async function deleteCoupon({
  userEmail,
  couponId,
}: {
  userEmail: string;
  couponId: string;
}): Promise<boolean> {
  const res = await fetch(`${BASE_URL}${REQ_URLS.USERS}/${userEmail}/coupons/${couponId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return res.ok;
}

/** AI-powered search: stores, deals, and best combos (card + store + deal). */
export async function aiSearch(query: string): Promise<AiSearchResponse> {
    const res = await fetch(`${BASE_URL}${REQ_URLS.AI_SEARCH}`, {
        method: Network.POST,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
    });
    if (!res.ok) {
        const err = await parseJsonOr<{ error?: string }>(res, {});
        throw new Error(err.error || res.statusText);
    }
    return res.json() as Promise<AiSearchResponse>;
}

/** Google Places text search – closest businesses by query (e.g. "Coffee" → Aroma, Cafe Cafe). */
export async function placesSearch(
    query: string,
    options?: { lat?: number; lng?: number }
): Promise<GooglePlace[]> {
    const res = await fetch(`${BASE_URL}${REQ_URLS.PLACES_SEARCH}`, {
        method: Network.POST,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            query: query.trim(),
            lat: options?.lat,
            lng: options?.lng,
        }),
    });
    if (!res.ok) {
        const err = await parseJsonOr<{ error?: string }>(res, {});
        throw new Error(err.error || res.statusText);
    }
    const json = (await res.json()) as { places?: GooglePlace[] };
    return json.places ?? [];
}

