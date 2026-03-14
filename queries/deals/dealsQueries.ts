import * as admin from 'firebase-admin';
import { getFirestore } from '@/lib/firebase-admin';
import { timestampToDate, dateToFirestore } from '@/lib/firestore-utils';
import type { DealDocument } from '@/types/db';
import { getCardById } from '@/queries/cards/cardQueries';
import { getBusiness } from '@/queries/businesses/businessQueries';

const COLLECTION = 'deals';

function toDealDocument(
  id: string,
  data: Record<string, unknown>
): DealDocument {
  return {
    _id: id,
    description: data.description as string,
    expirationDate: timestampToDate(data.expirationDate),
    createDate: timestampToDate(data.createDate),
    link: data.link as string,
    cardId: data.cardId as string,
    businessId: data.businessId as string,
  };
}

export const createDeal = async (
  dealData: Partial<DealDocument>
): Promise<DealDocument> => {
  try {
    const cardId =
      typeof dealData.cardId === 'string'
        ? dealData.cardId
        : (dealData.cardId as { _id: string })?._id;
    const businessId =
      typeof dealData.businessId === 'string'
        ? dealData.businessId
        : (dealData.businessId as { _id: string })?._id;

    if (!cardId || !businessId) throw new Error('cardId and businessId required');

    const card = await getCardById(cardId);
    const business = await getBusiness(businessId);
    if (!card) throw new Error('Invalid cardId');
    if (!business) throw new Error('Invalid businessId');

    const db = getFirestore();
    const ref = await db.collection(COLLECTION).add({
      description: dealData.description,
      expirationDate: dealData.expirationDate
        ? dateToFirestore(
            dealData.expirationDate instanceof Date
              ? dealData.expirationDate
              : new Date(dealData.expirationDate)
          )
        : admin.firestore.Timestamp.now(),
      createDate: dealData.createDate
        ? dateToFirestore(
            dealData.createDate instanceof Date
              ? dealData.createDate
              : new Date(dealData.createDate)
          )
        : admin.firestore.Timestamp.now(),
      link: dealData.link,
      cardId,
      businessId,
    });
    const snap = await ref.get();
    return toDealDocument(snap.id, snap.data()!);
  } catch (error) {
    throw new Error(`Could not create deal: ${error}`);
  }
};

export const getDealById = async (
  dealId: string
): Promise<DealDocument | null> => {
  try {
    const snap = await getFirestore().collection(COLLECTION).doc(dealId).get();
    if (!snap.exists) return null;
    return toDealDocument(snap.id, snap.data()!);
  } catch (error) {
    throw new Error('Failed to get deal by ID');
  }
};

export const updateDealById = async (
  dealId: string,
  update: Partial<DealDocument>
): Promise<DealDocument | null> => {
  try {
    const ref = getFirestore().collection(COLLECTION).doc(dealId);
    const snap = await ref.get();
    if (!snap.exists) return null;
    const payload: Record<string, unknown> = {};
    if (update.description != null) payload.description = update.description;
    if (update.expirationDate != null)
      payload.expirationDate = dateToFirestore(
        update.expirationDate instanceof Date
          ? update.expirationDate
          : new Date(update.expirationDate)
      );
    if (update.createDate != null)
      payload.createDate = dateToFirestore(
        update.createDate instanceof Date
          ? update.createDate
          : new Date(update.createDate)
      );
    if (update.link != null) payload.link = update.link;
    if (update.cardId != null)
      payload.cardId =
        typeof update.cardId === 'string'
          ? update.cardId
          : (update.cardId as { _id: string })._id;
    if (update.businessId != null)
      payload.businessId =
        typeof update.businessId === 'string'
          ? update.businessId
          : (update.businessId as { _id: string })._id;
    await ref.update(payload);
    return getDealById(dealId);
  } catch (error) {
    throw new Error('Failed to update deal by ID');
  }
};

export const deleteDealById = async (dealId: string): Promise<void> => {
  try {
    await getFirestore().collection(COLLECTION).doc(dealId).delete();
  } catch (error) {
    throw new Error('Failed to delete deal by ID');
  }
};

export const getDealsByBusinessId = async (
  businessId: string,
  limitNum: number,
  page: number
): Promise<{ data: DealDocument[]; total: number; totalPages: number }> => {
  try {
    const db = getFirestore();
    const coll = db.collection(COLLECTION);
    const countSnap = await coll
      .where('businessId', '==', businessId)
      .count()
      .get();
    const total = countSnap.data().count;
    const totalPages = Math.ceil(total / limitNum) || 1;

    let q = coll
      .where('businessId', '==', businessId)
      .orderBy('createDate', 'desc')
      .limit(limitNum);
    if (page > 1) {
      const skip = (page - 1) * limitNum;
      const skipSnap = await coll
        .where('businessId', '==', businessId)
        .orderBy('createDate', 'desc')
        .limit(skip)
        .get();
      const last = skipSnap.docs[skipSnap.docs.length - 1];
      if (!last) return { data: [], total, totalPages };
      q = coll
        .where('businessId', '==', businessId)
        .orderBy('createDate', 'desc')
        .startAfter(last)
        .limit(limitNum);
    }
    const snapshot = await q.get();
    const data = snapshot.docs.map((d) => toDealDocument(d.id, d.data()));
    const populated = await Promise.all(
      data.map(async (deal) => {
        const card = await getCardById(deal.cardId as string);
        return { ...deal, cardId: card ?? deal.cardId };
      })
    );
    return { data: populated as DealDocument[], total, totalPages };
  } catch (error) {
    throw new Error(`Failed to get deals by Business ID: ${error}`);
  }
};

export const getAllDeals = async (
  limitNum: number = 10,
  page: number = 1
): Promise<{ data: DealDocument[]; total: number; totalPages: number }> => {
  try {
    const db = getFirestore();
    const coll = db.collection(COLLECTION);
    const countSnap = await coll.count().get();
    const total = countSnap.data().count;
    const totalPages = Math.ceil(total / limitNum) || 1;

    let q = coll.orderBy('createDate', 'desc').limit(limitNum);
    if (page > 1) {
      const skip = (page - 1) * limitNum;
      const skipSnap = await coll
        .orderBy('createDate', 'desc')
        .limit(skip)
        .get();
      const last = skipSnap.docs[skipSnap.docs.length - 1];
      if (!last) return { data: [], total, totalPages };
      q = coll
        .orderBy('createDate', 'desc')
        .startAfter(last)
        .limit(limitNum);
    }
    const snapshot = await q.get();
    const data = snapshot.docs.map((d) => toDealDocument(d.id, d.data()));
    return { data, total, totalPages };
  } catch (error) {
    throw new Error(`Could not fetch deals: ${error}`);
  }
};
