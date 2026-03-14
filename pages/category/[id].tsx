import dynamic from 'next/dynamic';
import Head from 'next/head';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import { Business as BusinessType, DealDocument, Routes } from '@/common/types';
import { useState, useMemo } from 'react';
import Items from '@/common/components/items';
import { getCategoryById } from '@/queries/categories/categoryQueries';
import { getDealsByBusiness } from '@/common/api';
import { GetServerSideProps } from 'next';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const Business = dynamic(() => import('@/common/components/business'), { ssr: false });

const Category = ({
  categoryName,
  categoryId,
  businesses = [],
}: {
  categoryName: string;
  categoryId: string;
  businesses: BusinessType[];
}) => {
  const { t } = useTranslation();
  const [activeBusiness, setActiveBusiness] = useState<BusinessType | undefined>();
  const [dealsByBusiness, setDealsByBusiness] = useState<DealDocument[]>([]);
  const businessesEnriched = useMemo(
    () =>
      businesses.map((b) => ({
        ...b,
        rating: b.rating ?? 4.0,
        userRatingsTotal: b.userRatingsTotal ?? 0,
        openingHours: b.openingHours ?? '—',
        address: b.address ?? '—',
        phone: b.phone ?? '—',
        website: b.website ?? '—',
      })),
    [businesses]
  );

  const handleActiveBusiness = async (business: BusinessType) => {
    setActiveBusiness(business);
    try {
      const res = await getDealsByBusiness({ businessId: business._id });
      setDealsByBusiness(res?.data ?? []);
    } catch {
      setDealsByBusiness([]);
    }
  };

  return (
    <>
      <Head>
        <title>{categoryName} | FID</title>
        <meta name="description" content={`Stores and deals in ${categoryName}. Find discounts and credits.`} />
      </Head>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto text-left">
      <nav aria-label="Breadcrumb" className="mb-4 sm:mb-6">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
          <li>
            <Link
              href={Routes.CATEGORIES}
              className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              {t('category.breadcrumb')}
            </Link>
          </li>
          <li aria-hidden className="flex items-center gap-1">
            <ChevronRightIcon sx={{ fontSize: 18 }} />
          </li>
          <li className="font-medium text-gray-800 dark:text-gray-100 truncate" aria-current="page">
            {categoryName}
          </li>
        </ol>
      </nav>
      {businesses.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 py-8">
          {t('category.noBusinesses')}
        </p>
      ) : (
        <div className="flex flex-wrap justify-start gap-4">
          <Items
            items={businessesEnriched}
            setActiveItem={(b: BusinessType) => handleActiveBusiness(b)}
          />
        </div>
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
};

export default Category;

const DEFAULT_CATEGORY_NAMES = [
  'Cinema', 'Stand Up', 'Coffee', 'Restaurants', 'Home', 'Shopping',
  'Amusement park', 'Travel', 'Sports', 'Health', 'Books', 'Electronics', 'Fashion', 'Groceries',
  'Entertainment', 'Beauty', 'Kids', 'Pets', 'Pharmacy', 'Salon', 'Gym',
];

const MOCK_STORE_NAMES = [
  'Central Branch', 'Downtown Store', 'Mall Location', 'Main Street', 'City Center', 'North Branch', 'South Branch',
  'Express Outlet', 'Premium Store', 'Local Favorite', 'Best Deal Shop', 'Quick Stop', 'Family Store', 'Mega Save',
  'Value Plus', 'Super Saver', 'Neighborhood Shop', 'Corner Store', 'Plaza Location', 'Harbor Branch',
];

/** Mock opening hours variants for variety in list. */
const MOCK_OPENING_HOURS = [
  'Open today 8:00 – 22:00',
  'Open today 9:00 – 21:00',
  'Open today 7:00 – 23:00',
  'Open today 10:00 – 20:00',
  'Closed · Opens tomorrow 9:00',
  'Open today 6:00 – 24:00',
  'Open today 11:00 – 19:00',
  'Hours may vary',
];

/** Mock addresses for list display. */
const MOCK_ADDRESSES = [
  'Dizengoff 99, Tel Aviv',
  'Ibn Gabirol 30, Tel Aviv',
  'HaHashmonaim 10, Tel Aviv',
  'Rothschild 45, Tel Aviv',
  'Allenby 88, Tel Aviv',
  'Ben Yehuda 15, Tel Aviv',
  'King George 22, Tel Aviv',
  'Sheinkin 12, Tel Aviv',
];

function businessImageSrc(seed: string): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/400/280`;
}

function getMockBusinesses(categoryName: string, count: number): BusinessType[] {
  return MOCK_STORE_NAMES.slice(0, count).map((store, i) => {
    const name = `${store} · ${categoryName}`;
    const img = businessImageSrc(`store-${categoryName}-${i}-${store}`);
    const rating = 3.5 + (i % 5) * 0.3;
    const userRatingsTotal = 20 + (i % 10) * 15;
    return {
      _id: `mock-business-${categoryName}-${i}`,
      name,
      imageSrc: img,
      imageSrcBig: img,
      rating: Math.round(rating * 10) / 10,
      userRatingsTotal,
      openingHours: MOCK_OPENING_HOURS[i % MOCK_OPENING_HOURS.length],
      address: MOCK_ADDRESSES[i % MOCK_ADDRESSES.length],
      phone: `+972-3-${1000000 + i * 1111}`,
      website: `https://example.com/${categoryName.toLowerCase().replace(/\s+/g, '-')}-${i}`,
    };
  });
}

