import * as admin from 'firebase-admin';
import { getFirestore } from '@/lib/firebase-admin';
import { timestampToDate, dateToFirestore } from '@/lib/firestore-utils';
import type { CategoryDocument, BusinessDocument } from '@/types/db';

const COLLECTION = 'categories';
const BUSINESSES = 'businesses';

function toCategoryDocument(
  id: string,
  data: Record<string, unknown>
): CategoryDocument {
  return {
    _id: id,
    name: data.name as string,
    imageSrc: data.imageSrc as string,
    createdAt: timestampToDate(data.createdAt),
    businessIds: (data.businessIds as string[]) ?? [],
  };
}

export const createCategory = async (
  category: Omit<CategoryDocument, '_id'>
): Promise<CategoryDocument> => {
  try {
    const db = getFirestore();
    const ref = await db.collection(COLLECTION).add({
      ...category,
      createdAt: category.createdAt
        ? dateToFirestore(category.createdAt)
        : admin.firestore.Timestamp.now(),
    });
    const snap = await ref.get();
    return toCategoryDocument(snap.id, snap.data()!);
  } catch (error) {
    throw new Error(`Could not create category: ${error}`);
  }
};

export const getCategories = async (
  limitNum: number,
  page: number
): Promise<{ data: CategoryDocument[]; total: number; totalPages: number }> => {
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
    const data = snapshot.docs.map((d) => toCategoryDocument(d.id, d.data()));
    return { data, total, totalPages };
  } catch (error) {
    throw new Error(`Could not fetch categories: ${error}`);
  }
};

export const getCategoryById = async (
  id: string
): Promise<CategoryDocument | null> => {
  try {
    const snap = await getFirestore().collection(COLLECTION).doc(id).get();
    if (!snap.exists) return null;
    const cat = toCategoryDocument(snap.id, snap.data()!);
    if (cat.businessIds.length === 0) return cat;
    const db = getFirestore();
    const businesses = await Promise.all(
      cat.businessIds.map((bid) => db.collection(BUSINESSES).doc(bid).get())
    );
    const populatedBusinesses = businesses
      .filter((s) => s.exists)
      .map((s) => {
        const d = s.data()!;
        return {
          _id: s.id,
          name: d.name,
          imageSrc: d.imageSrc,
          imageSrcBig: d.imageSrcBig,
          createdAt: timestampToDate(d.createdAt),
          openingHours: d.openingHours as string | undefined,
          rating: d.rating as number | undefined,
          userRatingsTotal: d.userRatingsTotal as number | undefined,
          address: d.address as string | undefined,
          phone: d.phone as string | undefined,
          website: d.website as string | undefined,
        };
      });
    return { ...cat, businessIds: populatedBusinesses } as unknown as CategoryDocument;
  } catch (error) {
    throw new Error(`Could not fetch category: ${error}`);
  }
};

export const updateCategory = async (
  category: CategoryDocument
): Promise<CategoryDocument | null> => {
  try {
    const ref = getFirestore().collection(COLLECTION).doc(category._id);
    const snap = await ref.get();
    if (!snap.exists) return null;
    const update: Record<string, unknown> = {
      name: category.name,
      imageSrc: category.imageSrc,
      businessIds: Array.isArray(category.businessIds)
        ? category.businessIds
        : [],
    };
    if (category.createdAt)
      update.createdAt = dateToFirestore(category.createdAt as Date);
    await ref.update(update);
    return getCategoryById(category._id);
  } catch (error) {
    throw new Error(`Could not update category: ${error}`);
  }
};

export const deleteCategory = async (id: string): Promise<boolean> => {
  try {
    await getFirestore().collection(COLLECTION).doc(id).delete();
    return true;
  } catch (error) {
    throw new Error(`Could not delete category: ${error}`);
  }
};
