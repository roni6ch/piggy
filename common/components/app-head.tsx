import Head from 'next/head';
import { useRouter } from 'next/router';

const DEFAULT_TITLE = 'FID';
const DEFAULT_DESCRIPTION =
  'Find your best deals. Search stores to see card discounts, coupons and credits in one place.';

const LOCALES = ['en', 'he', 'ru', 'ar'] as const;

type AppHeadProps = {
  title?: string;
  description?: string;
  ogImage?: string;
};

function getBaseUrl(): string {
  if (typeof window !== 'undefined') return window.location.origin;
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
}

const AppHead = ({ title = DEFAULT_TITLE, description = DEFAULT_DESCRIPTION, ogImage }: AppHeadProps) => {
  const router = useRouter();
  const baseUrl = getBaseUrl();
  const path = router.asPath || '/';
  const canonicalUrl = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`.replace(/\?.*$/, '');
  const locale = (router.locale || 'en') as string;

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="robots" content="index, follow" />
      <meta name="theme-color" content="#0ea5e9" media="(prefers-color-scheme: light)" />
      <meta name="theme-color" content="#0f172a" media="(prefers-color-scheme: dark)" />
      <link rel="canonical" href={canonicalUrl} />
      <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <link rel="manifest" href="/manifest.json" />
      {LOCALES.map((loc) => (
        <link
          key={loc}
          rel="alternate"
          hrefLang={loc}
          href={`${baseUrl}${loc === 'en' ? path : `/${loc}${path}`}`}
        />
      ))}
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:locale" content={locale} />
      {ogImage && <meta property="og:image" content={ogImage.startsWith('http') ? ogImage : `${baseUrl}${ogImage}`} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </Head>
  );
};

export default AppHead;