export const getServerSideProps: GetServerSideProps = async ({
  params,
  locale = 'en',
}) => {
  const id = (params?.id as string) ?? '';
  let categoryName = '';
  let businesses: BusinessType[] = [];

  function normalizeBusinessImage(b: { name: string; imageSrc?: string; imageSrcBig?: string }): string {
    const src = (b.imageSrc ?? b.imageSrcBig ?? '').trim();
    if (src && (src.startsWith('http://') || src.startsWith('https://'))) return src;
    return businessImageSrc(b.name.replace(/\s+/g, '-'));
  }

  if (id.startsWith('default-')) {
    const idx = parseInt(id.replace('default-', ''), 10) || 0;
    categoryName = DEFAULT_CATEGORY_NAMES[idx] ?? 'Category';
    businesses = getMockBusinesses(categoryName, 15);
  } else {
    try {
      const category = await getCategoryById(id);
      if (category) {
        categoryName = category.name;
        const ids = category.businessIds ?? [];
        if (ids.length > 0 && typeof ids[0] === 'object' && ids[0] !== null && '_id' in (ids[0] as object)) {
          const populated = ids as unknown as Array<{ _id: string; name: string; imageSrc?: string; imageSrcBig?: string; openingHours?: string; rating?: number; userRatingsTotal?: number; address?: string; phone?: string; website?: string }>;
          businesses = populated.map((b) => ({
            _id: b._id,
            name: b.name,
            imageSrc: normalizeBusinessImage(b),
            imageSrcBig: (b.imageSrcBig ?? b.imageSrc)?.startsWith('http') ? (b.imageSrcBig ?? b.imageSrc)! : normalizeBusinessImage(b),
            openingHours: b.openingHours ?? '—',
            rating: b.rating ?? 4.0,
            userRatingsTotal: b.userRatingsTotal ?? 0,
            address: b.address ?? '—',
            phone: b.phone ?? '—',
            website: b.website ?? '—',
          }));
        }
        if (businesses.length === 0) {
          businesses = getMockBusinesses(categoryName, 15);
        }
      } else {
        categoryName = 'Category';
        businesses = getMockBusinesses(categoryName, 15);
      }
    } catch (e) {
      console.error('Category fetch failed:', e);
      categoryName = 'Category';
      businesses = getMockBusinesses(categoryName, 15);
    }
  }

  return {
    props: {
      ...(await serverSideTranslations(locale)),
      categoryName,
      categoryId: id,
      businesses,
    },
  };
};
