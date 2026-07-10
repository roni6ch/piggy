import type { StoredVoucher, UploadVoucherFormValues } from '@/common/schemas/upload-voucher-schema'

export interface UserVoucherApi {
  _id: string
  voucherType?: StoredVoucher['voucherType']
  title?: string
  brandName?: string
  serialNumber?: string
  pinCode?: string
  value?: string
  currency?: string
  expirationDate?: string
  link?: string
  notes?: string
  imageUrl?: string
  imageData?: string
  createdAt: string
  updatedAt: string
}

export function apiVoucherToStored(voucher: UserVoucherApi): StoredVoucher {
  return {
    id: voucher._id,
    voucherType: voucher.voucherType ?? 'gift_card',
    title: voucher.title ?? '',
    brandName: voucher.brandName ?? '',
    serialNumber: voucher.serialNumber ?? '',
    pinCode: voucher.pinCode ?? '',
    value: voucher.value ?? '',
    currency: voucher.currency ?? 'USD',
    expirationDate: voucher.expirationDate ?? '',
    link: voucher.link ?? '',
    notes: voucher.notes ?? '',
    imageData: voucher.imageUrl ?? voucher.imageData,
    createdAt: voucher.createdAt,
    updatedAt: voucher.updatedAt,
  }
}

export async function fetchUserVouchers({ userEmail }: { userEmail: string }): Promise<StoredVoucher[]> {
  const res = await fetch(`/api/users/${encodeURIComponent(userEmail)}/vouchers`, { credentials: 'include' })
  if (!res.ok) throw new Error('Failed to load vouchers')
  const json = (await res.json()) as UserVoucherApi[]
  return Array.isArray(json) ? json.map(apiVoucherToStored) : []
}

export async function saveUserVoucher({
  userEmail,
  values,
  receiptImage,
  voucherId,
}: {
  userEmail: string
  values: UploadVoucherFormValues
  receiptImage?: string | null
  voucherId?: string
}): Promise<StoredVoucher> {
  const isEdit = !!voucherId
  const url = isEdit
    ? `/api/users/${encodeURIComponent(userEmail)}/vouchers/${encodeURIComponent(voucherId)}`
    : `/api/users/${encodeURIComponent(userEmail)}/vouchers`

  const res = await fetch(url, {
    method: isEdit ? 'PATCH' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ values, receiptImage }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message || 'Failed to save voucher')
  }

  const json = (await res.json()) as UserVoucherApi
  return apiVoucherToStored(json)
}

export async function removeUserVoucher({
  userEmail,
  voucherId,
}: {
  userEmail: string
  voucherId: string
}): Promise<boolean> {
  const res = await fetch(
    `/api/users/${encodeURIComponent(userEmail)}/vouchers/${encodeURIComponent(voucherId)}`,
    { method: 'DELETE', credentials: 'include' }
  )
  return res.ok
}

export async function reorderUserVouchersApi({
  userEmail,
  orderedIds,
}: {
  userEmail: string
  orderedIds: string[]
}): Promise<boolean> {
  const res = await fetch(`/api/users/${encodeURIComponent(userEmail)}/vouchers/reorder`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ orderedIds }),
  })
  return res.ok
}
