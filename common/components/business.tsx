import { forwardRef } from 'react';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { Business as BusinessType, Card as CardType, DealDocument, StoreDeal } from '@/common/types';
import Image from 'next/image';
import Dialog from '@mui/material/Dialog';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import Slide from '@mui/material/Slide';
import { TransitionProps } from '@mui/material/transitions';
import { RadioGroup } from '@headlessui/react';
import { useUserDataContext } from '../context/userContext';
import type { UserCoupon } from '@/common/api';
import Card from '@/common/components/card';
import { Routes } from '@/common/types';

/** Match user coupon store to selected business (e.g. "Aroma" ↔ "Aroma coffee"). */
function couponMatchesBusiness(coupon: UserCoupon, businessName: string): boolean {
  const a = (coupon.storeName ?? '').trim().toLowerCase();
  const b = (businessName ?? '').trim().toLowerCase();
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

/** Mock store deals when none provided (e.g. Buy 1 get 1, 30% off). */
function getMockStoreDeals(storeName: string, storeId: string): StoreDeal[] {
  const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return [
    { _id: 'store-deal-1', description: 'Buy 1 get 1 free on selected items', endDate, storeId, storeName },
    { _id: 'store-deal-2', description: '30% off until end of month', endDate, storeId, storeName },
  ];
}

const Business = ({
  handleModalStatus,
  activeBusiness,
  dealsByBusiness,
  storeDeals,
  asPage = false,
}: {
  handleModalStatus?: Function;
  activeBusiness?: BusinessType;
  dealsByBusiness?: DealDocument[];
  storeDeals?: StoreDeal[];
  asPage?: boolean;
}) => {
  const { t } = useTranslation();
  const { userData } = useUserDataContext();
  const router = useRouter();

  const handleClose = () => {
    if (asPage) router.push(Routes.HOME);
    else handleModalStatus?.(false);
  };

  const storeDealsToShow = (storeDeals && storeDeals.length > 0)
    ? storeDeals
    : (activeBusiness ? getMockStoreDeals(activeBusiness.name, activeBusiness._id) : []);

  const Header = () => (
    <AppBar position="sticky" className="bg-white dark:bg-gray-900 shadow-sm">
      <Toolbar className="min-h-[56px]">
        <IconButton edge="start" onClick={handleClose} aria-label={t('business.close')} className="text-gray-700 dark:text-gray-300 mr-2" size="large">
          {asPage ? <ArrowBackIcon /> : <CloseIcon />}
        </IconButton>
        <Typography className="text-gray-900 dark:text-gray-100 font-semibold" variant="h6" component="div">
          {activeBusiness?.name}
        </Typography>
      </Toolbar>
    </AppBar>
  );

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('en-US').format(new Date(date));
  };

  const userCoupons = (activeBusiness && (userData.coupons ?? []).filter((c) => couponMatchesBusiness(c, activeBusiness.name))) ?? [];
  const mockCoupons: UserCoupon[] = activeBusiness
    ? [
        { _id: 'mock-coupon-1', storeName: activeBusiness.name, amount: '10% off', endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), couponCode: 'WELCOME10', createdAt: new Date().toISOString() },
        { _id: 'mock-coupon-2', storeName: activeBusiness.name, amount: 'Free shipping', endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), couponCode: 'SHIPFREE', createdAt: new Date().toISOString() },
      ]
    : [];
  const couponsForStore = userCoupons.length > 0 ? userCoupons : mockCoupons;

  const mapsUrl = activeBusiness?.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeBusiness.address)}`
    : '';

  const content = (
    <>
      <Header />
      <div className="flex flex-col min-h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
          {/* Fixed-height image: no scroll-driven animation, so cards below don't re-render or flash */}
          <div className="relative w-full h-[200px] sm:h-[240px] md:h-[260px] bg-gray-200 dark:bg-gray-800 shrink-0">
            {activeBusiness?.imageSrcBig ? (
              <Image
                fill
                src={activeBusiness.imageSrcBig}
                alt={activeBusiness.name}
                className="object-cover"
                sizes="100vw"
                unoptimized={activeBusiness.imageSrcBig.startsWith('http')}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500 text-lg">
                {activeBusiness?.name}
              </div>
            )}
          </div>
          <div className="p-4 sm:p-6 md:p-8">
          <div className="max-w-xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-2 text-center">
              {activeBusiness?.name}
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                ★ {activeBusiness?.rating != null ? activeBusiness.rating.toFixed(1) : t('business.noRating')}
                {activeBusiness?.userRatingsTotal != null && activeBusiness.userRatingsTotal > 0 && (
                  <span className="text-gray-500 dark:text-gray-400 font-normal ml-1">
                    ({activeBusiness.userRatingsTotal} {t('business.reviews', 'reviews')})
                  </span>
                )}
              </span>
              <span>{activeBusiness?.openingHours ?? t('business.hoursVary')}</span>
            </div>
            {(activeBusiness?.address || activeBusiness?.phone || activeBusiness?.website) && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400 mb-4 justify-center">
                {activeBusiness.address && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline inline-flex items-center gap-1"
                    aria-label={t('business.openInMaps', 'Open address in Google Maps')}
                  >
                    {activeBusiness.address}
                  </a>
                )}
                {activeBusiness.phone && (
                  <a href={`tel:${activeBusiness.phone}`} className="hover:underline">{activeBusiness.phone}</a>
                )}
                {activeBusiness.website && (
                  <a href={activeBusiness.website.startsWith('http') ? activeBusiness.website : `https://${activeBusiness.website}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {t('business.website', 'Website')}
                  </a>
                )}
              </div>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {t('business.dealsSubtitle')}
            </p>

            {storeDealsToShow.length > 0 && (
              <section className="mb-8">
                <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
                  {t('business.storeDeals', 'Store deals')}
                </h2>
                <ul className="space-y-3">
                  {storeDealsToShow.map((sd, i) => (
                    <li
                      key={sd._id ?? i}
                      className="rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3.5 shadow-sm"
                    >
                      <p className="text-sm text-gray-700 dark:text-gray-300">{sd.description}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {t('business.expires')} {formatDate(sd.endDate)}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="mb-8">
              <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
                {userCoupons.length > 0 ? t('business.yourCoupons') : t('business.availableCoupons')}
              </h2>
              <ul className="space-y-3">
                {couponsForStore.map((c) => (
                  <li
                    key={c._id}
                    className="rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3.5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      {c.amount && <span className="font-medium">{c.amount}</span>}
                      {c.endDate && <span className="text-gray-500 dark:text-gray-400">· {t('business.expires')} {formatDate(c.endDate)}</span>}
                      {c.couponCode && (
                        <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                          {c.couponCode}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
                {t('business.cardDeals')}
              </h2>
              {!dealsByBusiness?.length ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">{t('business.noDeals')}</p>
              ) : (
                <RadioGroup className="space-y-3">
                  {dealsByBusiness.map((deal: DealDocument) => (
                    <RadioGroup.Option
                      key={deal.cardId._id}
                      value={deal.cardId._id}
                      onClick={() => deal.link && open(deal.link, '_blank')}
                      className={({ checked }) =>
                        `rounded-xl border px-4 py-4 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
                          checked
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                            : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500'
                        }`
                      }
                    >
                      <div className="flex items-start gap-4">
                        <div className="shrink-0 w-[240px] h-[154px] min-w-[240px] overflow-visible">
                          <Card card={deal.cardId} key={deal.cardId._id} noAnimation />
                        </div>
                        <div className="min-w-0 flex-1 pt-1">
                          <p className="font-medium text-gray-900 dark:text-gray-100 capitalize">{deal.cardId.club}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{deal.description}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('business.expired-date')} {formatDate(deal.expirationDate)}</p>
                        </div>
                      </div>
                    </RadioGroup.Option>
                  ))}
                </RadioGroup>
              )}
            </section>
          </div>
          </div>
        </div>
      </div>
    </>
  );

  if (asPage) return <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">{content}</div>;
  return (
    <Dialog
      fullScreen
      open={!!activeBusiness}
      onClose={handleClose}
      TransitionComponent={Transition}
      PaperProps={{ className: 'bg-gray-50 dark:bg-gray-900' }}
    >
      {content}
    </Dialog>
  );
};

const Transition = forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default Business;
