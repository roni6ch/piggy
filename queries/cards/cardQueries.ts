import * as admin from 'firebase-admin';
import { getFirestore } from '@/lib/firebase-admin';
import { timestampToDate, dateToFirestore } from '@/lib/firestore-utils';
import type { CardDocument } from '@/types/db';

const COLLECTION = 'cards';

function toCardDocument(id: string, data: Record<string, unknown>): CardDocument {
  return {
    _id: id,
    name: data.name as string,
    imageSrc: data.imageSrc as string,
    type: data.type as string,
    issuer: data.issuer as string,
    provider: data.provider as string,
    club: data.club as string,
    bg: data.bg as string,
    createdAt: timestampToDate(data.createdAt),
  };
}

export const createCard = async (
  card: Omit<CardDocument, '_id'>
): Promise<CardDocument> => {
  try {
    const db = getFirestore();
    const ref = await db.collection(COLLECTION).add({
      ...card,
      createdAt: card.createdAt ? dateToFirestore(card.createdAt) : admin.firestore.Timestamp.now(),
    });
    const snap = await ref.get();
    return toCardDocument(snap.id, snap.data()!);
  } catch (error) {
    throw new Error(`Error creating card: ${error}`);
  }
};

export const getCardById = async (
  id: string
): Promise<CardDocument | null> => {
  try {
    const snap = await getFirestore().collection(COLLECTION).doc(id).get();
    if (!snap.exists) return null;
    return toCardDocument(snap.id, snap.data()!);
  } catch (error) {
    throw new Error(`Error finding card by id: ${error}`);
  }
};

/** Fetch all cards from Firestore (all card types). Use for cards catalog page. */
export const getAllCards = async (): Promise<CardDocument[]> => {
  try {
    const snapshot = await getFirestore()
      .collection(COLLECTION)
      .orderBy('createdAt', 'desc')
      .get();
    return snapshot.docs.map((d) => toCardDocument(d.id, d.data()));
  } catch (error) {
    throw new Error(`Error getting all cards: ${error}`);
  }
};

export const getCards = async (
  limitNum: number,
  page: number
): Promise<{ data: CardDocument[]; total: number; totalPages: number }> => {
  try {
    const db = getFirestore();
    const coll = db.collection(COLLECTION);
    const countSnap = await coll.count().get();
    const total = countSnap.data().count;
    const totalPages = Math.ceil(total / limitNum) || 1;

    let q = coll.orderBy('createdAt', 'desc').limit(limitNum);
    if (page > 1) {
      const skip = (page - 1) * limitNum;
      const skipSnap = await coll.orderBy('createdAt', 'desc').limit(skip).get();
      const last = skipSnap.docs[skipSnap.docs.length - 1];
      if (!last) return { data: [], total, totalPages };
      q = coll.orderBy('createdAt', 'desc').startAfter(last).limit(limitNum);
    }
    const snapshot = await q.get();
    const data = snapshot.docs.map((d) => toCardDocument(d.id, d.data()));
    return { data, total, totalPages };
  } catch (error) {
    throw new Error(`Error getting cards: ${error}`);
  }
};

export const updateCard = async (
  id: string,
  card: Partial<CardDocument>
): Promise<CardDocument | null> => {
  try {
    const ref = getFirestore().collection(COLLECTION).doc(id);
    const snap = await ref.get();
    if (!snap.exists) return null;
    const update: Record<string, unknown> = { ...card };
    delete update._id;
    if (card.createdAt)
      update.createdAt = dateToFirestore(card.createdAt as Date);
    await ref.update(update);
    return getCardById(id);
  } catch (error) {
    throw new Error(`Error updating card: ${error}`);
  }
};

export const deleteCard = async (id: string): Promise<boolean> => {
  try {
    await getFirestore().collection(COLLECTION).doc(id).delete();
    return true;
  } catch (error) {
    throw new Error(`Error deleting card: ${error}`);
  }
};
