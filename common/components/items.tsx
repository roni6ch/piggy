import { useTranslation } from 'next-i18next';
import { useState } from 'react';
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
  const usePlaceholder = !item.imageSrc || imgError;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`text-left rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-500 hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 min-h-[44px] ${noEnterAnimation ? '' : 'scale-up-center-anima'}`}
      style={noEnterAnimation ? undefined : { animationDelay: `${animationDelay}s` }}
    >
      <div className="relative w-full aspect-[4/3] bg-gray-100 dark:bg-gray-700 overflow-hidden group">
        {usePlaceholder ? (
          <img
            src={PLACEHOLDER_IMAGE}
            alt=""
            className="w-full h-full object-cover"
            role="presentation"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <Image
            fill
            src={item.imageSrc}
            alt={item.name}
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            loading="lazy"
            onError={() => setImgError(true)}
            unoptimized={item.imageSrc.startsWith('http') || item.imageSrc.startsWith('data:')}
          />
        )}
      </div>
      <div className="p-3 sm:p-4 bg-white dark:bg-gray-800">
        <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm sm:text-base">
          {label}
        </span>
        {'imageSrcBig' in item && (
          <>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              ★ {'rating' in item && item.rating != null ? Number(item.rating).toFixed(1) : '—'}
              {'userRatingsTotal' in item && item.userRatingsTotal != null && item.userRatingsTotal > 0 && (
                <span className="text-gray-500 dark:text-gray-400 ml-1">({item.userRatingsTotal})</span>
              )}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
              {'openingHours' in item && item.openingHours ? item.openingHours : '—'}
            </p>
            {'address' in item && item.address && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                {item.address}
              </p>
            )}
          </>
        )}
      </div>
    </button>
  );
}
