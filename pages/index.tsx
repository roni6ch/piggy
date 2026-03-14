import dynamic from 'next/dynamic';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useState, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { getServerSession } from 'next-auth';
import { useSession } from 'next-auth/react';
import { Business as BusinessType, RecentSearch, AiSearchResponse, BestComboItem, Card as CardType, Issuer, Provider, Club, CardBackground, DealDocument, GooglePlace } from '@/common/types';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Items from '@/common/components/items';
import { Routes } from '@/common/types';

import SkeletonGrid from '@/common/components/skeleton-grid';
import { useUserDataContext } from '@/common/context/userContext';
import { addTermToRecentSearch, aiSearch, placesSearch, getBusinesses, getRecentSearches, getDealsByBusiness } from '@/common/api';
import SearchIcon from '@mui/icons-material/Search';
import DiscountIcon from '@mui/icons-material/Discount';
import StoreIcon from '@mui/icons-material/Store';

const Business = dynamic(() => import('@/common/components/business'), { ssr: false });

const PLACEHOLDER_IMG = '/assets/images/mountains.jpg';

const MOCK_CARD: CardType = {
  _id: 'mock-card-1',
  name: 'Max',
  issuer: Issuer.REGULAR,
  imageSrc: '/assets/cards-icons/max.svg',
  provider: Provider.VISA,
  club: Club.MAX,
  bg: CardBackground.MAX,
};

const MOCK_BUSINESSES: BusinessType[] = [
  { _id: 'mock-aroma', name: 'Aroma Coffee', imageSrc: PLACEHOLDER_IMG, imageSrcBig: PLACEHOLDER_IMG, rating: 4.2, userRatingsTotal: 120, openingHours: 'Open today 8:00 – 22:00', address: 'Dizengoff 99, Tel Aviv', phone: '+972-3-1234567', website: 'https://aroma.co.il' },
  { _id: 'mock-cafe', name: 'Café Café', imageSrc: PLACEHOLDER_IMG, imageSrcBig: PLACEHOLDER_IMG, rating: 4.5, userRatingsTotal: 89, openingHours: 'Open today 7:00 – 23:00', address: 'Ibn Gabirol 30, Tel Aviv', phone: '+972-3-7654321', website: 'https://cafecafe.co.il' },
  { _id: 'mock-ksp', name: 'KSP', imageSrc: PLACEHOLDER_IMG, imageSrcBig: PLACEHOLDER_IMG, rating: 4.0, userRatingsTotal: 256, openingHours: 'Open today 9:00 – 20:00', address: 'HaHashmonaim 10, Tel Aviv', phone: '+972-3-5551234', website: 'https://ksp.co.il' },
];

function getGreetingKey(): 'greetingMorning' | 'greetingAfternoon' | 'greetingEvening' {
  const h = new Date().getHours();
  if (h < 12) return 'greetingMorning';
  if (h < 17) return 'greetingAfternoon';
  return 'greetingEvening';
}

