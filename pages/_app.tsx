import '@/styles/globals.css';
import { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import { appWithTranslation } from 'next-i18next';
import { ThemeProvider } from 'next-themes';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Poppins } from 'next/font/google';
import Main from '../common/components/main';
import { UserDataProvider } from '../common/context/userContext';

const poppins = Poppins({
  weight: ['300', '400'],
  subsets: ['latin'],
  display: 'swap',
});

interface AppPropsWithLayout
  extends AppProps<{
    session: Session;
  }> {
  Component: any;
}

/** Thin top bar shown during route change for immediate feedback */
function RouteChangeIndicator() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const start = () => setLoading(true);
    const end = () => setLoading(false);
    router.events.on('routeChangeStart', start);
    router.events.on('routeChangeComplete', end);
    router.events.on('routeChangeError', end);
    return () => {
      router.events.off('routeChangeStart', start);
      router.events.off('routeChangeComplete', end);
      router.events.off('routeChangeError', end);
    };
  }, [router.events]);

  if (!loading) return null;

  return (
    <div className="route-change-bar" role="progressbar" aria-hidden />
  );
}

function MyApp({
  Component,
  pageProps: { session, ...pageProps },
}: AppPropsWithLayout) {
  if (Component.getCleanLayout) {
    return (
      <div className={poppins.className}>
        <Component {...pageProps} />
      </div>
    );
  }
  return (
    <div className={poppins.className}>
      <ThemeProvider enableSystem={true} attribute="class">
        {/* Session from page getServerSideProps avoids client fetch; refetchOnWindowFocus=false reduces extra /api/auth/session calls. */}
        <SessionProvider session={session} refetchOnWindowFocus={false} refetchWhenOffline={false} refetchInterval={0}>
          <RouteChangeIndicator />
          <UserDataProvider>
            <Main>
              <Component {...pageProps} />
            </Main>
          </UserDataProvider>
        </SessionProvider>
      </ThemeProvider>
    </div>
  );
}

export default appWithTranslation(MyApp);
