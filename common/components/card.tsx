import { useTranslation } from 'next-i18next';
import styles from '@/styles/card.module.css';
import {
  Card as CardType,
  Provider as ProviderType,
  Club as ClubType,
  CardBackground,
} from '../types';
import Image from 'next/image';
import CheckIcon from '@mui/icons-material/Check';

export default function Card({
  card,
  isCardChecked,
  handleCardClick,
  compact,
  onRemove,
  noAnimation,
}: {
  card: CardType;
  isCardChecked?: boolean;
  handleCardClick?: Function;
  compact?: boolean;
  onRemove?: (card: CardType) => void;
  noAnimation?: boolean;
}) {
  const { t } = useTranslation();

  const WIFI = () => {
    return (
      <Image
        src={'/assets/cards-icons/wifi.svg'}
        width="25"
        height="25"
        className={styles.contactless}
        alt={'wifi icon'}
      />
    );
  };
  const CHIP = () => {
    return (
      <Image
        src={'/assets/cards-icons/chip.svg'}
        width="30"
        height="30"
        className={styles.chip}
        alt={'card chip'}
      />
    );
  };

  const Provider = ({ provider }: { provider: ProviderType }) => {
    let logo: string | null = null;
    switch (provider) {
      case ProviderType.MASTERCARD:
        logo = 'mastercard';
        break;
      case ProviderType.VISA:
        logo = 'visa';
        break;
      case ProviderType.AMEX:
        logo = 'amex';
        break;
      case ProviderType.DINERS:
        logo = 'diners';
        break;
      case ProviderType.BIT:
        logo = 'bit';
        break;
    }
    
    return (
      <>
        {logo && (
          <Image
            src={`/assets/cards-icons/${logo}.svg`}
            width="50"
            height="50"
            className={styles.logo}
            alt={`${provider} logo`}
          />
        )}
      </>
    );
  };

  const Club = ({ club }: { club: ClubType }) => {
    return (
      <>
        {club && (
          <Image
            src={`/assets/cards-icons/${club}.svg`}
            width="50"
            height="50"
            className={styles.club}
            alt={`${club} logo`}
          />
        )}
      </>
    );
  };

  const getBG = (card: CardType) => {
    if (!card.bg) return '';
    const asStr = String(card.bg);
    if (asStr.startsWith('#') || asStr === 'grey') return asStr;
    return CardBackground[card.bg as unknown as keyof typeof CardBackground] ?? '';
  };

  return (
    <div
      className={`${styles.flipCard} ${compact ? styles.flipCardCompact : ''} ${noAnimation ? styles.flipCardNoAnimation : ''} scale-up-center-anima`}
      key={card._id}
      onClick={() => !onRemove && handleCardClick?.(card)}
    >
      <div
        className={styles.flipCardInner}
        style={{ transform: isCardChecked ? 'scale(0.8)' : '' }}
      >
        {isCardChecked && !compact && <CheckIcon className={styles.checkCard} />}
        {onRemove && (
          <button
            type="button"
            className={styles.removeCard}
            onClick={(e) => {
              e.stopPropagation();
              onRemove(card);
            }}
            aria-label="Remove card"
          >
            ×
          </button>
        )}
        <div
          className={styles.flipCardFront}
          style={{ backgroundColor: getBG(card) }}
        >
          <Club club={card.club} />
          <p className={styles.heading}>{card.provider}</p>
          <Provider provider={card.provider} />
          <CHIP />
          <WIFI />
          <p className={styles.number}>1234 5678 1234 5678</p>
          <p className={styles.validThru}>VALID THRU</p>
          <p className={styles.date}>12/29</p>
          <p className={styles.name}>Israel Israeli</p>
        </div>
        <div
          className={styles.flipCardBack}
          style={{ backgroundColor: getBG(card) }}
        >
          <div className={styles.strip}></div>
          <div className={styles.mstrip}></div>
          <div className={styles.sstrip}>
            <p className={styles.code}>***</p>
          </div>
        </div>
      </div>
    </div>
  );
}
