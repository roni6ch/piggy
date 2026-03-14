/** Skeleton grid matching Items layout – used while cards, recent searches, or categories load. No scale-up animation on skeleton. */
export default function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-4 lg:gap-5 mt-4 sm:mt-6">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm"
          aria-hidden
        >
          <div className="w-full aspect-[4/3] bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <div className="p-3 sm:p-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
