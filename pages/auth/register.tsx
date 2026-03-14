import Head from 'next/head';
import AuthLayout from '../../common/layouts/authLayout';
import Link from 'next/link';
import styles from '../../styles/authForm.module.css';
import PersonIcon from '@mui/icons-material/Person';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import { useState } from 'react';
import { FormikErrors, useFormik } from 'formik';
import { AuthErrors, RegisterAuth } from '../../common/types';
import { registerValidate } from '../../common/validate';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { Routes } from '../../common/types';

const Register = () => {
  const { locale } = useRouter();
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState({
    password: false,
    cpassword: false,
  });
  const registerValues: RegisterAuth = {
    username: '',
    email: '',
    password: '',
    cpassword: '',
  };
  const [submitError, setSubmitError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: registerValues,
    validate: registerValidate,
    onSubmit: async (values) => {
      setSubmitError(null);
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: values.username.trim(),
          email: values.email.trim().toLowerCase(),
          password: values.password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError(data.message || t('auth.registrationFailed'));
        return;
      }
      window.location.href = `/${locale}${Routes.HOME}`;
    },
  });

  const handleError = (fieldName: keyof FormikErrors<RegisterAuth>) => {
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
    fieldName: keyof FormikErrors<RegisterAuth>
  ): boolean => {
    return formik.errors?.[fieldName] && formik.touched?.[fieldName]
      ? formik.errors?.[fieldName] === AuthErrors.REQUIRED
      : false;
  };

  return (
    <AuthLayout>
      <Head>
        <title>Register | FID</title>
        <meta name="description" content="Create your FID account to save your cards, find deals, coupons and credits in one place." />
      </Head>
      <section className="flex flex-col gap-6 sm:gap-8 w-full max-w-sm mx-auto">
        <div className="title">
          <h1 className="text-gray-800 text-2xl sm:text-3xl md:text-4xl font-bold py-2 sm:py-4">{t('auth.registerTitle')}</h1>
          <p className="text-gray-400 text-sm sm:text-base my-2 sm:my-4">
            {t('auth.loginSubtitle')}
          </p>
        </div>
      </section>

      <form className="flex flex-col gap-4 sm:gap-5 w-full max-w-sm mx-auto min-w-0" onSubmit={formik.handleSubmit}>
        <div className="flex flex-col gap-1">
          <label htmlFor="register-username" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('auth.usernameLabel', { defaultValue: 'Username' })}
          </label>
          <div className={`${styles.input_group} ${isRequiredError('username') ? 'border-rose-600' : ''}`}>
            <input
              id="register-username"
              type="text"
              autoComplete="username"
              placeholder={t('auth.usernamePlaceholder')}
              className={styles.input_text}
              {...formik.getFieldProps('username')}
            />
            <span className="icon flex items-center px-4 min-w-[44px] min-h-[44px]" aria-hidden>
              <PersonIcon />
            </span>
          </div>
        </div>
        {handleError('username')}
        <div className="flex flex-col gap-1">
          <label htmlFor="register-email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('auth.emailLabel', { defaultValue: 'Email' })}
          </label>
          <div className={`${styles.input_group} ${isRequiredError('email') ? 'border-rose-600' : ''}`}>
            <input
              id="register-email"
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
          <label htmlFor="register-password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('auth.passwordLabel', { defaultValue: 'Password' })}
          </label>
          <div className={`${styles.input_group} ${isRequiredError('password') ? 'border-rose-600' : ''}`}>
            <input
              id="register-password"
              type={showPassword.password ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder={t('auth.passwordPlaceholder')}
              className={styles.input_text}
              {...formik.getFieldProps('password')}
            />
            <button
              type="button"
              className="icon flex items-center px-4 min-w-[44px] min-h-[44px] border-0 bg-transparent cursor-pointer"
              onClick={() => setShowPassword({ ...showPassword, password: !showPassword.password })}
              aria-label={showPassword.password ? t('auth.hidePassword', { defaultValue: 'Hide password' }) : t('auth.showPassword', { defaultValue: 'Show password' })}
            >
              <FingerprintIcon />
            </button>
          </div>
        </div>
        {handleError('password')}
        <div className="flex flex-col gap-1">
          <label htmlFor="register-cpassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('auth.confirmPasswordLabel', { defaultValue: 'Confirm password' })}
          </label>
          <div className={`${styles.input_group} ${isRequiredError('cpassword') ? 'border-rose-600' : ''}`}>
            <input
              id="register-cpassword"
              type={showPassword.cpassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder={t('auth.confirmPasswordPlaceholder')}
              className={styles.input_text}
              {...formik.getFieldProps('cpassword')}
            />
            <button
              type="button"
              className="icon flex items-center px-4 min-w-[44px] min-h-[44px] border-0 bg-transparent cursor-pointer"
              onClick={() => setShowPassword({ ...showPassword, cpassword: !showPassword.cpassword })}
              aria-label={showPassword.cpassword ? t('auth.hidePassword', { defaultValue: 'Hide password' }) : t('auth.showPassword', { defaultValue: 'Show password' })}
            >
              <FingerprintIcon fontSize="medium" />
            </button>
          </div>
        </div>
        {handleError('cpassword')}
        {submitError && (
          <p className="text-rose-500 text-sm">{submitError}</p>
        )}
        <div className="w-full">
          <button type="submit" className={styles.button}>
            {t('auth.signUpButton')}
          </button>
        </div>
      </form>
      <p className="text-center text-gray-400 mt-6 sm:mt-8 text-sm sm:text-base">
        {t('auth.haveAccount')}{' '}
        <Link
          href="/auth/login"
          locale={locale}
          className="text-blue-700 ml-1"
        >
          {t('auth.signIn')}
        </Link>
      </p>
    </AuthLayout>
  );
};

Register.getCleanLayout = function PageLayout(page: React.ReactNode) {
  return <>{page}</>;
};

export default Register;

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale)),
    },
  };
}
