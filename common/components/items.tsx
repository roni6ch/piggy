import { useTranslation } from 'next-i18next';
import { useState, useEffect } from 'react';
import {
  Business as BusinessType,
  Category as CategoryType,
} from '../types';
import Image from 'next/image';

const PLACEHOLDER_IMAGE = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="280" viewBox="0 0 400 280"><rect fill="%239ca3af" width="400" height="280"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%236b7280" font-family="sans-serif" font-size="18">No image</text></svg>'
);

function getItemLabel(item: BusinessType | CategoryType, t: (key: string, options?: { defaultValue?: string }) => string): string {
  const key = item.name.toLowerCase().replace(/\s+/g, '-');
  const translated = t(`item.name-${key}`, { defaultValue: item.name });
  return translated || item.name;
}

export default function Items<T extends BusinessType | CategoryType>({
  items,
  setActiveItem,
  noEnterAnimation,
}: {
  items: T[];
  setActiveItem: (item: T) => void;
  noEnterAnimation?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-4 lg:gap-5 mt-4 sm:mt-6">
      {items?.map((item: T, index: number) => (
        <ItemCard
          key={item._id}
          item={item}
          label={getItemLabel(item, t)}
          onSelect={() => setActiveItem(item)}
          animationDelay={noEnterAnimation ? 0 : index * 0.05}
          noEnterAnimation={noEnterAnimation}
        />
      ))}
    </div>
  );
}

function ItemCard<T extends BusinessType | CategoryType>({
  item,
  label,
  onSelect,
  animationDelay = 0,
  noEnterAnimation,
}: {
  item: T;
  label: string;
  onSelect: () => void;
  animationDelay?: number;
  noEnterAnimation?: boolean;
}) {
  const [imgError, setImgError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  useEffect(() => {
    setImageLoaded(false);
    setImgError(false);
  }, [item._id, item.imageSrc]);
  const usePlaceholder = !item.imageSrc || imgError;
  const isProxyOrExternal = item.imageSrc.startsWith('/api/') || item.imageSrc.startsWith('http') || item.imageSrc.startsWith('data:');
  const showImage = !usePlaceholder;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`text-left rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-500 hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 min-h-[44px] ${noEnterAnimation ? '' : 'scale-up-center-anima'}`}
      style={noEnterAnimation ? undefined : { animationDelay: `${animationDelay}s` }}
    >
      <div className="relative w-full aspect-[4/3] bg-gray-100 dark:bg-gray-700 overflow-hidden group">
        {showImage && !imageLoaded && (
          <div className="absolute inset-0 bg-gray-200 dark:bg-gray-600 animate-pulse" aria-hidden />
        )}
        {usePlaceholder ? (
          <img
            src={PLACEHOLDER_IMAGE}
            alt=""
            className="w-full h-full object-cover"
            role="presentation"
            loading="lazy"
            decoding="async"
          />
        ) : isProxyOrExternal ? (
          <img
            src={item.imageSrc}
            alt={item.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImgError(true)}
          />
        ) : (
          <Image
            fill
            src={item.imageSrc}
            alt={item.name}
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImgError(true)}
          />
        )}
      </div>
      <div className="p-3 sm:p-4 bg-white dark:bg-gray-800">
        <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm sm:text-base">
          {label}
        </span>
        {!('businessIds' in item) && (() => {
          const biz = item as Partial<Pick<BusinessType, 'rating' | 'userRatingsTotal' | 'openingHours' | 'address'>>;
          return (
            <>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                ★ {biz.rating != null ? Number(biz.rating).toFixed(1) : '—'}
                {biz.userRatingsTotal != null && biz.userRatingsTotal > 0 && (
                  <span className="text-gray-500 dark:text-gray-400 ml-1">({biz.userRatingsTotal})</span>
                )}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                {biz.openingHours ?? '—'}
              </p>
              {biz.address ? (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                  {biz.address}
                </p>
              ) : null}
            </>
          );
        })()}
      </div>
    </button>
  );
}
