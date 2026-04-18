import Head from 'next/head'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { getServerSession } from 'next-auth'
import { UploadVoucherShell } from '@/common/components/upload-voucher-shell'
import { authOptions } from './api/auth/[...nextauth]'

export default function UploadVoucherPage() {
  const baseUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Piggy — Upload Voucher',
    description: 'Upload and manage your coupons, vouchers, store credits, and gift cards in one place.',
    url: baseUrl,
    applicationCategory: 'FinanceApplication',
  }

  return (
    <>
      <Head>
        <title>Piggy — Upload Voucher</title>
        <meta
          name="description"
          content="Upload coupons, vouchers, store credits, and gift cards. Keep every deal in one secure wallet."
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </Head>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&family=Inter:wght@400;500;600;700&display=swap');

        .input-focus-glow:focus {
          outline: none;
          border-color: #ff89ad;
          box-shadow: 0 0 0 1px #ff89ad, 0 0 12px rgba(255, 137, 173, 0.2);
        }
      `}</style>

      <UploadVoucherShell />
    </>
  )
}

UploadVoucherPage.getCleanLayout = function PageLayout(page: React.ReactNode) {
  return <>{page}</>
}

export async function getServerSideProps(context: { locale?: string; res?: unknown; req?: unknown }) {
  const session = await getServerSession(context.req as never, context.res as never, authOptions)
  return {
    props: {
      ...(await serverSideTranslations(context.locale ?? 'en')),
      session: session ?? null,
    },
  }
}
