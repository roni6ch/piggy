import Head from 'next/head';
import { Category, Routes } from '@/common/types';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { getCategories } from '@/queries/categories/categoryQueries';
import Items from '@/common/components/items';
import SkeletonGrid from '@/common/components/skeleton-grid';

const Categories = ({ categories = [] }: { categories: Category[] }) => {
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 280);
    return () => clearTimeout(timer);
  }, []);

  const setActiveCategory = (category: Category) => {
    const url = `${Routes.CATEGORY}/${category._id}`;
    router.push(url, url);
  };

  return (
    <>
      <Head>
        <title>Categories | FID</title>
        <meta name="description" content="Browse deal categories: cinema, coffee, restaurants, shopping and more. Find stores and discounts." />
      </Head>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {loading ? (
        <SkeletonGrid count={8} />
      ) : categories.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-12">
          {t('category.noCategoriesYet')}
        </p>
      ) : (
        <Items items={categories} setActiveItem={(category: Category) => setActiveCategory(category)} noEnterAnimation />
      )}
      </div>
    </>
  );
};

export default Categories;

const DEFAULT_CATEGORY_NAMES = [
  'Cinema', 'Stand Up', 'Coffee', 'Restaurants', 'Home', 'Shopping',
  'Amusement park', 'Travel', 'Sports', 'Health', 'Books', 'Electronics', 'Fashion', 'Groceries',
  'Entertainment', 'Beauty', 'Kids', 'Pets', 'Pharmacy', 'Salon', 'Gym',
];

const IMG = (id: string) => `https://images.unsplash.com/photo-${id}?w=400&h=280&fit=crop`;

/** Curated Unsplash image IDs per category – cinema, restaurant, coffee, etc. (not generic landscapes) */
const CATEGORY_IMAGE_URLS: Record<string, string> = {
  Cinema: IMG('1489599849927-2ee91cede3ba'),           // movie theater seats
  'Stand Up': IMG('1685640477533-f4d00f9b2f50'),      // mic on stage
  Coffee: IMG('1495474472287-4d71bcdd2085'),           // coffee cup
  Restaurants: IMG('1517248135467-4c7edcad34c4'),     // restaurant
  Home: IMG('1759735218086-67f9f853ab8b'),            // living room interior
  Shopping: IMG('1441986300917-64674bd600d8'),        // retail store
  'Amusement park': IMG('1728179060846-a21e0f5cee45'), // roller coaster
  Travel: IMG('1488646953014-85cb44e25828'),          // travel / suitcase
  Sports: IMG('1461896836934-ffe607ba8211'),          // sports
  Health: IMG('1571019613454-1cb2f99b2d8b'),          // fitness
  Books: IMG('1481627834876-b7833e8f5570'),           // books
  Electronics: IMG('1498049794561-7780e7231661'),     // laptop / tech
  Fashion: IMG('1441986300917-64674bd600d8'),         // clothes store interior
  Groceries: IMG('1542838132-92c53300491e'),          // groceries
  Entertainment: IMG('1760092189986-a68d5d7295b3'),  // band concert
  Beauty: IMG('1522335789203-aabd1fc54bc9'),         // makeup products
  Kids: IMG('1503454537195-1dcabb73ffb9'),            // kids
  Pets: IMG('1587300003388-59208cc962cb'),            // pets
  Pharmacy: IMG('1587854692152-cbe660dbde88'),        // pharmacy
  Salon: IMG('1560066984-138dadb4c035'),              // hair salon
  Gym: IMG('1706029831405-619b27e3260c'),             // gym barbell
};

function categoryImageSrc(name: string): string {
  return CATEGORY_IMAGE_URLS[name] ?? IMG('1489599849927-2ee91cede3ba');
}

const DEFAULT_CATEGORIES: Category[] = DEFAULT_CATEGORY_NAMES.map((name, i) => ({
  _id: `default-${i}`,
  name,
  imageSrc: categoryImageSrc(name),
  businessIds: [],
}));

function normalizeImageSrc(c: { name: string; imageSrc: string }): string {
  if (CATEGORY_IMAGE_URLS[c.name]) return CATEGORY_IMAGE_URLS[c.name];
  const s = (c.imageSrc || '').trim();
  if (s && (s.startsWith('http://') || s.startsWith('https://'))) return s;
  return categoryImageSrc(c.name);
}

const CATEGORIES_TO_SHOW = 24;

export const getServerSideProps: GetServerSideProps = async ({ locale = 'en' }) => {
  const fromDb: Category[] = [];
  try {
    const result = await getCategories(100, 1);
    const data = result?.data ?? [];
    data.forEach((c) => {
      fromDb.push({
        _id: c._id,
        name: c.name,
        imageSrc: normalizeImageSrc(c),
        businessIds: Array.isArray(c.businessIds) ? c.businessIds : [],
      });
    });
  } catch (e) {
    console.error('Categories fetch failed:', e);
  }

  const skipNames = new Set(['Dining', 'Dinings', 'Coffee shop']);
  const byName = new Map<string, Category>();
  const merged: Category[] = [];
  for (const c of fromDb) {
    if (skipNames.has(c.name)) continue;
    if (!byName.has(c.name)) {
      byName.set(c.name, c);
      merged.push(c);
    }
  }
  for (const def of DEFAULT_CATEGORIES) {
    if (merged.length >= CATEGORIES_TO_SHOW) break;
    if (!byName.has(def.name)) {
      byName.set(def.name, def);
      merged.push(def);
    }
  }
  const categories = merged.slice(0, CATEGORIES_TO_SHOW);

  return {
    props: {
      ...(await serverSideTranslations(locale)),
      categories,
    },
  };
};
