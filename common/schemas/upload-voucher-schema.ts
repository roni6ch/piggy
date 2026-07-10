import { z } from 'zod'

export const VOUCHER_TYPES = ['coupon', 'voucher', 'credit', 'gift_card'] as const

export type VoucherType = (typeof VOUCHER_TYPES)[number]

export const VOUCHER_TYPE_LABELS: Record<VoucherType, string> = {
  coupon: 'Coupon',
  voucher: 'Voucher',
  credit: 'Credit',
  gift_card: 'Gift Card',
}

const optionalString = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal(''))

export const uploadVoucherSchema = z.object({
  voucherType: z.enum(VOUCHER_TYPES).optional(),
  title: optionalString(120),
  brandName: optionalString(80),
  serialNumber: optionalString(64),
  pinCode: optionalString(32),
  value: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .refine((v) => !v || (!Number.isNaN(Number(v)) && Number(v) >= 0), 'Enter a valid amount'),
  currency: z.string().optional().or(z.literal('')),
  expirationDate: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((date) => {
      if (!date) return true
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const exp = new Date(date + 'T00:00:00')
      return exp >= today
    }, 'Expiration date cannot be in the past'),
  link: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .refine((v) => !v || /^https?:\/\/.+/i.test(v), 'Enter a valid URL starting with http:// or https://'),
  notes: optionalString(500),
})

export type UploadVoucherFormValues = z.infer<typeof uploadVoucherSchema>

export const uploadVoucherDefaultValues: UploadVoucherFormValues = {
  voucherType: 'gift_card',
  title: '',
  brandName: '',
  serialNumber: '',
  pinCode: '',
  value: '',
  currency: 'USD',
  expirationDate: '',
  link: '',
  notes: '',
}

export interface StoredVoucher extends UploadVoucherFormValues {
  id: string
  imageData?: string
  apiCouponId?: string
  createdAt: string
  updatedAt: string
}

export interface ScanVoucherResult {
  voucherType?: VoucherType
  title?: string
  brandName?: string
  serialNumber?: string
  pinCode?: string
  value?: string
  currency?: string
  expirationDate?: string
  link?: string
  notes?: string
}
