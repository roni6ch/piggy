import type { StoredVoucher, UploadVoucherFormValues } from '@/common/schemas/upload-voucher-schema'

const STORAGE_KEY = 'piggy-vouchers'

function generateId() {
  return `v_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function loadVouchers(): StoredVoucher[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveVouchers(vouchers: StoredVoucher[]): boolean {
  if (typeof window === 'undefined') return false
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vouchers))
    return true
  } catch {
    try {
      const stripped = vouchers.map((v) => ({ ...v, imageData: undefined }))
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stripped))
      return true
    } catch {
      return false
    }
  }
}

export function createVoucher({
  values,
  imageData,
  apiCouponId,
}: {
  values: UploadVoucherFormValues
  imageData?: string
  apiCouponId?: string
}): StoredVoucher {
  const now = new Date().toISOString()
  const voucher: StoredVoucher = {
    ...values,
    id: generateId(),
    imageData,
    apiCouponId,
    createdAt: now,
    updatedAt: now,
  }
  const list = loadVouchers()
  const ok = saveVouchers([voucher, ...list])
  if (!ok) {
    const withoutImage = { ...voucher, imageData: undefined }
    saveVouchers([withoutImage, ...list])
    return withoutImage
  }
  return voucher
}

export function updateVoucher({
  id,
  values,
  imageData,
  apiCouponId,
}: {
  id: string
  values: UploadVoucherFormValues
  /** undefined = keep existing, string = set, null = remove */
  imageData?: string | null
  apiCouponId?: string
}): StoredVoucher | null {
  const list = loadVouchers()
  const index = list.findIndex((v) => v.id === id)
  if (index === -1) return null

  const resolvedImage =
    imageData === undefined ? list[index].imageData : imageData === null ? undefined : imageData

  const updated: StoredVoucher = {
    ...list[index],
    ...values,
    imageData: resolvedImage,
    apiCouponId: apiCouponId ?? list[index].apiCouponId,
    updatedAt: new Date().toISOString(),
  }
  list[index] = updated

  if (!saveVouchers(list)) {
    const withoutImage = { ...updated, imageData: undefined }
    list[index] = withoutImage
    saveVouchers(list)
    return withoutImage
  }
  return updated
}

export function reorderVouchers(orderedIds: string[]): StoredVoucher[] {
  const list = loadVouchers()
  const byId = new Map(list.map((v) => [v.id, v]))
  const reordered: StoredVoucher[] = []

  for (const id of orderedIds) {
    const voucher = byId.get(id)
    if (voucher) reordered.push(voucher)
  }
  for (const voucher of list) {
    if (!orderedIds.includes(voucher.id)) reordered.push(voucher)
  }

  saveVouchers(reordered)
  return reordered
}

export function deleteVoucher(id: string): boolean {
  const list = loadVouchers()
  const filtered = list.filter((v) => v.id !== id)
  if (filtered.length === list.length) return false
  saveVouchers(filtered)
  return true
}

export function getVoucherById(id: string): StoredVoucher | null {
  return loadVouchers().find((v) => v.id === id) ?? null
}
