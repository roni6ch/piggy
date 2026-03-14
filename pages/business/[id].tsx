import Head from 'next/head';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GetServerSideProps } from 'next';
import { Business as BusinessType, DealDocument, Card, Issuer, Provider, Club, CardBackground } from '@/common/types';
import { getBusinessById } from '@/common/api';
import Business from '@/common/components/business';
import { getDealsByBusiness } from '@/common/api';
import { Deals } from '@/common/types';

const PLACEHOLDER_IMG = '/assets/images/mountains.jpg';

const MOCK_CARD: Card = {
  _id: 'mock-card-max',
  name: 'Max',
  issuer: Issuer.REGULAR,
  imageSrc: '/assets/cards-icons/max.svg',
  provider: Provider.VISA,
  club: Club.MAX,
  bg: CardBackground.MAX,
};

function mockDealsFor(businessId: string): DealDocument[] {
  const exp = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);
  const now = new Date().toISOString();
  return [
    { description: '20% off your order with Max card', expirationDate: exp, createDate: now, link: 'https://example.com', cardId: MOCK_CARD, businessId },
    { description: 'Buy one get one free on selected items', expirationDate: exp, createDate: now, link: 'https://example.com', cardId: MOCK_CARD, businessId },
  ];
}

const MOCK_BUSINESSES: Record<string, BusinessType> = {
  'mock-aroma': { _id: 'mock-aroma', name: 'Aroma Coffee', imageSrc: PLACEHOLDER_IMG, imageSrcBig: PLACEHOLDER_IMG, rating: 4.2, userRatingsTotal: 120, openingHours: 'Open today 8:00 – 22:00', address: 'Dizengoff 99, Tel Aviv', phone: '+972-3-1234567', website: 'https://aroma.co.il' },
  'mock-cafe': { _id: 'mock-cafe', name: 'Café Café', imageSrc: PLACEHOLDER_IMG, imageSrcBig: PLACEHOLDER_IMG, rating: 4.5, userRatingsTotal: 89, openingHours: 'Open today 7:00 – 23:00', address: 'Ibn Gabirol 30, Tel Aviv', phone: '+972-3-7654321', website: 'https://cafecafe.co.il' },
  'mock-ksp': { _id: 'mock-ksp', name: 'KSP', imageSrc: PLACEHOLDER_IMG, imageSrcBig: PLACEHOLDER_IMG, rating: 4.0, userRatingsTotal: 256, openingHours: 'Open today 9:00 – 20:00', address: 'HaHashmonaim 10, Tel Aviv', phone: '+972-3-5551234', website: 'https://ksp.co.il' },
};

const MOCK_DEALS: Record<string, DealDocument[]> = {
  'mock-aroma': mockDealsFor('mock-aroma'),
  'mock-cafe': mockDealsFor('mock-cafe'),
  'mock-ksp': mockDealsFor('mock-ksp'),
};

export default function BusinessPage({
  business,
  dealsByBusiness = [],
}: {
  business: BusinessType | null;
  dealsByBusiness?: DealDocument[];
}) {
  const router = useRouter();

  if (!business) {
    return (
      <>
        <Head><title>Business not found | FID</title></Head>
        <div className="p-8 text-center text-gray-600 dark:text-gray-400">
          <p>Business not found.</p>
          <button type="button" onClick={() => router.push('/')} className="mt-4 text-cyan-600 hover:underline">
            Back to home
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{business.name} | FID</title>
        <meta name="description" content={`Deals and credits at ${business.name}`} />
      </Head>
      <Business
        asPage
        activeBusiness={business}
        dealsByBusiness={dealsByBusiness}
      />
    </>
  );
}

function mockBusinessFromId(id: string, nameFromQuery?: string): BusinessType {
  const name =
    nameFromQuery?.trim() ||
    (id.startsWith('mock-business-')
      ? `${id.replace(/^mock-business-/, '').replace(/-/g, ' ').replace(/\s+\d+$/, '')}`
      : id);
  return {
    _id: id,
    name: name || 'Store',
    imageSrc: PLACEHOLDER_IMG,
    imageSrcBig: PLACEHOLDER_IMG,
    rating: 4.0,
    userRatingsTotal: 0,
    openingHours: 'Hours may vary',
  };
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const id = context.params?.id as string;
  const locale = context.locale ?? 'en';
  if (!id) {
    return { props: { business: null, dealsByBusiness: [] } };
  }
  const mock = MOCK_BUSINESSES[id];
  if (mock) {
    return {
      props: {
        ...(await serverSideTranslations(locale)),
        business: mock,
        dealsByBusiness: MOCK_DEALS[id] ?? [],
      },
    };
  }
  if (id.startsWith('mock-business-')) {
    const nameFromQuery = typeof context.query.name === 'string' ? context.query.name : undefined;
    const business = mockBusinessFromId(id, nameFromQuery);
    return {
      props: {
        ...(await serverSideTranslations(locale)),
        business,
        dealsByBusiness: mockDealsFor(id),
      },
    };
  }
  let business = await getBusinessById(id);
  let dealsByBusiness: DealDocument[] = [];
  if (business) {
    try {
      const res: Deals = await getDealsByBusiness({ businessId: business._id });
      dealsByBusiness = res?.data ?? [];
    } catch {
      // ignore
    }
    // Ensure seed-style businesses (e.g. Sample Store A/B/C) always have display fields
    business = enrichBusinessDisplay(business);
  }
  return {
    props: {
      ...(await serverSideTranslations(locale)),
      business,
      dealsByBusiness,
    },
  };
};

/** Fill missing optional fields so list/detail always show opening hours etc. */
function enrichBusinessDisplay(b: BusinessType): BusinessType {
  const name = (b.name || '').toLowerCase();
  const isSampleStore =
    name.includes('sample store a') ||
    name.includes('sample store b') ||
    name.includes('sample store c');
  const defaults: Partial<BusinessType> = isSampleStore
    ? {
        openingHours: b.openingHours ?? 'Open today 9:00 – 21:00',
        rating: b.rating ?? 4.2,
        userRatingsTotal: b.userRatingsTotal ?? 45,
        address: b.address ?? '123 Main St',
        phone: b.phone ?? '+972-2-1234567',
        website: b.website ?? 'https://example.com',
      }
    : {
        openingHours: b.openingHours ?? 'Hours may vary',
        rating: b.rating ?? 4.0,
        userRatingsTotal: b.userRatingsTotal ?? 0,
      };
  return { ...b, ...defaults };
}
