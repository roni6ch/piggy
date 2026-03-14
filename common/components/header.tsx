import { Fragment } from 'react';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import CloseIcon from '@mui/icons-material/Close';
import MenuIcon from '@mui/icons-material/Menu';
import Link from 'next/link';
import Image from 'next/image';
import { signOut, useSession } from 'next-auth/react';
import { getAvatarUrl, isSsoImage } from '@/lib/avatar';
import { useRouter } from 'next/router';
import { NavItem, ProfilePageName, Routes } from '../types';
import { navigation, userNavigation } from '../routing';
import Language from './language';
import { useTheme } from 'next-themes';
import styles from '@/styles/header.module.css';
import { useTranslation } from 'next-i18next';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const Header = () => {
  const { data: session } = useSession();
  const { pathname, locale } = useRouter();
  const { systemTheme, theme, setTheme } = useTheme();
  const { t } = useTranslation();

  const isActive = (navItem: NavItem): boolean => {
    return (
      pathname === navItem.href || pathname.split('/[id]')[0] === navItem.href
    );
  };

  const Logo = () => (
    <div className="flex-shrink-0 flex items-center">
      <Link
        href={Routes.HOME}
        locale={locale}
        prefetch
        className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] -m-1"
        aria-label={t('header.navigation.home', { defaultValue: 'Home' })}
      >
        <Image
          className="h-8 w-8 object-contain"
          width={32}
          height={32}
          src="/assets/piggy.png"
          alt=""
          sizes="32px"
        />
      </Link>
    </div>
  );

  const NavigationLinks = () => (
    <>
      {navigation.map((navItem: NavItem) => (
        <Link
          locale={locale}
          href={navItem.href}
          key={navItem.name}
          prefetch
          className={classNames(
            isActive(navItem)
              ? 'bg-gray-900 text-white'
              : 'text-gray-300 hover:bg-gray-700 hover:text-white',
            'block rounded-md px-3 py-2 text-sm font-medium min-h-[44px] flex items-center'
          )}
          aria-current={isActive(navItem) ? 'page' : undefined}
        >
          {t(`header.navigation.${navItem.name.toLowerCase()}`)}
        </Link>
      ))}
    </>
  );

  const avatarSrc = getAvatarUrl(session?.user?.image ?? null, session?.user?.avatarAnimal) || getAvatarUrl(null, 'cat');
  const showSsoAvatar = isSsoImage(session?.user?.image);

  const ProfileDropDown = () => (
    <div className="hidden md:block">
      <div className="ml-4 flex items-center md:ml-4">
        <Menu as="div" className="relative ml-3">
          <div>
            <Menu.Button className="flex max-w-xs items-center rounded-full bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
              <span className="sr-only">{t('header.openUserMenu')}</span>
              {showSsoAvatar ? (
                <Image
                  key={avatarSrc}
                  className="h-8 w-8 rounded-full object-cover"
                  width={32}
                  height={32}
                  src={avatarSrc}
                  alt="user profile image"
                  sizes="32px"
                  unoptimized
                />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-600 text-sm font-medium text-white">
                  {(session?.user?.email?.[0] ?? session?.user?.name?.[0] ?? '?').toString().toUpperCase()}
                </span>
              )}
            </Menu.Button>
          </div>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              {userNavigation.map((item) => (
                <Menu.Item key={item.name}>
                  {({ active }) => (
                    <Link
                      locale={locale}
                      href={item.href}
                      prefetch={item.href !== Routes.LOGIN}
                      onClick={
                        item.name === ProfilePageName.SIGN_OUT
                          ? () => signOut({ redirect: false, callbackUrl: '/' })
                          : () => {}
                      }
                      className={classNames(
                        active ? 'bg-gray-100' : '',
                        'block px-4 py-2 text-sm text-gray-700'
                      )}
                    >
                      {t(`header.profile-dropdown.${item.name.toLowerCase().replace(" ", "-")}`)}
                    </Link>
                  )}
                </Menu.Item>
              ))}
            </Menu.Items>
          </Transition>
        </Menu>
      </div>
    </div>
  );

  /* Mobile: primary nav is bottom tab bar; no burger menu */
  const MobileMenuButton = ({ open }: { open: boolean }) => (
    <div className="hidden">
      <Disclosure.Button className="inline-flex items-center justify-center rounded-md bg-gray-800 p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 min-w-[44px] min-h-[44px]">
        <span className="sr-only">{t('header.openMainMenu')}</span>
        {open ? <CloseIcon /> : <MenuIcon />}
      </Disclosure.Button>
    </div>
  );

  const MobileMenuNav = () => (
    <Disclosure.Panel className="hidden">
      <div className="space-y-1 px-2 pt-2 pb-3 sm:px-3">
        <NavigationLinks />
      </div>
      <div className="border-t border-gray-700 pt-4 pb-3">
        <div className="flex items-center px-5">
          <div className="flex-shrink-0">
            {showSsoAvatar ? (
              <Image
                key={avatarSrc}
                className="h-10 w-10 rounded-full object-cover"
                width={40}
                height={40}
                src={avatarSrc}
                alt="user profile image"
                sizes="40px"
                unoptimized
              />
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-600 text-sm font-medium text-white">
                {(session?.user?.email?.[0] ?? session?.user?.name?.[0] ?? '?').toString().toUpperCase()}
              </span>
            )}
          </div>
          <div className="ml-3">
            <div className="text-base font-medium leading-none text-white">
              {session?.user?.name}
            </div>
            <div className="text-sm font-medium leading-none text-gray-400">
              {session?.user?.email}
            </div>
          </div>
        </div>
        {/* Mobile user Nav */}
        <div className="mt-3 space-y-1 px-2">
          {userNavigation.map((item) => (
            <Link
              locale={locale}
              key={item.name}
              href={item.href}
              prefetch={item.href !== Routes.LOGIN}
              onClick={
                item.name === ProfilePageName.SIGN_OUT
                  ? () => signOut({ redirect: false, callbackUrl: '/' })
                  : () => {}
              }
              className="block rounded-md px-3 py-2 text-base font-medium text-gray-400 hover:bg-gray-700 hover:text-white"
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </Disclosure.Panel>
  );

  const ColorTheme = () => {
    const currentTheme = theme === 'system' ? systemTheme : theme;
    return (
      <div className={`${styles.toggleWrapper} min-w-[44px] min-h-[44px] flex items-center justify-center`}>
        <input
          type="checkbox"
          id="colorTheme"
          checked={currentTheme === 'dark'}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setTheme((e.target as HTMLInputElement).checked ? 'dark' : 'light');
          }}
          aria-label={t('header.toggleDarkMode', { defaultValue: 'Toggle dark mode' })}
        />
        <label htmlFor="colorTheme" className={styles.toggle}>
          <span className={styles.toggle__handler}>
            <span className={`${styles.crater} ${styles.crater1}`}></span>
            <span className={`${styles.crater} ${styles.crater2}`}></span>
            <span className={`${styles.crater} ${styles.crater3}`}></span>
          </span>
          <span className={`${styles.star} ${styles.star1}`}></span>
          <span className={`${styles.star} ${styles.star2}`}></span>
          <span className={`${styles.star} ${styles.star3}`}></span>
          <span className={`${styles.star} ${styles.star4}`}></span>
          <span className={`${styles.star} ${styles.star5}`}></span>
          <span className={`${styles.star} ${styles.star6}`}></span>
        </label>
      </div>
    );
  };

  return (
    <Disclosure as="nav" className="bg-gray-800">
      {({ open }) => (
        <>
          <div className="mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center">
                <Logo />
                <div className="hidden md:block">
                  <div className="ml-10 flex items-baseline space-x-4">
                    <NavigationLinks />
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <ColorTheme />
                <Language />
                <ProfileDropDown />
              </div>
              <MobileMenuButton open={open} />
            </div>
          </div>
          <MobileMenuNav />
        </>
      )}
    </Disclosure>
  );
};

export default Header;