export default function Index({
  businesses = [],
}: {
  businesses: BusinessType[];
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const { userData, setUserData } = useUserDataContext();
  const recentSearches = userData.recentSearches ?? [];
  const recentSearchesLoading = userData.recentSearchesLoading ?? false;
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef('');
  const [searchResults, setSearchResults] = useState<AiSearchResponse | null>(null);
  const [placesResults, setPlacesResults] = useState<GooglePlace[] | null>(null);
  const [placesSuggestions, setPlacesSuggestions] = useState<GooglePlace[]>([]);
  const [placesSuggestionsLoading, setPlacesSuggestionsLoading] = useState(false);
  /** Cache of last suggestions by query so runSearch can reuse and avoid duplicate places-search call. */
  const suggestionsCacheRef = useRef<{ query: string; places: GooglePlace[] } | null>(null);
  /** When runSearch runs (e.g. user selects from dropdown), skip the next suggestions effect for this query to avoid double places-search. */
  const runSearchQueryRef = useRef<string | null>(null);
  const runSearchTimeRef = useRef<number>(0);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [activeBusiness, setActiveBusiness] = useState<BusinessType | undefined>();
  const [dealsByBusiness, setDealsByBusiness] = useState<DealDocument[]>([]);
  const displayName = session?.user?.name?.trim();
  const greetingKey = getGreetingKey();
  const greetingReady = sessionStatus === 'authenticated' && !!displayName;
  const showGreetingSkeleton = sessionStatus === 'loading' || (sessionStatus === 'authenticated' && !displayName);

  const allBusinesses = useMemo(() => {
    const list = [...MOCK_BUSINESSES, ...(businesses ?? [])];
    return list.map((b) => ({
      ...b,
      rating: b.rating ?? 4.0,
      userRatingsTotal: b.userRatingsTotal ?? 0,
      openingHours: b.openingHours ?? '—',
    }));
  }, [businesses]);

  const recentSearchesEnriched = useMemo(
    () => recentSearches.map((r) => allBusinesses.find((b) => b._id === r._id) ?? r),
    [recentSearches, allBusinesses]
  );

  /** Convert a Google Place to a Business-like object so the Business modal can show its details. */
  const placeToBusiness = (place: GooglePlace): BusinessType => {
    const photoUrl = place.photoName
      ? `/api/place-photo?name=${encodeURIComponent(place.photoName)}`
      : '';
    return {
      _id: `place_${place.placeId}`,
      name: place.name,
      imageSrc: photoUrl,
      imageSrcBig: photoUrl,
      address: place.address,
      phone: place.phone,
      rating: place.rating,
      userRatingsTotal: place.userRatingsTotal,
      openingHours: place.openingHours,
      openingHoursWeekdays: place.openingHoursWeekdays,
    };
  };

  const handleActivePlace = (place: GooglePlace) => {
    const asBusiness = placeToBusiness(place);
    setActiveBusiness(asBusiness);
    setDealsByBusiness([]);
    setUserData((prev) => ({
      ...prev,
      recentSearches: [asBusiness, ...(prev.recentSearches ?? []).filter((b) => b._id !== asBusiness._id)].slice(0, 10),
    }));
    if (session?.user?.email) {
      const photoUrl = place.photoName ? `/api/place-photo?name=${encodeURIComponent(place.photoName)}` : '';
      addTermToRecentSearch({
        userMail: session.user.email,
        businessId: place.placeId,
        name: place.name,
        imageSrc: photoUrl,
        imageSrcBig: photoUrl,
        address: place.address,
        rating: place.rating,
        userRatingsTotal: place.userRatingsTotal,
        openingHours: place.openingHours,
        openingHoursWeekdays: place.openingHoursWeekdays,
        phone: place.phone,
      });
    }
  };

  const handleActiveBusiness = async (business: BusinessType) => {
    const enriched = allBusinesses.find((b) => b._id === business._id) ?? business;
    setActiveBusiness(enriched);
    setUserData((prev) => {
      const rest = (prev.recentSearches ?? []).filter((b) => b._id !== business._id);
      return { ...prev, recentSearches: [...rest, enriched].slice(-10) };
    });
    if (session?.user?.email) {
      addTermToRecentSearch({
        userMail: session.user.email,
        businessId: enriched._id,
        name: enriched.name,
        imageSrc: enriched.imageSrc,
        imageSrcBig: enriched.imageSrcBig,
        address: enriched.address,
        rating: enriched.rating,
        userRatingsTotal: enriched.userRatingsTotal,
        openingHours: enriched.openingHours,
        openingHoursWeekdays: enriched.openingHoursWeekdays,
        phone: enriched.phone,
        website: enriched.website,
      });
    }
    try {
      const res = await getDealsByBusiness({ businessId: enriched._id });
      setDealsByBusiness(res?.data ?? []);
    } catch {
      setDealsByBusiness([]);
    }
  };

  const runSearch = async (query: string) => {
    const q = (query || searchInputRef.current || searchQuery || '').trim();
    if (!q) return;
    const qLower = q.toLowerCase();
    runSearchQueryRef.current = qLower;
    runSearchTimeRef.current = Date.now();
    setSearchQuery(q);
    searchInputRef.current = q;
    setSearchLoading(true);
    setSearchError(null);
    setSearchResults(null);
    setPlacesResults(null);
    const fallbackStores = allBusinesses.filter((b) => b.name.toLowerCase().includes(qLower)).slice(0, 10);
    const cached = suggestionsCacheRef.current?.query === qLower && (suggestionsCacheRef.current.places?.length ?? 0) > 0
      ? suggestionsCacheRef.current.places
      : null;
    try {
      const [places, aiRes] = await Promise.all([
        cached ? Promise.resolve(cached) : placesSearch(qLower).catch(() => [] as GooglePlace[]),
        aiSearch(q).catch(() => null),
      ]);
      setPlacesResults(places.length > 0 ? places.slice(0, 20) : null);
      if (aiRes) {
        const useFallbackStores = !aiRes.stores?.length;
        const stores = (aiRes.stores?.length ? aiRes.stores : fallbackStores) as typeof allBusinesses;
        const bestCombos = useFallbackStores && stores.length > 0 ? aiRes.bestCombos : aiRes.bestCombos;
        setSearchResults({ ...aiRes, stores, bestCombos, query: aiRes.query ?? q });
      } else {
        setSearchResults({
          query: q,
          stores: fallbackStores,
          dealsByStore: {},
          userCards: [],
          bestCombos: { summary: 'Select a store above to see your cards, discounts and credits.', items: [] },
        });
      }
    } catch {
      setSearchError('Search failed');
      setPlacesResults(null);
      setSearchResults({
        query: q,
        stores: fallbackStores,
        dealsByStore: {},
        userCards: [],
        bestCombos: { summary: 'Select a store above to see your cards, discounts and credits.', items: [] },
      });
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    const hasResults = (searchResults?.stores?.length ?? 0) > 0 || (placesResults?.length ?? 0) > 0;
    if (hasResults && typeof document !== 'undefined') {
      document.getElementById('search-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [searchResults, placesResults]);

  const handleAiSearch = () => {
    const q = (searchInputRef.current || searchQuery).trim();
    if (q) runSearch(q);
  };

  /** Dropdown shows only search results (Places), not recent stores. When query < 2 chars, show nothing. */
  const searchOptions = useMemo(() => {
    if (searchQuery.trim().length < 2) return [];
    return placesSuggestions;
  }, [searchQuery, placesSuggestions]);

  const PLACES_SUGGESTIONS_DEBOUNCE_MS = 400;

  useEffect(() => {
    const q = searchQuery.trim();
    const qLower = q.toLowerCase();
    if (q.length < 2) {
      setPlacesSuggestions([]);
      suggestionsCacheRef.current = null;
      setPlacesSuggestionsLoading(false);
      return;
    }
    if (runSearchQueryRef.current === qLower && Date.now() - runSearchTimeRef.current < 3000) {
      setPlacesSuggestionsLoading(false);
      return;
    }
    setPlacesSuggestionsLoading(true);
    const t = setTimeout(() => {
      placesSearch(qLower)
        .then((places) => {
          const limited = places.slice(0, 20);
          setPlacesSuggestions(limited);
          suggestionsCacheRef.current = { query: qLower, places: limited };
          setPlacesSuggestionsLoading(false);
        })
        .catch(() => {
          setPlacesSuggestions([]);
          suggestionsCacheRef.current = null;
          setPlacesSuggestionsLoading(false);
        });
    }, PLACES_SUGGESTIONS_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const baseUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Piggy',
    description: 'Piggy - Find perks. Search a store for card discounts and credits.',
    url: baseUrl,
    applicationCategory: 'FinanceApplication',
  };

  return (
    <>
      <Head>
        <title>Piggy - Find perks | FID</title>
        <meta name="description" content="Search a store for card discounts and credits. Piggy - Find perks." />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>
      <div className="m-auto max-w-4xl w-full min-w-0 px-4 box-border pb-[max(3rem,env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)] animate-fade-in-up overflow-x-hidden">
      {/* Hero + Search: solid neutral background for a business look */}
      <section className="sticky top-0 z-10 -mx-4 px-4 pt-6 pb-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 scroll-mt-4">
        <div className="text-center min-h-[3.5rem] flex flex-col justify-end">
          {greetingReady ? (
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-2">
              {t(`home.${greetingKey}`, { name: displayName })}
            </p>
          ) : showGreetingSkeleton ? (
            <div className="flex justify-center mb-2" aria-hidden>
              <div className="h-6 w-64 rounded bg-gray-200 dark:bg-gray-600 animate-pulse" title="Loading greeting" />
            </div>
          ) : (
            <p className="text-lg invisible mb-2 select-none" aria-hidden="true">.</p>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white text-center mb-6">
          {t('home.heroTitle')}
        </h1>

        <div className="max-w-2xl mx-auto">
          <label htmlFor="home-search" className="sr-only">
            {t('home.search.text')}
          </label>
          <div className="rounded-2xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm transition-shadow hover:shadow-md py-1.5 px-1">
            <Autocomplete
              id="home-search"
              freeSolo
              blurOnSelect
              inputValue={searchQuery}
              onInputChange={(_, value) => {
                setSearchQuery(value ?? '');
                searchInputRef.current = value ?? '';
              }}
              options={searchOptions}
              filterOptions={(options) => options}
              getOptionLabel={(option) => (typeof option === 'string' ? option : option.name)}
              onChange={(_, value) => {
                if (!value || typeof value === 'string') return;
                if ('placeId' in value && typeof (value as GooglePlace).placeId === 'string') {
                  runSearch((value as GooglePlace).name);
                } else {
                  handleActiveBusiness(value as unknown as BusinessType);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAiSearch();
              }}
              openOnFocus={false}
              open={searchQuery.trim().length >= 2 && (placesSuggestionsLoading || searchOptions.length > 0)}
              loading={placesSuggestionsLoading}
              loadingText={<span className="text-gray-700 dark:text-gray-200 py-2">{t('home.searching')}</span>}
              noOptionsText={<span className="text-gray-500 dark:text-gray-400 py-3 px-2 text-sm">{searchQuery.trim().length < 2 ? t('home.searchDropdownHint') : t('home.noPlacesFound')}</span>}
              PaperComponent={({ ...paperProps }) => (
                <Paper
                  {...paperProps}
                  elevation={8}
                  className={`${paperProps.className ?? ''} mt-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-xl overflow-hidden`}
                />
              )}
              renderOption={(props, option) => (
                <li
                  {...props}
                  key={'placeId' in option ? (option as GooglePlace).placeId : (option as BusinessType)._id}
                  className={`${(props as { className?: string }).className ?? ''} py-3 px-4 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700/70 active:bg-gray-100 dark:active:bg-gray-700`}
                >
                  {option.name}
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder={t('home.search.text')}
                  variant="outlined"
                  hiddenLabel
                  inputProps={{
                    ...params.inputProps,
                    'aria-label': t('home.search.text'),
                    className: 'text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 text-base py-3',
                    style: { paddingLeft: 32 },
                  }}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-transparent text-gray-500 dark:text-gray-400 shrink-0 ml-4">
                          <SearchIcon sx={{ fontSize: 20 }} />
                        </span>
                        {params.InputProps.startAdornment}
                      </>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 14,
                      backgroundColor: 'transparent',
                      paddingLeft: 0,
                      paddingRight: 20,
                      height: 52,
                      minHeight: 52,
                      '& fieldset': { border: 'none', padding: 0 },
                      '&.Mui-focused fieldset': { border: 'none', boxShadow: 'none' },
                      '&:hover fieldset': { border: 'none' },
                      '&.Mui-focused': { outline: 'none' },
                      '& .MuiOutlinedInput-notchedOutline': { display: 'none' },
                    },
                    '& .MuiOutlinedInput-input': {
                      paddingRight: 16,
                      outline: 'none',
                    },
                    '& .MuiOutlinedInput-input:focus': {
                      outline: 'none',
                    },
                    '& .MuiOutlinedInput-input::placeholder': {
                      opacity: 1,
                    },
                  }}
                />
              )}
            />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-3 text-center">
            {t('home.trySearchHint')}
          </p>
        </div>
      </section>

      {searchError && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
          {searchError}
        </div>
      )}

      {/* Skeleton while search is loading */}
      {searchLoading && (
        <section id="search-results" className="mb-8" aria-busy="true" aria-label={t('home.searching')}>
          <div className="h-6 w-48 rounded bg-gray-200 dark:bg-gray-700 animate-pulse mb-3" />
          <ul className="space-y-3" role="list">
            {[1, 2, 3, 4, 5].map((i) => (
              <li key={i}>
                <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-2/3 mb-2" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-full max-w-md" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24 mt-2" />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Best way to shop (from AI search) */}
      {searchResults && searchResults.bestCombos.items.length > 0 && (
        <section className="mb-8">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
            <DiscountIcon /> {t('home.bestWayToShop')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            {searchResults.bestCombos.summary}
          </p>
          <ul className="space-y-3">
            {searchResults.bestCombos.items.map((combo: BestComboItem, i: number) => (
              <li
                key={`${combo.store._id}-${combo.deal.description?.slice(0, 20)}-${i}`}
                className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-100">{combo.store.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{combo.deal.description}</p>
                  {combo.reason && (
                    <p className="text-xs text-cyan-600 dark:text-cyan-400 mt-1">{combo.reason}</p>
                  )}
                </div>
                <a
                  href={combo.deal.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium transition-transform duration-150 active:scale-95"
                >
                  {t('home.useDeal')}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Message when no combos but we have results */}
      {searchResults && searchResults.bestCombos.items.length === 0 && searchResults.stores.length > 0 && (
        <p className="mb-4 text-gray-600 dark:text-gray-400 text-sm">
          {searchResults.bestCombos.summary}
        </p>
      )}

      {/* Nearby places from Google (e.g. "Coffee" → Aroma, Cafe Cafe) – click opens business details modal */}
      {placesResults && placesResults.length > 0 && (
        <section id="search-results" className="mt-6 mb-8">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
            <StoreIcon /> {t('home.nearbyPlaces', { query: searchQuery || '' })}
          </h2>
          <ul className="space-y-3" role="list">
            {placesResults.map((place) => (
              <li key={place.placeId}>
                <button
                  type="button"
                  onClick={() => handleActivePlace(place)}
                  className="w-full text-left flex items-center gap-3 p-2 sm:p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                >
                  <div className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
                    {place.photoName ? (
                      <img
                        src={`/api/place-photo?name=${encodeURIComponent(place.photoName)}`}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-lg" aria-hidden>
                        <StoreIcon fontSize="small" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{place.name}</p>
                    {place.address && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 truncate">{place.address}</p>
                    )}
                    {(place.rating != null || place.openingHours) && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        {place.rating != null && (
                          <span>{place.rating.toFixed(1)} <span className="text-[#FFD700]">★</span> {place.userRatingsTotal != null ? `(${place.userRatingsTotal})` : ''}</span>
                        )}
                        {place.openingHours && <span className="truncate">{place.openingHours}</span>}
                      </p>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Recent searches: below search results so results are seen first */}
      <section className="transition-all duration-300 ease-out mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
          {t('home.recentSearches')}
        </h2>
        {session?.user ? (
          recentSearchesLoading ? (
            <SkeletonGrid count={6} />
          ) : recentSearchesEnriched.length > 0 ? (
            <Items
              items={recentSearchesEnriched}
              setActiveItem={(b: BusinessType) => handleActiveBusiness(b)}
            />
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500">{t('home.recentSearchesEmpty')}</p>
          )
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500">{t('home.recentSearchesSignIn')}</p>
        )}
      </section>

      {activeBusiness && (
        <Business
          handleModalStatus={() => setActiveBusiness(undefined)}
          activeBusiness={activeBusiness}
          dealsByBusiness={dealsByBusiness}
        />
      )}
      </div>
    </>
  );
}
import { authOptions } from './api/auth/[...nextauth]';

export async function getServerSideProps(context: { locale?: string; res?: unknown; req?: unknown }) {
  const session = await getServerSession(context.req as any, context.res as any, authOptions);
  const businesses = await getBusinesses();
  return {
    props: {
      ...(await serverSideTranslations(context.locale ?? 'en')),
      businesses,
      session: session ?? null,
    },
  };
}