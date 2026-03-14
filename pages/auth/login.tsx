import Head from 'next/head';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import AuthLayout from '../../common/layouts/authLayout';
import styles from '../../styles/authForm.module.css';
import Image from 'next/image';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import { useState, useEffect, useRef } from 'react';
import { FormikErrors, useFormik } from 'formik';
import { loginValidate } from '../../common/validate';
import { AuthErrors, LoginAuth, Routes } from '../../common/types';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';

const Login = ({ BASE_URL }: { BASE_URL: string }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { locale, query } = router;
  const [showPassword, setShowPassword] = useState(false);
  const loginValues: LoginAuth = {
    email: '',
    password: '',
  };
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const autoLoginAttempted = useRef(false);

  // Show error when NextAuth redirects with ?error=CredentialsSignin
  useEffect(() => {
    if (query.error === 'CredentialsSignin') {
      setAuthError(t('auth.invalidEmailOrPassword'));
    }
  }, [query.error, t]);

  // Dev hack: ?email=...&password=... auto sign-in (development only).
  useEffect(() => {
    if (!router.isReady || autoLoginAttempted.current || process.env.NODE_ENV !== 'development') return;
    const email = typeof query.email === 'string' ? query.email.trim().toLowerCase() : undefined;
    const password = typeof query.password === 'string' ? query.password : undefined;
    if (!email || !password) return;
    autoLoginAttempted.current = true;
    signIn('credentials', {
      email,
      password,
      callbackUrl: BASE_URL,
      redirect: false,
    }).then((result) => {
      if (result?.url) window.location.href = result.url;
      if (result?.error) setAuthError(t('auth.invalidEmailOrPassword'));
    });
  }, [router.isReady, query.email, query.password, BASE_URL, t]);

  const formik = useFormik({
    initialValues: loginValues,
    validate: loginValidate,
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: async (values) => {
      setAuthError(null);
      setIsSubmitting(true);
      try {
        const result = await signIn('credentials', {
          email: values.email.trim(),
          password: values.password,
          callbackUrl: BASE_URL,
          redirect: false,
        });
        if (result?.error) {
          setAuthError(t('auth.invalidEmailOrPassword'));
          return;
        }
        if (result?.url) window.location.href = result.url;
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const handleError = (fieldName: keyof FormikErrors<LoginAuth>) => {
    return (
      formik.errors?.[fieldName] &&
      formik.touched?.[fieldName] &&
      formik.errors?.[fieldName] !== AuthErrors.REQUIRED && (
        <span className={`${styles.error} text-rose-500`}>
          {formik.errors?.[fieldName]}
        </span>
      )
    );
  };

  const isRequiredError = (
    fieldName: keyof FormikErrors<LoginAuth>
  ): boolean => {
    return formik.errors?.[fieldName] && formik.touched?.[fieldName]
      ? formik.errors?.[fieldName] === AuthErrors.REQUIRED
      : false;
  };

  return (
    <AuthLayout>
      <Head>
        <title>Login | FID</title>
        <meta name="description" content="Sign in to FID to find your best deals, card discounts, coupons and credits in one place." />
      </Head>
      <section className="flex flex-col gap-6 sm:gap-8 w-full max-w-sm mx-auto">
        <div className="title">
          <h1 className="text-gray-800 text-2xl sm:text-3xl md:text-4xl font-bold py-2 sm:py-4">{t('auth.loginTitle')}</h1>
          <p className="text-gray-400 text-sm sm:text-base my-2 sm:my-4">
            {t('auth.loginSubtitle')}
          </p>
        </div>
      </section>
      <form
        className="flex flex-col gap-4 sm:gap-5 text-gray-800 w-full max-w-sm mx-auto min-w-0"
        onSubmit={formik.handleSubmit}
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="login-email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('auth.emailLabel', { defaultValue: 'Email' })}
          </label>
          <div
            className={`${styles.input_group} ${isRequiredError('email') ? 'border-rose-600' : ''}`}
          >
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder={t('auth.emailPlaceholder')}
              className={styles.input_text}
              {...formik.getFieldProps('email')}
            />
            <span className="icon flex items-center px-4 min-w-[44px] min-h-[44px]" aria-hidden>
              <AlternateEmailIcon />
            </span>
          </div>
        </div>
        {handleError('email')}
        <div className="flex flex-col gap-1">
          <label htmlFor="login-password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('auth.passwordLabel', { defaultValue: 'Password' })}
          </label>
          <div
            className={`${styles.input_group} ${isRequiredError('password') ? 'border-rose-600' : ''}`}
          >
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder={t('auth.passwordPlaceholder')}
              className={styles.input_text}
              {...formik.getFieldProps('password')}
            />
            <button
              type="button"
              className="icon flex items-center px-4 min-w-[44px] min-h-[44px] border-0 bg-transparent cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? t('auth.hidePassword', { defaultValue: 'Hide password' }) : t('auth.showPassword', { defaultValue: 'Show password' })}
            >
              <FingerprintIcon />
            </button>
          </div>
        </div>
        {authError && (
          <p className="text-rose-500 text-sm">{authError}</p>
        )}
        <div className="w-full">
          <button type="submit" className={styles.button} disabled={isSubmitting}>
            {isSubmitting ? t('auth.signingIn') : t('auth.loginButton')}
          </button>
        </div>
        <div className="w-full">
          <button
            type="button"
            className={styles.button_custom}
            onClick={() =>
              signIn('google', { callbackUrl: BASE_URL })
            }
          >
            {t('auth.signInGoogle')}
            <Image
              src="/assets/google.svg"
              width={20}
              height={20}
              alt="google"
            />
          </button>
        </div>
        <div className="w-full">
          <button
            type="button"
            className={styles.button_custom}
            onClick={() =>
              signIn('facebook', { callbackUrl: BASE_URL })
            }
          >
            {t('auth.signInFacebook')}
            <Image
              src="/assets/facebook.svg"
              width={20}
              height={20}
              alt="facebook"
            />
          </button>
        </div>
      </form>
      <p className="text-center text-gray-400 mt-6 sm:mt-8 text-sm sm:text-base">
        {t('auth.noAccountYet')}{' '}
        <Link
          href={Routes.REGISTER}
          locale={locale}
          className="text-blue-700 ml-1"
        >
          {t('auth.signUp')}
        </Link>
      </p>
    </AuthLayout>
  );
};

Login.getCleanLayout = function PageLayout(page: React.ReactNode) {
  return <>{page}</>;
};
export default Login;

export async function getStaticProps({ locale }: { locale: string }) {
  const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
  return {
    props: {
      ...(await serverSideTranslations(locale)),
      BASE_URL
    },
  };
}
