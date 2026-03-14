import { Business, Card } from '@/common/types';

/** User-built card: club (top-left) + provider (bottom-right). Stored in user.cards. */
export interface UserCardChoice {
  id: string;
  club: string;
  provider: string;
}

export interface UserDocument {
  _id?: string;
  email: string;
  name: string;
  image: string;
  /** Animal key for default avatar when image is empty (e.g. 'cat', 'dog') */
  avatarAnimal?: string;
  password?: string;
  /** Card IDs (string) from DB and/or user-built choices (UserCardChoice). */
  cards: (string | UserCardChoice)[];
  searches: SearchDocument[];
  createdAt?: Date;
  /** Buy Me balance (e.g. remaining amount). */
  buymeAmount?: number;
  /** Buy Me card/certificate type (e.g. "gift card", "voucher"). */
  buymeType?: string;
  /** Coupons (stored on user doc to keep all user data in one place). */
  coupons?: UserCouponDocument[];
}

export interface SearchDocument {
  term: string | Business;
  createdAt: Date;
  /** Stored display name when business is not in DB (e.g. mock). */
  name?: string;
  imageSrc?: string;
  imageSrcBig?: string;
  address?: string;
  rating?: number;
  userRatingsTotal?: number;
  openingHours?: string;
  openingHoursWeekdays?: string[];
  phone?: string;
  website?: string;
}

export interface CardDocument {
  _id: string;
  name: string;
  imageSrc: string;
  type: string;
  issuer: string;
  provider: string;
  club: string;
  bg: string;
  createdAt: Date;
}

export interface CategoryDocument {
  _id: string;
  name: string;
  imageSrc: string;
  createdAt: Date;
  businessIds: string[];
}

export interface BusinessDocument {
  _id: string;
  name: string;
  imageSrc: string;
  imageSrcBig: string;
  createdAt: Date;
  openingHours?: string;
  openingHoursWeekdays?: string[];
  rating?: number;
  userRatingsTotal?: number;
  address?: string;
  phone?: string;
  website?: string;
  /** Google Place ID (e.g. ChIJ...) – links to Places API for discovery/perks badge. */
  googlePlaceId?: string;
}

export interface DealDocument {
  _id: string;
  description: string;
  expirationDate: Date | string;
  createDate: Date | string;
  link: string;
  cardId: string | Card;
  businessId: string | Business;
}

/** User-uploaded coupon (manual or from receipt). Stored on user document as user.coupons[]. */
export interface UserCouponDocument {
  _id: string;
  storeName: string;
  amount: string;
  endDate: string; // ISO date string
  couponCode?: string;
  /** URL from Storage when available */
  receiptImageUrl?: string;
  /** Base64 data URL when Storage not used (fallback) */
  receiptImageData?: string;
  createdAt: Date;
}
