import dynamic from 'next/dynamic';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useState, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { Business as BusinessType, RecentSearch, AiSearchResponse, BestComboItem, Card as CardType, Issuer, Provider, Club, CardBackground, DealDocument } from '@/common/types';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { useSession } from 'next-auth/react';
import Items from '@/common/components/items';
import { Routes } from '@/common/types';

import SkeletonGrid from '@/common/components/skeleton-grid';
import { useUserDataContext } from '@/common/context/userContext';
import { addTermToRecentSearch, aiSearch, getBusinesses, getRecentSearches, getDealsByBusiness } from '@/common/api';
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

  const handleActiveBusiness = async (business: BusinessType) => {
    const enriched = allBusinesses.find((b) => b._id === business._id) ?? business;
    setActiveBusiness(enriched);
    setUserData((prev) => ({
      ...prev,
      recentSearches: [enriched, ...(prev.recentSearches ?? []).filter((b) => b._id !== business._id)].slice(0, 12),
    }));
    if (session?.user?.email) {
      addTermToRecentSearch({
        userMail: session.user.email,
        businessId: business._id,
        name: business.name,
        imageSrc: business.imageSrc,
        imageSrcBig: business.imageSrcBig,
      }).then(async () => {
        const res = await getRecentSearches({ userMail: session.user!.email! });
        const terms = res.map((r: RecentSearch) => r.term).filter((term): term is BusinessType => term != null && typeof term === 'object' && '_id' in term && 'name' in term);
        setUserData((prev) => ({ ...prev, recentSearches: terms }));
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
    setSearchQuery(q);
    searchInputRef.current = q;
    setSearchLoading(true);
    setSearchError(null);
    setSearchResults(null);
    const fallbackStores = allBusinesses.filter((b) => b.name.toLowerCase().includes(q.toLowerCase())).slice(0, 10);
    try {
      const res = await aiSearch(q);
      const stores = (res.stores?.length ? res.stores : fallbackStores) as typeof allBusinesses;
      setSearchResults({ ...res, stores, query: res.query ?? q });
    } catch {
      setSearchError('Search failed');
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
    if (searchResults?.stores?.length && typeof document !== 'undefined') {
      document.getElementById('search-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [searchResults]);

  const handleAiSearch = () => {
    const q = (searchInputRef.current || searchQuery).trim();
    if (q) runSearch(q);
  };

  const storeOptions = useMemo(() => {
    if (!searchQuery.trim()) return allBusinesses.slice(0, 3);
    const q = searchQuery.trim().toLowerCase();
    return allBusinesses.filter((b) => b.name.toLowerCase().includes(q)).slice(0, 10);
  }, [searchQuery, allBusinesses]);

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
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white text-center mb-4">
          {t('home.heroTitle')}
        </h1>

        <div className="max-w-2xl mx-auto">
          <div className="relative w-full">
            <Autocomplete
              freeSolo
              blurOnSelect
              inputValue={searchQuery}
              onInputChange={(_, value) => {
                setSearchQuery(value ?? '');
                searchInputRef.current = value ?? '';
              }}
              options={storeOptions}
              filterOptions={(options) => options}
              getOptionLabel={(option) => (typeof option === 'string' ? option : option.name)}
              onChange={(_, value) => {
                if (value && typeof value !== 'string') {
                  handleActiveBusiness(value);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAiSearch();
              }}
              openOnFocus
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder={t('home.search.text')}
                  variant="outlined"
                  inputProps={{
                    ...params.inputProps,
                    className: 'text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 text-base',
                  }}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <SearchIcon className="text-gray-400 mr-2" fontSize="medium" />
                        {params.InputProps.startAdornment}
                      </>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 8,
                      backgroundColor: '#fff',
                      height: 48,
                      minHeight: 48,
                      border: '1px solid #e2e8f0',
                      boxShadow: 'none',
                      '&:hover': { borderColor: '#cbd5e1', backgroundColor: '#fff' },
                      '&.Mui-focused': { borderColor: '#0f766e', borderWidth: 2, boxShadow: '0 0 0 1px #0f766e' },
                    },
                    '& .MuiOutlinedInput-input': {
                      color: 'var(--search-color, #111827)',
                      py: 0,
                    },
                    '& .MuiOutlinedInput-input::placeholder': {
                      opacity: 1,
                      color: 'var(--search-placeholder, #6b7280)',
                    },
                  }}
                />
              )}
            />
          </div>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-xs mt-3 text-center">
          {t('home.trySearchHint')}
        </p>
      </section>

      {/* Recent searches: businesses the user clicked, below the search */}
      <section className="transition-all duration-300 ease-out">
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
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
        </div>
      </section>

      {searchError && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
          {searchError}
        </div>
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

      {/* Matched stores from AI search */}
      {searchResults && searchResults.stores.length > 0 && (
        <section id="search-results" className="mb-8">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
            <StoreIcon /> {t('home.storesMatching', { query: searchResults.query })}
          </h2>
          <Items
            items={searchResults.stores}
            setActiveItem={(b: BusinessType) => handleActiveBusiness(b)}
          />
        </section>
      )}
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
export async function getStaticProps({ locale }: { locale: string }) {
  const businesses = await getBusinesses();
  return {
    props: {
      ...(await serverSideTranslations(locale)),
      businesses,
    },
  };
}
