import { Fragment, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Listbox, Transition } from '@headlessui/react';
import CheckIcon from '@mui/icons-material/Check';
import CircularProgress from '@mui/material/CircularProgress';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { Lang, Locales } from '../types';

const langs: Lang[] = [
  {
    name: 'English',
    locale: Locales.EN,
    avatar:
      'https://p1.hiclipart.com/preview/934/992/1023/world-flag-icons-round-usa-flag-art.jpg',
  },
  {
    name: 'עברית',
    locale: Locales.HE,
    avatar:
      'https://p1.hiclipart.com/preview/300/480/50/asia-win-flag-of-israel-ball-icon-png-clipart.jpg',
  },
  {
    name: 'Русский',
    locale: Locales.RU,
    avatar: 'https://flagcdn.com/w40/ru.png',
  },
  {
    name: 'العربية',
    locale: Locales.AR,
    avatar: 'https://flagcdn.com/w40/sa.png',
  },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const DEFAULT_LOCALE = 'en';

export default function Language() {
  const router = useRouter();
  const [selected, setSelected] = useState(
    langs.find((lang: Lang) => lang.locale === router.locale) ||
      langs.find((lang: Lang) => lang.locale === Locales.EN)!
  );
  const [isChangingLocale, setIsChangingLocale] = useState(false);

  useEffect(() => {
    const next = langs.find((l) => l.locale === router.locale) ?? langs[0];
    setSelected(next);
  }, [router.locale]);

  const setSelectedLocale = (selectedLang: {
    name: string;
    locale: Locales;
    avatar: string;
  }) => {
    if (router.locale === selectedLang.locale) return;
    const path = router.asPath ?? '/';
    const pathWithoutLocale = path.replace(/^\/[a-z]{2}(\/|$)/, '$1') || '/';
    const newPath =
      selectedLang.locale === DEFAULT_LOCALE
        ? pathWithoutLocale
        : `/${selectedLang.locale}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`;
    setIsChangingLocale(true);
    requestAnimationFrame(() => {
      setTimeout(() => {
        window.location.assign(newPath);
      }, 250);
    });
  };

  const overlayEl =
    typeof document !== 'undefined' &&
    isChangingLocale &&
    createPortal(
      <div
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/90 dark:bg-gray-900/95 backdrop-blur-sm animate-in fade-in duration-200"
        role="status"
        aria-live="polite"
        aria-label="Changing language"
      >
        <CircularProgress
          size={48}
          thickness={4}
          className="text-cyan-600"
          sx={{ color: 'var(--tw-cyan-600, #0891b2)' }}
        />
        <p className="mt-4 text-sm font-medium text-gray-600 dark:text-gray-400">
          Changing language…
        </p>
      </div>,
      document.body
    );

  return (
    <>
      {overlayEl}
      <Listbox value={selected} onChange={setSelectedLocale}>
      {({ open }) => (
        <div className="ml-4">
          <Listbox.Button className="relative w-full cursor-pointer rounded-md hover:bg-gray-700 py-1.5 pl-3 pr-4 text-left text-white shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 min-h-[44px] min-w-[44px] flex items-center sm:text-sm sm:leading-6">
            <span className="flex items-center">
              <Image
                width={20}
                height={20}
                src={selected.avatar}
                alt={selected.name}
                className="h-5 w-5 flex-shrink-0 rounded-full"
              />
              <span className="ml-3 block truncate">{selected.name}</span>
            </span>
          </Listbox.Button>

          <Transition
            show={open}
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-10 mt-1  max-h-56 overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {langs.map((lang: Lang) => (
                <Listbox.Option
                  key={lang.locale}
                  className={({ active }) =>
                    classNames(
                      active ? 'bg-gray-700 text-white' : 'text-gray-900',
                      'relative cursor-pointer select-none py-2 pl-3 pr-2'
                    )
                  }
                  value={lang}
                >
                  {({ selected, active }) => (
                    <>
                      <div className="flex items-center">
                        <Image
                          width={20}
                          height={20}
                          src={lang.avatar}
                          alt={lang.name}
                          className="h-5 w-5 flex-shrink-0 rounded-full"
                        />
                        <span
                          className={classNames(
                            selected ? 'font-semibold' : 'font-normal',
                            'ml-3 block truncate'
                          )}
                        >
                          {lang.name}
                        </span>
                        {selected ? (
                          <span
                            className={classNames(
                              active ? 'text-white' : 'text-gray-700',
                              ' inset-y-0 right-0 flex items-center px-2'
                            )}
                          >
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </div>
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      )}
    </Listbox>
    </>
  );
}
