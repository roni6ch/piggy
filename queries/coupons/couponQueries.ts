import * as admin from 'firebase-admin';
import { getFirestore } from '@/lib/firebase-admin';
import { timestampToDate } from '@/lib/firestore-utils';
import type { UserCouponDocument } from '@/types/db';

const USERS = 'users';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function userRef(email: string) {
  return getFirestore().collection(USERS).doc(normalizeEmail(email));
}

/** Coupons are stored on the user document as user.coupons[] (single place for all user data). */
function toCouponDoc(raw: { _id: string; storeName?: string; amount?: string; endDate?: string; couponCode?: string; receiptImageUrl?: string; receiptImageData?: string; createdAt?: admin.firestore.Timestamp }): UserCouponDocument {
  return {
    _id: raw._id,
    storeName: raw.storeName ?? '',
    amount: raw.amount ?? '',
    endDate: raw.endDate ?? '',
    couponCode: raw.couponCode,
    receiptImageUrl: raw.receiptImageUrl,
    receiptImageData: raw.receiptImageData,
    createdAt: timestampToDate(raw.createdAt),
  };
}

export async function getUserCoupons(email: string): Promise<UserCouponDocument[]> {
  const snap = await userRef(email).get();
  if (!snap.exists) return [];
  const list = (snap.data()?.coupons as Array<Record<string, unknown>>) ?? [];
  return list
    .map((c) => toCouponDoc({ ...c, _id: (c._id as string) ?? '' }))
    .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
}

function generateCouponId(): string {
  return `coupon_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

export async function addUserCoupon(
  email: string,
  data: {
    storeName: string;
    amount: string;
    endDate: string;
    couponCode?: string;
    receiptImageUrl?: string;
    receiptImageData?: string;
  }
): Promise<UserCouponDocument> {
  const ref = userRef(email);
  const snap = await ref.get();
  const existing = (snap.data()?.coupons as Array<Record<string, unknown>>) ?? [];
  const now = admin.firestore.Timestamp.now();
  const _id = generateCouponId();
  const newCoupon = {
    _id,
    storeName: data.storeName.trim(),
    amount: data.amount.trim(),
    endDate: data.endDate,
    couponCode: data.couponCode?.trim() ?? null,
    receiptImageUrl: data.receiptImageUrl ?? null,
    receiptImageData: data.receiptImageData ?? null,
    createdAt: now,
  };
  await ref.set({ coupons: [...existing, newCoupon] }, { merge: true });
  return toCouponDoc({
    ...newCoupon,
    couponCode: newCoupon.couponCode ?? undefined,
    receiptImageUrl: newCoupon.receiptImageUrl ?? undefined,
    receiptImageData: newCoupon.receiptImageData ?? undefined,
    createdAt: now,
  });
}

export async function updateUserCoupon(
  email: string,
  couponId: string,
  data: {
    storeName: string;
    amount?: string;
    endDate?: string;
    couponCode?: string;
    receiptImageUrl?: string;
    receiptImageData?: string;
  }
): Promise<UserCouponDocument | null> {
  const ref = userRef(email);
  const snap = await ref.get();
  if (!snap.exists) return null;
  const list = (snap.data()?.coupons as Array<Record<string, unknown>>) ?? [];
  const index = list.findIndex((c) => (c._id as string) === couponId);
  if (index === -1) return null;
  const existing = list[index] as Record<string, unknown>;
  const updated = {
    ...existing,
    storeName: data.storeName.trim(),
    amount: (data.amount ?? existing.amount ?? '').toString().trim(),
    endDate: (data.endDate ?? existing.endDate ?? '').toString().trim(),
    couponCode: data.couponCode?.trim() ?? existing.couponCode ?? null,
  } as Record<string, unknown>;
  if (data.receiptImageUrl !== undefined) updated.receiptImageUrl = data.receiptImageUrl;
  if (data.receiptImageData !== undefined) updated.receiptImageData = data.receiptImageData;
  const newList = [...list];
  newList[index] = updated;
  await ref.update({ coupons: newList });
  return toCouponDoc(updated as { _id: string; storeName?: string; amount?: string; endDate?: string; couponCode?: string; receiptImageUrl?: string; receiptImageData?: string; createdAt?: admin.firestore.Timestamp });
}

export async function deleteUserCoupon(
  email: string,
  couponId: string
): Promise<boolean> {
  const ref = userRef(email);
  const snap = await ref.get();
  if (!snap.exists) return false;
  const list = (snap.data()?.coupons as Array<Record<string, unknown>>) ?? [];
  const filtered = list.filter((c) => (c._id as string) !== couponId);
  if (filtered.length === list.length) return false;
  await ref.update({ coupons: filtered });
  return true;
}
