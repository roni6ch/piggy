import * as admin from 'firebase-admin';
import { getFirestore } from '@/lib/firebase-admin';
import { timestampToDate, dateToFirestore } from '@/lib/firestore-utils';
import type { BusinessDocument } from '@/types/db';

const COLLECTION = 'businesses';

function toBusinessDocument(
  id: string,
  data: Record<string, unknown>
): BusinessDocument {
  return {
    _id: id,
    name: data.name as string,
    imageSrc: data.imageSrc as string,
    imageSrcBig: data.imageSrcBig as string,
    createdAt: timestampToDate(data.createdAt),
    openingHours: data.openingHours as string | undefined,
    rating: data.rating as number | undefined,
    userRatingsTotal: data.userRatingsTotal as number | undefined,
    address: data.address as string | undefined,
    phone: data.phone as string | undefined,
    website: data.website as string | undefined,
    googlePlaceId: data.googlePlaceId as string | undefined,
  };
}

export const createBusiness = async (
  business: Omit<BusinessDocument, '_id'>
): Promise<BusinessDocument> => {
  try {
    const db = getFirestore();
    const ref = await db.collection(COLLECTION).add({
      ...business,
      createdAt: business.createdAt
        ? dateToFirestore(business.createdAt)
        : admin.firestore.Timestamp.now(),
    });
    const snap = await ref.get();
    return toBusinessDocument(snap.id, snap.data()!);
  } catch (error) {
    throw new Error(`Failed to create business: ${error}`);
  }
};

export const getBusiness = async (
  id: string
): Promise<BusinessDocument | null> => {
  try {
    const snap = await getFirestore().collection(COLLECTION).doc(id).get();
    if (!snap.exists) return null;
    return toBusinessDocument(snap.id, snap.data()!);
  } catch (error) {
    throw new Error(`Failed to get business: ${error}`);
  }
};

export const getBusinesses = async (
  limitNum: number,
  page: number
): Promise<{ data: BusinessDocument[]; total: number; totalPages: number }> => {
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
    const data = snapshot.docs.map((d) => toBusinessDocument(d.id, d.data()));
    return { data, total, totalPages };
  } catch (error) {
    throw new Error(`Failed to get businesses: ${error}`);
  }
};

/** Fetch businesses for search; filter by name in memory (suitable for hundreds of stores). */
export const searchBusinessesByName = async (
  query: string,
  limit: number = 20
): Promise<BusinessDocument[]> => {
  try {
    const { data } = await getBusinesses(200, 1);
    const q = query.trim().toLowerCase();
    if (!q) return data.slice(0, limit);
    const filtered = data.filter((b) => b.name.toLowerCase().includes(q));
    return filtered.slice(0, limit);
  } catch (error) {
    throw new Error(`Failed to search businesses: ${error}`);
  }
};

export const updateBusiness = async (
  business: BusinessDocument
): Promise<BusinessDocument | null> => {
  try {
    const ref = getFirestore().collection(COLLECTION).doc(business._id);
    const snap = await ref.get();
    if (!snap.exists) return null;
    const update: Record<string, unknown> = {
      name: business.name,
      imageSrc: business.imageSrc,
      imageSrcBig: business.imageSrcBig,
      createdAt: business.createdAt
        ? dateToFirestore(business.createdAt as Date)
        : admin.firestore.Timestamp.now(),
    };
    if (business.openingHours !== undefined) update.openingHours = business.openingHours;
    if (business.rating !== undefined) update.rating = business.rating;
    if (business.userRatingsTotal !== undefined) update.userRatingsTotal = business.userRatingsTotal;
    if (business.address !== undefined) update.address = business.address;
    if (business.phone !== undefined) update.phone = business.phone;
    if (business.website !== undefined) update.website = business.website;
    if (business.googlePlaceId !== undefined) update.googlePlaceId = business.googlePlaceId;
    await ref.update(update);
    return getBusiness(business._id);
  } catch (error) {
    throw new Error(`Failed to update business: ${error}`);
  }
};

export const deleteBusiness = async (id: string): Promise<boolean> => {
  try {
    await getFirestore().collection(COLLECTION).doc(id).delete();
    return true;
  } catch (error) {
    throw new Error(`Failed to delete business: ${error}`);
  }
};
