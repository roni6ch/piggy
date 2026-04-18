import type { StoredVoucher } from '@/common/schemas/upload-voucher-schema'

const CURRENCY_SYMBOLS: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', ILS: '₪' }

export function formatVoucherValue(voucher: StoredVoucher): string | null {
  if (!voucher.value?.trim()) return null
  const sym = CURRENCY_SYMBOLS[voucher.currency ?? 'USD'] ?? '$'
  const num = Number(voucher.value)
  const formatted = Number.isNaN(num)
    ? voucher.value
    : num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
  return `${sym}${formatted}`
}

export function daysUntilExpiration(date: string): number | null {
  if (!date?.trim()) return null
  const exp = new Date(`${date}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((exp.getTime() - today.getTime()) / 86_400_000)
}

export function expiryUrgency(days: number | null): 'none' | 'ok' | 'soon' | 'urgent' | 'expired' {
  if (days === null) return 'none'
  if (days < 0) return 'expired'
  if (days <= 7) return 'urgent'
  if (days <= 30) return 'soon'
  return 'ok'
}

export interface WalletInsights {
  count: number
  withValue: number
  totals: { currency: string; amount: number }[]
  expiringSoon: number
  expiringMonth: number
  expired: number
  topType: string | null
  topTypeCount: number
}

export function walletInsights(vouchers: StoredVoucher[]): WalletInsights {
  const byCurrency = new Map<string, number>()
  const typeCounts = new Map<string, number>()
  let withValue = 0
  let expiringSoon = 0
  let expiringMonth = 0
  let expired = 0

  for (const v of vouchers) {
    const num = Number(v.value)
    if (!Number.isNaN(num) && num > 0) {
      withValue++
      const cur = v.currency?.trim() || 'USD'
      byCurrency.set(cur, (byCurrency.get(cur) ?? 0) + num)
    }

    const type = v.voucherType ?? 'gift_card'
    typeCounts.set(type, (typeCounts.get(type) ?? 0) + 1)

    if (v.expirationDate?.trim()) {
      const days = daysUntilExpiration(v.expirationDate)
      if (days !== null) {
        if (days < 0) expired++
        else if (days <= 7) expiringSoon++
        else if (days <= 30) expiringMonth++
      }
    }
  }

  let topType: string | null = null
  let topTypeCount = 0
  typeCounts.forEach((count, type) => {
    if (count > topTypeCount) {
      topType = type
      topTypeCount = count
    }
  })

  return {
    count: vouchers.length,
    withValue,
    totals: Array.from(byCurrency.entries()).map(([currency, amount]) => ({ currency, amount })),
    expiringSoon,
    expiringMonth,
    expired,
    topType,
    topTypeCount,
  }
}

/** @deprecated use walletInsights */
export function walletSummary(vouchers: StoredVoucher[]) {
  const i = walletInsights(vouchers)
  return { count: i.count, totals: i.totals }
}

export function displayTitle(voucher: StoredVoucher) {
  return voucher.title?.trim() || voucher.brandName?.trim() || 'Untitled voucher'
}

export function hasSubtitle(voucher: StoredVoucher) {
  const title = voucher.title?.trim()
  const brand = voucher.brandName?.trim()
  return !!(title && brand && title !== brand)
}
