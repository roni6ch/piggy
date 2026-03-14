import { forwardRef, useState, useEffect } from 'react';
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

  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    setImageLoaded(false);
  }, [activeBusiness?.imageSrcBig, activeBusiness?._id]);

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

  const rawId = activeBusiness?._id ?? '';
  const placeId = rawId.startsWith('place_') ? rawId.replace(/^place_/, '') : (rawId.startsWith('ChIJ') ? rawId : '');
  const reviewsUrl = placeId
    ? `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(placeId)}`
    : '';

  const content = (
    <>
      <Header />
      <div className="flex flex-col min-h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
          {/* Fixed-height image: skeleton until loaded, then image or name placeholder */}
          <div className="relative w-full h-[200px] sm:h-[240px] md:h-[260px] bg-gray-200 dark:bg-gray-800 shrink-0 overflow-hidden">
            {activeBusiness?.imageSrcBig ? (
              <>
                {!imageLoaded && (
                  <div className="absolute inset-0 bg-gray-300 dark:bg-gray-600 animate-pulse flex items-center justify-center" aria-hidden>
                    <div className="h-12 w-12 rounded-full border-4 border-gray-400 dark:border-gray-500 border-t-transparent dark:border-t-transparent animate-spin" />
                  </div>
                )}
                {activeBusiness.imageSrcBig.startsWith('http') ||
                activeBusiness.imageSrcBig.includes('/api/place-photo') ? (
                  <img
                    src={activeBusiness.imageSrcBig}
                    alt={activeBusiness.name}
                    className="absolute inset-0 w-full h-full object-cover"
                    onLoad={() => setImageLoaded(true)}
                  />
                ) : (
                  <Image
                    fill
                    src={activeBusiness.imageSrcBig}
                    alt={activeBusiness.name}
                    className="object-cover"
                    sizes="100vw"
                    onLoad={() => setImageLoaded(true)}
                  />
                )}
              </>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex flex-col gap-y-1.5">
                {reviewsUrl ? (
                  <a
                    href={reviewsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#FFD700] font-medium hover:underline inline-flex items-center gap-1"
                    aria-label={t('business.viewReviews', 'View reviews on Google Maps')}
                  >
                    ★ {activeBusiness?.rating != null ? activeBusiness.rating.toFixed(1) : t('business.noRating')}
                    {activeBusiness?.userRatingsTotal != null && activeBusiness.userRatingsTotal > 0 && (
                      <span className="text-gray-500 dark:text-gray-400 font-normal">
                        ({activeBusiness.userRatingsTotal} {t('business.reviews', 'reviews')})
                      </span>
                    )}
                  </a>
                ) : (
                  <span className="text-[#FFD700] font-medium">
                    ★ {activeBusiness?.rating != null ? activeBusiness.rating.toFixed(1) : t('business.noRating')}
                    {activeBusiness?.userRatingsTotal != null && activeBusiness.userRatingsTotal > 0 && (
                      <span className="text-gray-500 dark:text-gray-400 font-normal ml-1">
                        ({activeBusiness.userRatingsTotal} {t('business.reviews', 'reviews')})
                      </span>
                    )}
                  </span>
                )}
                {activeBusiness?.address && (
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
                {activeBusiness?.phone && (
                  <a href={`tel:${activeBusiness.phone}`} className="hover:underline">{activeBusiness.phone}</a>
                )}
                {activeBusiness?.website && (
                  <a href={activeBusiness.website.startsWith('http') ? activeBusiness.website : `https://${activeBusiness.website}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {t('business.website', 'Website')}
                  </a>
                )}
              </div>
              {(activeBusiness?.openingHoursWeekdays?.length || activeBusiness?.openingHours) && (
                <div className="flex flex-col gap-y-0.5">
                  {activeBusiness?.openingHoursWeekdays?.length
                    ? activeBusiness.openingHoursWeekdays.map((line, i) => (
                        <div key={i}>{line}</div>
                      ))
                    : activeBusiness?.openingHours
                      ? <span>{activeBusiness.openingHours}</span>
                      : null}
                </div>
              )}
            </div>
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
              {dealsByBusiness?.length ? (
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
              ) : (userData.cards?.length ?? 0) > 0 ? (
                <div className="space-y-3">
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">{t('cards.myCardsTitle', 'My cards')}</p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="list">
                    {userData.cards.map((c) => (
                      <li key={c._id} className="rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-3">
                        <Card card={c} noAnimation />
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">{t('business.noDeals')}</p>
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
