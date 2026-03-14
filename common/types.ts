export type LoginAuth = {
  email: string;
  password: string;
};

export type RegisterAuth = {
  username: string;
  email: string;
  password: string;
  cpassword: string;
};

export enum AuthErrors {
  REQUIRED = 'Required',
  INVALID_EMAIL_ADDESS = 'Invalid email address',
  INVALID_PASSWORD = 'Invalid password',
  INVALID_USERNAME = 'Invalid username',
  INVALID_CONFIRM_PASSWORD = 'Invalid confirm password',
  INPUT_LENGTH_ERROR = 'Must be greater then 6 and less then 20 characters',
  PASSWORDS_NOT_MATCH = 'Passwords does not match',
}

export enum Routes {
  LOGIN = '/auth/login',
  REGISTER = '/auth/register',
  HOME = '/',
  CATEGORIES = '/categories',
  CATEGORY = '/category',
  CARDS = '/cards',
  CREDITS = '/credits',
  PROFILE = '/profile',
  SETTINGS = '/settings',
  BUSINESS = '/business',
}

export enum PageName {
  HOME = 'Home',
  CATEGORIES = 'Categories',
  CARDS = 'Cards',
  Credits = 'Credits',
}

export enum ProfilePageName {
  PROFILE = 'Profile',
  SETTINGS = 'Settings',
  SIGN_OUT = 'Sign out',
}

export type NavItem = {
  name: PageName;
  href: Routes;
};

export type UserNavItem = {
  name: ProfilePageName;
  href: Routes;
};

export type Category = {
  _id: string;
  name: string;
  imageSrc: string;
  businessIds: string[];
};

export type Card = {
  _id: string;
  name: string;
  issuer: Issuer;
  imageSrc: string;
  provider: Provider;
  club: Club;
  bg: CardBackground;
};

export enum Issuer {
  REGULAR = 'regular',
  BANK = 'bank',
}

export enum Provider {
  MASTERCARD = 'MASTERCARD',
  AMEX = 'AMERICAN EXPRESS',
  VISA = 'VISA',
  DINERS = 'DINERS',
  BIT = 'BIT',
}

export enum Club {
  MAX = 'max',
  DINERS = 'diners',
  CAL = 'cal',
  ISRACARD = 'isracard',
  DISCOUNT = 'discount',
  YOTER = 'yoter',
  LEUMI = 'leumi',
  HAPOALIM = 'hapoalim',
  MIZRAHI = 'mizrahi',
  INTERNATIONAL = 'international',
}

export enum CardBackground {
  AMEX = 'grey',
  MAX = '#182957',
  MAX_EXCUTIVE = '#3dbdae',
  CAL = '#badcf5',
  YOTER = '#434342',
}

export type Business = {
  _id: string;
  name: string;
  imageSrc: string;
  imageSrcBig: string;
  /** Optional: e.g. "Open today 9:00 – 21:00" or "Closed" */
  openingHours?: string;
  /** Optional: all weekdays (Sun–Sat) from Google Places. */
  openingHoursWeekdays?: string[];
  /** Optional: Google or mock rating 0–5 */
  rating?: number;
  userRatingsTotal?: number;
  address?: string;
  phone?: string;
  website?: string;
};

/** Store-level promotion (e.g. Buy 1 get 1, 30% off until date) – not tied to a specific card. */
export type StoreDeal = {
  _id?: string;
  description: string;
  endDate: string;
  storeId?: string;
  storeName?: string;
  link?: string;
};

export type Lang = {
  name: string;
  locale: Locales;
  avatar: string;
};

export enum Locales {
  EN = 'en',
  HE = 'he',
  RU = 'ru',
  AR = 'ar',
}

export enum Network {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
}

export enum Collections {
  BUSINESSES = 'businesses',
  CARDS = 'cards',
  CATEGORIES = 'categories',
  USERS = 'users',
  RECENT_SEARCHES = 'recent_searches',
  DEALS = 'deals',
}

export enum Models {
  CATEGORY = 'Category',
  CARD = 'Card',
  BUSINESS = 'Business',
  USER = 'User',
  RECENT_SEARCH = 'Recent_Search',
  DEAL = 'Deal',
}

export type UserFilters = {
  showOnlyMyCards?: boolean;
};

export type Deals = {
  data: DealDocument[];
  total: number;
  totalPages: number;
}

export type DealDocument = {
  description: string;
  expirationDate: string;
  createDate: string;
  link: string;
  cardId: Card;
  businessId: string;
}

export type RecentSearch = {
  term: Business;
  createdAt: Date;
};

/** AI search: one recommended way to shop (store + card + deal). */
export type BestComboItem = {
  store: Business;
  card: Card;
  deal: DealDocument;
  reason?: string;
};

/** AI search API response. */
export type AiSearchResponse = {
  query: string;
  stores: Business[];
  dealsByStore: Record<string, DealDocument[]>;
  userCards: Card[];
  bestCombos: {
    summary: string;
    items: BestComboItem[];
  };
  message?: string;
};

/** Google Places API (New) search result – normalized for UI (closest businesses by name/query). */
export type GooglePlace = {
  placeId: string;
  name: string;
  address?: string;
  /** National-format phone number from Places API. */
  phone?: string;
  rating?: number;
  userRatingsTotal?: number;
  /** Photo resource name for Place Photos (New) – use with /api/place-photo to get image URL. */
  photoName?: string;
  /** Human-readable opening hours for today when available. */
  openingHours?: string;
  /** All weekdays (Sun–Sat), e.g. ["Sunday: 6:30 AM – 9:00 PM", ...]. */
  openingHoursWeekdays?: string[];
};