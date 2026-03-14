import * as admin from 'firebase-admin';
import { getFirestore } from '@/lib/firebase-admin';
import { timestampToDate, dateToFirestore } from '@/lib/firestore-utils';
import { getDefaultAvatarAnimal } from '@/lib/avatar';
import type { UserDocument, SearchDocument, UserCardChoice } from '@/types/db';
import type { CardDocument, BusinessDocument } from '@/types/db';

const USERS = 'users';
const CARDS = 'cards';
const BUSINESSES = 'businesses';

type StoredSearchEntry = {
  term: string;
  createdAt: admin.firestore.Timestamp;
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
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export const createUser = async (user: UserDocument): Promise<void> => {
  try {
    const email = normalizeEmail(user.email);
    const avatarAnimal = user.avatarAnimal ?? getDefaultAvatarAnimal();
    const db = getFirestore();
    await db.collection(USERS).doc(email).set({
      email,
      name: user.name,
      image: user.image ?? '',
      avatarAnimal,
      password: user.password ?? null,
      cards: user.cards && Array.isArray(user.cards) ? user.cards : [],
      searches: [],
      createdAt: user.createdAt ? dateToFirestore(user.createdAt) : admin.firestore.Timestamp.now(),
    });
  } catch (error) {
    console.error(error);
    throw new Error(`Error creating user for email: ${user.email}`);
  }
};

export const getUserByEmail = async (
  email: string
): Promise<UserDocument | null> => {
  try {
    const snap = await getFirestore()
      .collection(USERS)
      .doc(normalizeEmail(email))
      .get();
    if (!snap.exists) return null;
    const data = snap.data();
    return {
      _id: snap.id,
      email: data?.email ?? email,
      name: data?.name ?? '',
      image: data?.image ?? '',
      avatarAnimal: data?.avatarAnimal ?? undefined,
      buymeAmount: data?.buymeAmount,
      buymeType: data?.buymeType,
      cards: (data?.cards as (string | UserCardChoice)[]) ?? [],
      searches: ((data?.searches as StoredSearchEntry[]) ?? []).map(
        (s: StoredSearchEntry) => ({
          term: s.term,
          createdAt: timestampToDate(s.createdAt),
          ...(s.name != null && { name: s.name }),
          ...(s.imageSrc != null && { imageSrc: s.imageSrc }),
          ...(s.imageSrcBig != null && { imageSrcBig: s.imageSrcBig }),
          ...(s.address != null && { address: s.address }),
          ...(s.rating != null && { rating: s.rating }),
          ...(s.userRatingsTotal != null && { userRatingsTotal: s.userRatingsTotal }),
          ...(s.openingHours != null && { openingHours: s.openingHours }),
          ...(s.openingHoursWeekdays != null && { openingHoursWeekdays: s.openingHoursWeekdays }),
          ...(s.phone != null && { phone: s.phone }),
          ...(s.website != null && { website: s.website }),
        })
      ),
      createdAt: data?.createdAt ? timestampToDate(data.createdAt) : undefined,
    } as UserDocument;
  } catch (error) {
    console.error(error);
    throw new Error(`Error getting user by email: ${email}`);
  }
};

export const getUserByEmailWithPassword = async (
  email: string
): Promise<UserDocument | null> => {
  try {
    const snap = await getFirestore()
      .collection(USERS)
      .doc(normalizeEmail(email))
      .get();
    if (!snap.exists) return null;
    const data = snap.data();
    return {
      _id: snap.id,
      email: data?.email ?? email,
      name: data?.name ?? '',
      image: data?.image ?? '',
      avatarAnimal: data?.avatarAnimal ?? undefined,
      buymeAmount: data?.buymeAmount,
      buymeType: data?.buymeType,
      password: data?.password as string | undefined,
      cards: (data?.cards as (string | UserCardChoice)[]) ?? [],
      searches: ((data?.searches as StoredSearchEntry[]) ?? []).map(
        (s: StoredSearchEntry) => ({
          term: s.term,
          createdAt: timestampToDate(s.createdAt),
          ...(s.name != null && { name: s.name }),
          ...(s.imageSrc != null && { imageSrc: s.imageSrc }),
          ...(s.imageSrcBig != null && { imageSrcBig: s.imageSrcBig }),
          ...(s.address != null && { address: s.address }),
          ...(s.rating != null && { rating: s.rating }),
          ...(s.userRatingsTotal != null && { userRatingsTotal: s.userRatingsTotal }),
          ...(s.openingHours != null && { openingHours: s.openingHours }),
          ...(s.openingHoursWeekdays != null && { openingHoursWeekdays: s.openingHoursWeekdays }),
          ...(s.phone != null && { phone: s.phone }),
          ...(s.website != null && { website: s.website }),
        })
      ),
      createdAt: data?.createdAt ? timestampToDate(data.createdAt) : undefined,
    } as UserDocument;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const updateUser = async (
  email: string,
  user: Partial<UserDocument>
): Promise<UserDocument | null> => {
  try {
    const ref = getFirestore().collection(USERS).doc(normalizeEmail(email));
    const snap = await ref.get();
    if (!snap.exists) return null;
    const update: Record<string, unknown> = {};
    if (user.name != null) update.name = user.name;
    if (user.image != null) update.image = user.image;
    if (user.avatarAnimal != null) update.avatarAnimal = user.avatarAnimal;
    if (user.buymeAmount != null) update.buymeAmount = user.buymeAmount;
    if (user.buymeType != null) update.buymeType = user.buymeType;
    if (user.password != null) update.password = user.password;
    if (user.cards != null) update.cards = user.cards;
    if (user.searches != null)
      update.searches = user.searches.map((s) => {
        const term = typeof s.term === 'string' ? s.term : (s.term as BusinessDocument)._id;
        const out: StoredSearchEntry = {
          term,
          createdAt: dateToFirestore(s.createdAt) as admin.firestore.Timestamp,
        };
        if (s.name != null) out.name = s.name;
        if (s.imageSrc != null) out.imageSrc = s.imageSrc;
        if (s.imageSrcBig != null) out.imageSrcBig = s.imageSrcBig;
        return out;
      });
    await ref.update(update);
    return getUserByEmail(email);
  } catch (error) {
    throw new Error(`Error updating user: ${error}`);
  }
};

export const deleteUser = async (email: string): Promise<void> => {
  try {
    await getFirestore().collection(USERS).doc(normalizeEmail(email)).delete();
  } catch (error) {
    throw new Error(`Error deleting user: ${error}`);
  }
};

export const addCardToUser = async (
  email: string,
  cardId: string
): Promise<UserDocument | null> => {
  try {
    const db = getFirestore();
    const cardSnap = await db.collection(CARDS).doc(cardId).get();
    if (!cardSnap.exists) throw new Error(`Card with ID ${cardId} not found`);

    const userRef = db.collection(USERS).doc(normalizeEmail(email));
    const userSnap = await userRef.get();
    if (!userSnap.exists) return null;
    const cards = (userSnap.data()?.cards as string[]) ?? [];
    if (cards.includes(cardId)) return getUserByEmail(email);
    await userRef.update({
      cards: admin.firestore.FieldValue.arrayUnion(cardId),
    });
    return getUserByEmail(email);
  } catch (error) {
    console.error(error);
    return null;
  }
};

/** Default card background by club for user-built cards. */
const DEFAULT_BG_BY_CLUB: Record<string, string> = {
  max: '#182957',
  diners: 'grey',
  cal: '#badcf5',
  isracard: '#182957',
  discount: '#434342',
  yoter: '#434342',
  leumi: '#182957',
  hapoalim: 'grey',
};

function isUserCardChoice(
  c: string | UserCardChoice
): c is UserCardChoice {
  return typeof c === 'object' && c !== null && 'id' in c && 'club' in c && 'provider' in c;
}

const MAX_USER_CARDS = 20;

export const getUserCards = async (
  email: string
): Promise<UserDocument | null> => {
  try {
    const user = await getUserByEmail(email);
    if (!user || !Array.isArray(user.cards)) return user;
    const rawCards = (user.cards as (string | UserCardChoice)[]).slice(0, MAX_USER_CARDS);
    if (rawCards.length === 0) return { ...user, cards: [] };

    const db = getFirestore();
    const cards: CardDocument[] = [];

    for (const item of rawCards) {
      if (isUserCardChoice(item)) {
        cards.push({
          _id: item.id,
          name: `${item.club} ${item.provider}`,
          imageSrc: '',
          type: 'credit',
          issuer: 'regular',
          provider: item.provider,
          club: item.club,
          bg: DEFAULT_BG_BY_CLUB[item.club] ?? '#182957',
          createdAt: new Date(),
        } as CardDocument);
      } else {
        const snap = await db.collection(CARDS).doc(item).get();
        if (snap.exists) {
          const d = snap.data()!;
          cards.push({
            _id: snap.id,
            name: d.name,
            imageSrc: d.imageSrc,
            type: d.type,
            issuer: d.issuer,
            provider: d.provider,
            club: d.club,
            bg: d.bg,
            createdAt: timestampToDate(d.createdAt),
          } as CardDocument);
        }
      }
    }
    return { ...user, cards } as unknown as UserDocument;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const addUserCardByChoice = async (
  email: string,
  choice: { club: string; provider: string }
): Promise<CardDocument | null> => {
  try {
    const userRef = getFirestore().collection(USERS).doc(normalizeEmail(email));
    const userSnap = await userRef.get();
    if (!userSnap.exists) return null;
    const rawCards = (userSnap.data()?.cards as (string | UserCardChoice)[]) ?? [];
    if (rawCards.length >= MAX_USER_CARDS) return null;
    const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const newChoice: UserCardChoice = { id, club: choice.club, provider: choice.provider };
    await userRef.update({
      cards: admin.firestore.FieldValue.arrayUnion(newChoice),
    });
    return {
      _id: id,
      name: `${choice.club} ${choice.provider}`,
      imageSrc: '',
      type: 'credit',
      issuer: 'regular',
      provider: choice.provider,
      club: choice.club,
      bg: DEFAULT_BG_BY_CLUB[choice.club] ?? '#182957',
      createdAt: new Date(),
    } as CardDocument;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const deleteUserCardById = async (
  email: string,
  cardId: string
): Promise<boolean> => {
  try {
    const userRef = getFirestore().collection(USERS).doc(normalizeEmail(email));
    const userSnap = await userRef.get();
    if (!userSnap.exists) return false;
    const cards = (userSnap.data()?.cards as (string | UserCardChoice)[]) ?? [];
    const toRemove = cards.find((c) =>
      isUserCardChoice(c) ? c.id === cardId : c === cardId
    );
    if (toRemove === undefined) return false;
    await userRef.update({
      cards: admin.firestore.FieldValue.arrayRemove(toRemove),
    });
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

const RECENT_SEARCHES_MAX = 10;

export const addRecentSearch = async (
  email: string,
  businessId: string,
  display?: {
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
): Promise<void> => {
  const db = getFirestore();
  const userRef = db.collection(USERS).doc(normalizeEmail(email));
  const userSnap = await userRef.get();
  if (!userSnap.exists) return;

  const data = userSnap.data();
  const searches = (data?.searches as StoredSearchEntry[]) ?? [];
  const now = admin.firestore.Timestamp.now();
  const entry: StoredSearchEntry = {
    term: businessId,
    createdAt: now,
    ...(display?.name != null && { name: display.name }),
    ...(display?.imageSrc != null && { imageSrc: display.imageSrc }),
    ...(display?.imageSrcBig != null && { imageSrcBig: display.imageSrcBig }),
    ...(display?.address != null && { address: display.address }),
    ...(display?.rating != null && { rating: display.rating }),
    ...(display?.userRatingsTotal != null && { userRatingsTotal: display.userRatingsTotal }),
    ...(display?.openingHours != null && { openingHours: display.openingHours }),
    ...(display?.openingHoursWeekdays != null && { openingHoursWeekdays: display.openingHoursWeekdays }),
    ...(display?.phone != null && { phone: display.phone }),
    ...(display?.website != null && { website: display.website }),
  };
  const filtered = searches.filter((s) => s.term !== businessId);
  const next = [...filtered, entry].slice(-RECENT_SEARCHES_MAX);
  await userRef.update({ searches: next });
};

export const getUserRecentSearches = async (
  email: string
): Promise<SearchDocument[]> => {
  const user = await getUserByEmail(email);
  if (!user) throw new Error(`User with email ${email} not found`);

  const raw = user.searches ?? [];
  if (raw.length === 0) return [];

  const db = getFirestore();
  const withBusiness = await Promise.all(
    raw.map(async (s) => {
      const termId = typeof s.term === 'string' ? s.term : (s.term as BusinessDocument)._id;
      const snap = await db.collection(BUSINESSES).doc(termId).get();
      if (!snap.exists) {
        const fallback: BusinessDocument = {
          _id: termId,
          name: s.name ?? termId,
          imageSrc: s.imageSrc ?? '',
          imageSrcBig: s.imageSrcBig ?? '',
          createdAt: timestampToDate(s.createdAt),
          ...(s.address != null && { address: s.address }),
          ...(s.rating != null && { rating: s.rating }),
          ...(s.userRatingsTotal != null && { userRatingsTotal: s.userRatingsTotal }),
          ...(s.openingHours != null && { openingHours: s.openingHours }),
          ...(s.openingHoursWeekdays != null && { openingHoursWeekdays: s.openingHoursWeekdays }),
          ...(s.phone != null && { phone: s.phone }),
          ...(s.website != null && { website: s.website }),
        };
        return { term: fallback, createdAt: s.createdAt } as SearchDocument;
      }
      const d = snap.data()!;
      const business: BusinessDocument = {
        _id: snap.id,
        name: (d.name ?? s.name) ?? '',
        imageSrc: (d.imageSrc ?? s.imageSrc) ?? '',
        imageSrcBig: (d.imageSrcBig ?? s.imageSrcBig) ?? '',
        createdAt: timestampToDate(d.createdAt ?? s.createdAt),
        ...(d.address != null || s.address != null ? { address: d.address ?? s.address } : {}),
        ...(d.rating != null || s.rating != null ? { rating: d.rating ?? s.rating } : {}),
        ...(d.userRatingsTotal != null || s.userRatingsTotal != null ? { userRatingsTotal: d.userRatingsTotal ?? s.userRatingsTotal } : {}),
        ...(d.openingHours != null || s.openingHours != null ? { openingHours: d.openingHours ?? s.openingHours } : {}),
        ...(d.openingHoursWeekdays != null || s.openingHoursWeekdays != null ? { openingHoursWeekdays: (d.openingHoursWeekdays ?? s.openingHoursWeekdays) as string[] } : {}),
        ...(d.phone != null || s.phone != null ? { phone: d.phone ?? s.phone } : {}),
        ...(d.website != null || s.website != null ? { website: d.website ?? s.website } : {}),
      };
      return { term: business, createdAt: s.createdAt } as SearchDocument;
    })
  );
  return withBusiness;
};
