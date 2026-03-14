import Head from 'next/head';
import Card from '@/common/components/card';
import PaymentNetworkIcon from '@/common/components/payment-network-icon';
import SkeletonGrid from '@/common/components/skeleton-grid';
import { useUserDataContext } from '@/common/context/userContext';
import { Card as CardType, Club, Provider } from '@/common/types';
import styles from '@/styles/cards.module.css';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { addCardByChoice, removeCard } from '@/common/api';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import Image from 'next/image';

const MAX_CARDS = 20;

function CardImageWithSkeleton({ src, alt, width, height, className }: { src: string; alt: string; width: number; height: number; className?: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative inline-block" style={{ width, height }}>
      {!loaded && (
        <div className="absolute inset-0 rounded-lg bg-gray-200 dark:bg-gray-600 animate-pulse" aria-hidden />
      )}
      <Image
        src={src}
        width={width}
        height={height}
        alt={alt}
        aria-hidden
        className={className}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}

const CLUBS: { value: Club; label: string }[] = [
  { value: Club.MAX, label: 'Max' },
  { value: Club.DISCOUNT, label: 'Discount' },
  { value: Club.LEUMI, label: 'Leumi' },
  { value: Club.HAPOALIM, label: 'Hapoalim' },
  { value: Club.ISRACARD, label: 'Isracard' },
  { value: Club.CAL, label: 'Cal' },
  { value: Club.MIZRAHI, label: 'Mizrahi' },
  { value: Club.DINERS, label: 'Diners' },
  { value: Club.YOTER, label: 'Yoter' },
  { value: Club.INTERNATIONAL, label: 'International' },
];

const PROVIDERS: { value: Provider; label: string; icon: string }[] = [
  { value: Provider.VISA, label: 'Visa', icon: 'visa' },
  { value: Provider.MASTERCARD, label: 'Mastercard', icon: 'mastercard' },
  { value: Provider.AMEX, label: 'Amex', icon: 'amex' },
  { value: Provider.DINERS, label: 'Diners', icon: 'diners' },
  { value: Provider.BIT, label: 'BIT', icon: 'bit' },
];

const DEFAULT_BG: Record<string, string> = {
  max: '#182957',
  diners: 'grey',
  cal: '#badcf5',
  isracard: '#182957',
  discount: '#434342',
  yoter: '#434342',
  leumi: '#182957',
  hapoalim: 'grey',
  mizrahi: '#182957',
  international: 'grey',
};

function buildPreviewCard(club: Club | null, provider: Provider | null): CardType | null {
  if (!club || !provider) return null;
  return {
    _id: 'preview',
    name: `${club} ${provider}`,
    issuer: 'regular' as CardType['issuer'],
    imageSrc: '',
    provider,
    club,
    bg: (DEFAULT_BG[club] ?? '#182957') as CardType['bg'],
  };
}

export default function Cards() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const { userData, setUserData } = useUserDataContext();
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const previewCard = buildPreviewCard(selectedClub, selectedProvider);
  const myCards = userData.cards ?? [];
  const cardsLoading = userData.cardsLoading ?? false;
  const atCardLimit = myCards.length >= MAX_CARDS;
  const canAdd = previewCard && session?.user?.email && !adding && !atCardLimit;

  const handleAdd = async () => {
    if (!canAdd || !selectedClub || !selectedProvider || !session?.user?.email) return;
    setAdding(true);
    try {
      const newCard = await addCardByChoice({
        userEmail: session.user.email,
        club: selectedClub,
        provider: selectedProvider,
      });
      if (newCard) {
        setUserData((prev) => ({
          ...prev,
          cards: [...(prev.cards ?? []), newCard],
        }));
      }
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (card: CardType) => {
    const email = session?.user?.email;
    if (!email) return;
    setRemovingId(card._id);
    try {
      await removeCard({ cardId: card._id, userEmail: email });
      setUserData((prev) => ({
        ...prev,
        cards: (prev.cards ?? []).filter((c) => c._id !== card._id),
      }));
    } finally {
      setRemovingId(null);
    }
  };

  const step1Done = !!selectedClub;
  const step2Done = !!selectedProvider;
  const step3Active = step1Done && step2Done;

  const activeStep = !selectedClub ? 1 : !selectedProvider ? 2 : 3;
  const setActiveStep = (step: 1 | 2 | 3) => {
    if (step === 1) {
      setSelectedProvider(null);
      setSelectedClub(null);
    } else if (step === 2) {
      setSelectedProvider(null);
    }
  };

  return (
    <>
      <Head>
        <title>My cards | FID</title>
        <meta name="description" content="Manage your credit and debit cards. Add cards to see relevant deals and discounts." />
      </Head>
      <div className={styles.page}>
      <div className={styles.pageInner}>
        <section className={styles.builder}>
          <h2 className={styles.sectionTitle}>{t('cards.builderTitle')}</h2>
          <p className={styles.sectionSubtitle}>{t('cards.builderSubtitle')}</p>

          <div className={styles.stepper}>
            <button
              type="button"
              className={`${styles.stepItem} ${step1Done ? styles.stepItemDone : activeStep === 1 ? styles.stepItemActive : ''}`}
              onClick={() => setActiveStep(1)}
              aria-current={activeStep === 1 ? 'step' : undefined}
            >
              <span className={styles.stepBadge}>1</span>
              <span className={styles.stepLabel}>{t('cards.step1')}</span>
            </button>
            <button
              type="button"
              className={`${styles.stepItem} ${step2Done ? styles.stepItemDone : activeStep === 2 ? styles.stepItemActive : ''} ${!step1Done ? styles.stepItemDisabled : ''}`}
              onClick={() => step1Done && setActiveStep(2)}
              disabled={!step1Done}
              aria-current={activeStep === 2 ? 'step' : undefined}
            >
              <span className={styles.stepBadge}>2</span>
              <span className={styles.stepLabel}>{t('cards.step2')}</span>
            </button>
            <button
              type="button"
              className={`${styles.stepItem} ${activeStep === 3 ? styles.stepItemActive : ''} ${!step3Active ? styles.stepItemDisabled : ''}`}
              onClick={() => step3Active && setActiveStep(3)}
              disabled={!step3Active}
              aria-current={activeStep === 3 ? 'step' : undefined}
            >
              <span className={styles.stepBadge}>3</span>
              <span className={styles.stepLabel}>{t('cards.step3')}</span>
            </button>
          </div>

          <div className={styles.builderContent}>
            <div className={styles.stepPanel}>
              {activeStep === 1 && (
                <div className={styles.pickerBlock}>
                  <div className={styles.logoGridScroll}>
                    <div className={styles.logoGrid}>
                      {CLUBS.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          className={`${styles.logoButton} ${selectedClub === c.value ? styles.logoButtonSelected : ''}`}
                          onClick={() => setSelectedClub(c.value)}
                          aria-label={t(`cards.club.${c.value}`)}
                          title={t(`cards.club.${c.value}`)}
                        >
                          <CardImageWithSkeleton
                            src={`/assets/cards-icons/${c.value}.svg`}
                            alt={t(`cards.club.${c.value}`)}
                            width={56}
                            height={56}
                          />
                          <span className={styles.logoButtonTooltip}>{t(`cards.club.${c.value}`)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  {selectedClub && (
                    <div className={styles.chosenUnderStep} aria-hidden>
                      <CardImageWithSkeleton
                        src={`/assets/cards-icons/${selectedClub}.svg`}
                        alt={t(`cards.club.${selectedClub}`)}
                        width={28}
                        height={28}
                      />
                      <span className={styles.chosenLabel}>
                        {t(`cards.club.${selectedClub}`)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {activeStep === 2 && (
                <div className={styles.pickerBlock}>
                  <div className={`${styles.logoGridScroll} ${styles.logoGridScrollNetwork}`}>
                    <div className={styles.logoGrid}>
                      {PROVIDERS.map((p) => (
                        <button
                          key={p.value}
                          type="button"
                          className={`${styles.logoButton} ${selectedProvider === p.value ? styles.logoButtonSelected : ''}`}
                          onClick={() => setSelectedProvider(p.value)}
                          aria-label={t(`cards.provider.${p.value.toLowerCase()}`)}
                          title={t(`cards.provider.${p.value.toLowerCase()}`)}
                        >
                          <PaymentNetworkIcon
                            provider={p.value}
                            width={56}
                            height={56}
                            ariaHidden
                          />
                          <span className={styles.logoButtonTooltip}>{t(`cards.provider.${p.value.toLowerCase()}`)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className={styles.chosenRow}>
                    {selectedClub && (
                      <div className={styles.chosenUnderStep} aria-hidden>
                        <CardImageWithSkeleton
                          src={`/assets/cards-icons/${selectedClub}.svg`}
                          alt={t(`cards.club.${selectedClub}`)}
                          width={28}
                          height={28}
                        />
                        <span className={styles.chosenLabel}>
                          {t(`cards.club.${selectedClub}`)}
                        </span>
                      </div>
                    )}
                    {selectedProvider && (
                      <div className={styles.chosenUnderStep} aria-hidden>
                        <PaymentNetworkIcon
                          provider={selectedProvider}
                          width={28}
                          height={28}
                          ariaHidden
                        />
                        <span className={styles.chosenLabel}>
                          {t(`cards.provider.${selectedProvider.toLowerCase()}`)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeStep === 3 && (
                <div className={styles.step3Content}>
                  <div className={styles.previewCardWrap}>
                    {previewCard ? (
                      <Card card={previewCard} noAnimation />
                    ) : (
                      <div className={styles.previewPlaceholder}>
                        {t('cards.previewPlaceholder')}
                      </div>
                    )}
                  </div>
                  {session?.user?.email ? (
                    <>
                      <button
                        type="button"
                        className={styles.ctaButton}
                        disabled={!canAdd}
                        onClick={handleAdd}
                      >
                        {adding ? t('cards.adding') : t('cards.addToMyCards')}
                      </button>
                      {atCardLimit && (
                        <p className={styles.signInHint} role="status">
                          {t('cards.cardLimitReached')}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className={styles.signInHint}>{t('cards.signInToAdd')}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className={styles.myCards}>
          <h2 className={styles.myCardsSectionTitle}>{t('cards.myCardsTitle')}</h2>
          {cardsLoading && myCards.length === 0 ? (
            <SkeletonGrid count={6} />
          ) : myCards.length === 0 ? (
            <p className={styles.empty}>{t('cards.noCardsYet')}</p>
          ) : (
            <div className={styles.myCardsGrid}>
              {myCards.map((card) => (
                <div key={card._id} className={styles.myCardWrap}>
                  <Card
                    card={card}
                    noAnimation
                    onRemove={session?.user?.email ? handleRemove : undefined}
                  />
                  {removingId === card._id && (
                    <div className={styles.removingOverlay}>{t('cards.removing')}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
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
