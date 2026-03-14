import styles from '@/styles/index.module.css';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import type { Business } from '../types';
import { Routes } from '../types';
import { navigation, userNavigation } from '../routing';
import Header from './header';
import MobileTabBar from './mobile-tab-bar';
import AppHead from './app-head';
import Image from 'next/image';
import mountains from './../../public/assets/images/mountains.jpg';
import { useEffect, useRef } from 'react';
import { getUserCards, getUserCoupons, getRecentSearches } from '../api';
import { useUserDataContext } from '../context/userContext';

const Main = ({ children = <></> }: { children: React.ReactNode }) => {
  const router = useRouter();
  const { status, data } = useSession();
  const { setUserData } = useUserDataContext();
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    const email = data?.user?.email;
    if (status !== 'authenticated' || !email) return;
    setUserData((prev) => {
      if (hasFetchedRef.current || prev.userDataFetched) return prev;
      return {
        ...prev,
        cardsLoading: true,
        couponsLoading: true,
        recentSearchesLoading: true,
      };
    });
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    Promise.all([
      getUserCards({ userEmail: email }),
      getUserCoupons({ userEmail: email }),
      getRecentSearches({ userMail: email }),
    ])
      .then(([cards, coupons, recentSearchesResponse]) => {
        const terms = (recentSearchesResponse ?? [])
          .map((r: { term: unknown }) => r.term)
          .filter((t: unknown): t is Business => t != null && typeof t === 'object' && '_id' in t && 'name' in t);
        setUserData((prev) => ({
          ...prev,
          cards: cards ?? [],
          coupons: coupons ?? [],
          recentSearches: terms ?? [],
          cardsLoading: false,
          couponsLoading: false,
          recentSearchesLoading: false,
          userDataFetched: true,
        }));
      })
      .catch(() => {
        setUserData((prev) => ({
          ...prev,
          cardsLoading: false,
          couponsLoading: false,
          recentSearchesLoading: false,
          userDataFetched: true,
        }));
      });
  }, [status, data?.user?.email, setUserData]);

  useEffect(() => {
    if (status !== 'authenticated') {
      hasFetchedRef.current = false;
      setUserData((prev) => (prev.userDataFetched ? { ...prev, userDataFetched: false } : prev));
    }
  }, [status, setUserData]);

  // Prefetch home first so back navigation is fast, then other routes
  useEffect(() => {
    if (status !== 'authenticated' || typeof router?.prefetch !== 'function') return;
    router.prefetch(Routes.HOME);
    const routesToPrefetch = [...navigation, ...userNavigation].filter((item) => item.href !== Routes.LOGIN && item.href !== Routes.HOME);
    routesToPrefetch.forEach((item) => {
      router.prefetch(item.href);
    });
  }, [status, router]);

  const OuterBoxHeading = () => <></>;

  if (status === 'unauthenticated') {
    router.replace(Routes.LOGIN);
    return null;
  }

  return (
    <>
      <AppHead />
      <Header />
      <div className={styles.bgWrap}>
        <Image
          alt=""
          src={mountains}
          placeholder="blur"
          priority
          quality={80}
          fill
          sizes="100vw"
          role="presentation"
          className={`bgImg`}
          style={{
            objectFit: 'cover',
          }}
        />
        <div className={styles.stars}></div>
        <div className={styles.stars2}></div>
        <div className={styles.stars3}></div>
      </div>
      <main className={`${styles.wrapper} bg-gray-400 dark:bg-gray-800 pb-mobile-tab md:pb-4`}>
        <div className={`${styles.innerBox}`}>
          <div className={`${styles.innerBoxHeader} flex text-white`}><OuterBoxHeading /></div>
          {children}
        </div>
      </main>
      <MobileTabBar />
    </>
  );
};

export default Main;
