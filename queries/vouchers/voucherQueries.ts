import * as admin from 'firebase-admin'
import { getFirestore } from '@/lib/firebase-admin'
import { timestampToDate } from '@/lib/firestore-utils'
import type { UserVoucherDocument } from '@/types/db'
import type { UploadVoucherFormValues, VoucherType } from '@/common/schemas/upload-voucher-schema'

const USERS = 'users'
const VOUCHERS = 'vouchers'

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function vouchersCol(email: string) {
  return getFirestore().collection(USERS).doc(normalizeEmail(email)).collection(VOUCHERS)
}

function toVoucherDoc(id: string, raw: Record<string, unknown>): UserVoucherDocument {
  return {
    _id: id,
    voucherType: (raw.voucherType as VoucherType) ?? 'gift_card',
    title: (raw.title as string) ?? '',
    brandName: (raw.brandName as string) ?? '',
    serialNumber: (raw.serialNumber as string) ?? '',
    pinCode: (raw.pinCode as string) ?? '',
    value: (raw.value as string) ?? '',
    currency: (raw.currency as string) ?? 'USD',
    expirationDate: (raw.expirationDate as string) ?? '',
    link: (raw.link as string) ?? '',
    notes: (raw.notes as string) ?? '',
    imageUrl: raw.imageUrl as string | undefined,
    imageData: raw.imageData as string | undefined,
    sortOrder: typeof raw.sortOrder === 'number' ? raw.sortOrder : 0,
    createdAt: timestampToDate(raw.createdAt),
    updatedAt: timestampToDate(raw.updatedAt),
  }
}

function formToFirestoreData(
  values: UploadVoucherFormValues,
  extras?: { imageUrl?: string; imageData?: string; sortOrder?: number }
) {
  return {
    voucherType: values.voucherType ?? 'gift_card',
    title: values.title?.trim() ?? '',
    brandName: values.brandName?.trim() ?? '',
    serialNumber: values.serialNumber?.trim() ?? '',
    pinCode: values.pinCode?.trim() ?? '',
    value: values.value?.trim() ?? '',
    currency: values.currency?.trim() || 'USD',
    expirationDate: values.expirationDate ?? '',
    link: values.link?.trim() ?? '',
    notes: values.notes?.trim() ?? '',
    imageUrl: extras?.imageUrl ?? null,
    imageData: extras?.imageData ?? null,
    sortOrder: extras?.sortOrder ?? Date.now(),
  }
}

export async function getUserVouchers(email: string): Promise<UserVoucherDocument[]> {
  const snap = await vouchersCol(email).orderBy('sortOrder', 'desc').get()
  return snap.docs.map((doc) => toVoucherDoc(doc.id, doc.data() as Record<string, unknown>))
}

export async function addUserVoucher(
  email: string,
  values: UploadVoucherFormValues,
  image?: { imageUrl?: string; imageData?: string }
): Promise<UserVoucherDocument> {
  const now = admin.firestore.Timestamp.now()
  const data = {
    ...formToFirestoreData(values, { ...image, sortOrder: Date.now() }),
    createdAt: now,
    updatedAt: now,
  }
  const ref = await vouchersCol(email).add(data)
  return toVoucherDoc(ref.id, { ...data, createdAt: now, updatedAt: now })
}

export async function updateUserVoucher(
  email: string,
  voucherId: string,
  values: UploadVoucherFormValues,
  image?: { imageUrl?: string; imageData?: string; clearImage?: boolean }
): Promise<UserVoucherDocument | null> {
  const ref = vouchersCol(email).doc(voucherId)
  const snap = await ref.get()
  if (!snap.exists) return null

  const existing = snap.data() as Record<string, unknown>
  const now = admin.firestore.Timestamp.now()
  const base = formToFirestoreData(values, {
    sortOrder: typeof existing.sortOrder === 'number' ? existing.sortOrder : Date.now(),
  })

  const updated: Record<string, unknown> = {
    ...base,
    updatedAt: now,
  }

  if (image?.clearImage) {
    updated.imageUrl = null
    updated.imageData = null
  } else if (image?.imageUrl !== undefined || image?.imageData !== undefined) {
    if (image.imageUrl !== undefined) updated.imageUrl = image.imageUrl ?? null
    if (image.imageData !== undefined) updated.imageData = image.imageData ?? null
  } else {
    updated.imageUrl = existing.imageUrl ?? null
    updated.imageData = existing.imageData ?? null
  }

  await ref.update(updated)
  return toVoucherDoc(voucherId, { ...existing, ...updated, updatedAt: now })
}

export async function deleteUserVoucher(email: string, voucherId: string): Promise<boolean> {
  const ref = vouchersCol(email).doc(voucherId)
  const snap = await ref.get()
  if (!snap.exists) return false
  await ref.delete()
  return true
}

export async function reorderUserVouchers(email: string, orderedIds: string[]): Promise<void> {
  const db = getFirestore()
  const batch = db.batch()
  const base = Date.now()

  orderedIds.forEach((id, index) => {
    const ref = vouchersCol(email).doc(id)
    batch.update(ref, {
      sortOrder: base - index,
      updatedAt: admin.firestore.Timestamp.now(),
    })
  })

  await batch.commit()
}
