import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import HomeIcon from '@mui/icons-material/Home';
import CategoryIcon from '@mui/icons-material/Category';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import PersonIcon from '@mui/icons-material/Person';
import { Routes } from '../types';

const TAB_MIN_HEIGHT = 44;

const tabs = [
  { name: 'Home', href: Routes.HOME, icon: HomeIcon },
  { name: 'Categories', href: Routes.CATEGORIES, icon: CategoryIcon },
  { name: 'Credits', href: Routes.CREDITS, icon: CardGiftcardIcon },
  { name: 'Profile', href: Routes.PROFILE, icon: PersonIcon },
] as const;

export default function MobileTabBar() {
  const router = useRouter();
  const { pathname } = router;
  const { t } = useTranslation();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-stretch justify-around bg-white/95 dark:bg-gray-900/95 border-t border-gray-200 dark:border-gray-700 backdrop-blur-sm pb-[env(safe-area-inset-bottom)]"
      role="navigation"
      aria-label={t('header.navigation.tabBar', { defaultValue: 'Main navigation' })}
    >
      {tabs.map((tab) => {
        const href = tab.href;
        const active = pathname === tab.href;

        return (
          <Link
            key={tab.name}
            href={href}
            locale={router.locale}
            prefetch={false}
            className={`
              flex flex-col items-center justify-center gap-0.5 flex-1 min-h-[44px] py-2
              text-gray-600 dark:text-gray-400 transition-colors
              active:bg-gray-100 dark:active:bg-gray-800
              ${active ? 'text-[#FFD700] dark:text-[#FFD700]' : 'hover:text-gray-900 dark:hover:text-gray-200'}
            `}
            style={{ minHeight: TAB_MIN_HEIGHT }}
            aria-current={active ? 'page' : undefined}
          >
            <tab.icon className="w-6 h-6" aria-hidden />
            <span className="text-xs font-medium tab-label">
              {t(`header.navigation.${tab.name.toLowerCase()}`)}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
