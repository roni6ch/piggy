import Head from 'next/head';
import Link from 'next/link';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { Routes } from '@/common/types';

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <>
      <Head>
        <title>Page not found | FID</title>
        <meta name="robots" content="noindex, follow" />
      </Head>
      <main className="flex min-h-[60vh] flex-col items-center justify-center px-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('404.title', { defaultValue: 'Page not found' })}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {t('404.description', { defaultValue: 'The page you are looking for does not exist.' })}
        </p>
        <Link
          href={Routes.HOME}
          className="mt-6 rounded-lg bg-cyan-600 px-4 py-2 text-white hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        >
          {t('404.backHome', { defaultValue: 'Back to home' })}
        </Link>
      </main>
    </>
  );
}

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale)),
    },
  };
}
