import Head from 'next/head';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useState, useEffect } from 'react';
import { getAvatarUrl, getAnimalAvatarUrl, AVATAR_ANIMALS, type AvatarAnimal } from '@/lib/avatar';
import { getProfile, updateProfile } from '@/common/api';
import { useUserDataContext } from '@/common/context/userContext';

const sectionCardClass =
  'rounded-lg border border-gray-200 dark:border-gray-600 bg-white/80 dark:bg-gray-800/80 p-4 sm:p-5 shadow-sm';

const inputClass =
  'w-full min-h-[44px] rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500';

const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

export default function Profile() {
  const { t } = useTranslation();
  const { data: session, update: updateSession } = useSession();
  const { userData, setUserData } = useUserDataContext();
  const [name, setName] = useState('');
  const [avatarAnimal, setAvatarAnimal] = useState<AvatarAnimal>(AVATAR_ANIMALS[0]);
  const [ssoImageFromDb, setSsoImageFromDb] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [message, setMessage] = useState<'success' | 'error' | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [location, setLocation] = useState<string | null>(null);

  const email = session?.user?.email;
  const hasSsoImage = Boolean(ssoImageFromDb?.trim());
  const cached = email && userData.profileDataEmail === email ? userData.profileData : null;

  useEffect(() => {
    if (!email) return;
    if (cached) {
      setName(cached.name ?? '');
      setSsoImageFromDb(cached.image?.trim() || null);
      setCreatedAt(cached.createdAt ?? null);
      if (cached.avatarAnimal && AVATAR_ANIMALS.includes(cached.avatarAnimal as AvatarAnimal)) {
        setAvatarAnimal(cached.avatarAnimal as AvatarAnimal);
      }
      if (cached.location != null) setLocation(cached.location);
      setLoaded(true);
      return;
    }
    getProfile({ userEmail: email })
      .then((profile) => {
        setName(profile.name ?? '');
        setSsoImageFromDb(profile.image?.trim() || null);
        setCreatedAt(profile.createdAt ?? null);
        if (profile.avatarAnimal && AVATAR_ANIMALS.includes(profile.avatarAnimal as AvatarAnimal)) {
          setAvatarAnimal(profile.avatarAnimal as AvatarAnimal);
        }
        setUserData((prev) => ({
          ...prev,
          profileData: {
            name: profile.name ?? '',
            image: profile.image?.trim() || null,
            createdAt: profile.createdAt ?? null,
            avatarAnimal: (profile.avatarAnimal as string) || AVATAR_ANIMALS[0],
          },
          profileDataEmail: email,
        }));
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [email, userData.profileDataEmail, userData.profileData]);

  useEffect(() => {
    if (loaded || !session?.user) return;
    if (session.user.name) setName(session.user.name);
    if (session.user.avatarAnimal && AVATAR_ANIMALS.includes(session.user.avatarAnimal as AvatarAnimal)) {
      setAvatarAnimal(session.user.avatarAnimal as AvatarAnimal);
    }
  }, [session?.user?.name, session?.user?.avatarAnimal, loaded]);

  const avatarUrl = getAvatarUrl(ssoImageFromDb ?? null, avatarAnimal);

  const saveName = async (newName: string) => {
    if (!email) return;
    setMessage(null);
    try {
      await updateProfile({ userEmail: email, name: newName.trim() || undefined, avatarAnimal });
      await updateSession({
        user: {
          ...session!.user!,
          name: (newName.trim() || session!.user!.name) ?? undefined,
        },
      });
      setUserData((prev) =>
        prev.profileDataEmail === email && prev.profileData
          ? { ...prev, profileData: { ...prev.profileData, name: newName.trim() || '' } }
          : prev
      );
      setMessage('success');
    } catch {
      setMessage('error');
    }
  };

  useEffect(() => {
    let cancelled = false;
    fetch('https://ipapi.co/json/')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const parts = [data.city, data.region, data.country_name].filter(Boolean);
        setLocation(parts.length ? parts.join(', ') : null);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const handleAnimalSelect = async (animal: AvatarAnimal) => {
    if (animal === avatarAnimal || !email) return;
    const prev = avatarAnimal;
    setAvatarAnimal(animal);
    try {
      await updateProfile({ userEmail: email, avatarAnimal: animal });
      const displayImage = getAvatarUrl(ssoImageFromDb ?? null, animal);
      await updateSession({
        user: { ...session!.user!, image: displayImage, avatarAnimal: animal },
      });
      setUserData((p) =>
        p.profileDataEmail === email && p.profileData
          ? { ...p, profileData: { ...p.profileData, avatarAnimal: animal } }
          : p
      );
    } catch {
      setAvatarAnimal(prev);
    }
  };

  if (!session?.user) return null;

  if (!loaded) {
    return (
      <>
        <Head>
          <title>Profile | FID</title>
          <meta name="description" content="Manage your profile." />
        </Head>
        <div className="max-w-md mx-auto p-4 sm:p-6 space-y-6 text-left">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t('profile.title')}
          </h1>
          <section className={sectionCardClass}>
            <div className="animate-pulse space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-gray-300 dark:bg-gray-600" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 bg-gray-200 dark:bg-gray-600 rounded" />
                  <div className="h-4 w-40 bg-gray-200 dark:bg-gray-600 rounded" />
                </div>
              </div>
              <div className="h-10 w-full bg-gray-200 dark:bg-gray-600 rounded" />
              <div className="flex gap-2 flex-wrap">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-600" />
                ))}
              </div>
            </div>
          </section>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Profile | FID</title>
        <meta name="description" content="Manage your FID profile, display name and avatar." />
      </Head>
      <div className="max-w-md mx-auto p-4 sm:p-6 space-y-6 text-left">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
        {t('profile.title')}
      </h1>

      <section className={sectionCardClass}>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-4">
          {t('profile.account')}
        </h2>
        <div className="flex items-center gap-4 mb-4">
          <Image
            className="rounded-full flex-shrink-0 object-cover"
            width={48}
            height={48}
            src={avatarUrl}
            alt="Profile"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {t('profile.email')}
            </p>
            <p className="text-gray-700 dark:text-gray-300 truncate">
              {email ?? '—'}
            </p>
            {createdAt && (
              <>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-2">
                  {t('profile.createdAt')}
                </p>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  {new Date(createdAt).toLocaleDateString(undefined, {
                    dateStyle: 'medium',
                  })}
                </p>
              </>
            )}
            {location && (
              <>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-2">
                  {t('profile.location', 'Location')}
                </p>
                <p className="text-gray-700 dark:text-gray-300 text-sm">{location}</p>
              </>
            )}
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className={labelClass} htmlFor="profile-name">
              {t('profile.displayName')}
            </label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={(e) => saveName(e.target.value)}
              placeholder={t('settings.displayNamePlaceholder')}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>
              {t('profile.chooseAvatar', 'Choose Avatar')}
            </label>
            <div className="flex flex-wrap gap-2 mt-1">
              {AVATAR_ANIMALS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => handleAnimalSelect(a)}
                  className={`rounded-full p-1.5 border-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    avatarAnimal === a
                      ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                  aria-pressed={avatarAnimal === a}
                  aria-label={a}
                >
                  <img
                    src={getAnimalAvatarUrl(a)}
                    alt=""
                    className="w-8 h-8 rounded-full object-contain"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
        {message === 'success' && (
          <p className="text-sm text-green-600 dark:text-green-400 mt-2">{t('settings.saved')}</p>
        )}
        {message === 'error' && (
          <p className="text-sm text-red-600 dark:text-red-400 mt-2">{t('settings.saveError')}</p>
        )}
      </section>
      </div>
    </>
  );
}

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale)),
    },
  };
}
