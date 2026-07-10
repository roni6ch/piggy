import { Dialog, Transition } from '@headlessui/react'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard'
import CloseIcon from '@mui/icons-material/Close'
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import EditIcon from '@mui/icons-material/Edit'
import LocalOfferIcon from '@mui/icons-material/LocalOffer'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import WalletIcon from '@mui/icons-material/Wallet'
import { Fragment, useState } from 'react'
import {
  daysUntilExpiration,
  displayTitle,
  expiryUrgency,
  formatVoucherValue,
  walletInsights,
} from '@/common/lib/voucher-display'
import {
  VOUCHER_TYPE_LABELS,
  type StoredVoucher,
  type VoucherType,
} from '@/common/schemas/upload-voucher-schema'

const TYPE_ICONS: Record<VoucherType, typeof LocalOfferIcon> = {
  coupon: LocalOfferIcon,
  voucher: ConfirmationNumberIcon,
  credit: AccountBalanceWalletIcon,
  gift_card: CardGiftcardIcon,
}

const CURRENCY_SYMBOLS: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', ILS: '₪' }

const URGENCY_CHIP: Record<string, string> = {
  none: 'text-[#aaabaf]',
  ok: 'text-secondary',
  soon: 'text-amber-400',
  urgent: 'text-error',
  expired: 'text-gray-400 line-through',
}

function expiryDisplay(date: string) {
  const days = daysUntilExpiration(date)
  const urgency = expiryUrgency(days)
  if (days === null) return null
  if (days < 0) return { main: 'Expired', sub: null, urgency }
  if (days === 0) return { main: 'Today', sub: 'expires', urgency }
  if (days === 1) return { main: '1', sub: 'day left', urgency }
  if (days <= 60) return { main: String(days), sub: 'days left', urgency }
  const d = new Date(`${date}T00:00:00`)
  return {
    main: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    sub: 'expires',
    urgency,
  }
}

interface VoucherCardProps {
  voucher: StoredVoucher
  isDark: boolean
  isEditing: boolean
  isHighlighted: boolean
  isDragging: boolean
  isDragOver: boolean
  showCode: boolean
  showPin: boolean
  onToggleCode: () => void
  onTogglePin: () => void
  onEdit: () => void
  onDelete: () => void
  onImageClick: (src: string) => void
  onDragStart: () => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: () => void
  onDragEnd: () => void
}

function VoucherCard({
  voucher,
  isDark,
  isEditing,
  isHighlighted,
  isDragging,
  isDragOver,
  showCode,
  showPin,
  onToggleCode,
  onTogglePin,
  onEdit,
  onDelete,
  onImageClick,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: VoucherCardProps) {
  const type = (voucher.voucherType ?? 'gift_card') as VoucherType
  const Icon = TYPE_ICONS[type]
  const valueStr = formatVoucherValue(voucher)
  const title = displayTitle(voucher)
  const brand = voucher.brandName?.trim()
  const showBrand = brand && brand !== voucher.title?.trim()
  const expiry = voucher.expirationDate ? expiryDisplay(voucher.expirationDate) : null

  const border = isEditing
    ? 'border-primary bg-primary/5'
    : isHighlighted
      ? 'border-secondary ring-2 ring-secondary/30 bg-secondary/5'
      : isDark
        ? 'border-white/10 bg-[#1d2024]'
        : 'border-gray-200 bg-white'

  const muted = isDark ? 'text-[#747579]' : 'text-gray-500'
  const text = isDark ? 'text-[#e8e8ec]' : 'text-gray-900'
  const chip = isDark ? 'bg-white/10 text-[#aaabaf]' : 'bg-gray-100 text-gray-600'

  const metaItems: { key: string; node: React.ReactNode }[] = []

  if (voucher.serialNumber?.trim()) {
    metaItems.push({
      key: 'code',
      node: (
        <span className="inline-flex items-center gap-1">
          <span className={muted}>Code</span>
          <code className={`font-mono text-sm ${text}`}>
            {showCode ? voucher.serialNumber : `••••${voucher.serialNumber!.slice(-4)}`}
          </code>
          <button type="button" onClick={onToggleCode} className="text-primary active:scale-95" aria-label={showCode ? 'Hide code' : 'Show code'}>
            {showCode ? <VisibilityOffIcon sx={{ fontSize: 15 }} /> : <VisibilityIcon sx={{ fontSize: 15 }} />}
          </button>
        </span>
      ),
    })
  }

  if (voucher.pinCode?.trim()) {
    metaItems.push({
      key: 'pin',
      node: (
        <span className="inline-flex items-center gap-1">
          <span className={muted}>PIN</span>
          <code className={`font-mono text-sm ${text}`}>{showPin ? voucher.pinCode : '••••'}</code>
          <button type="button" onClick={onTogglePin} className="text-primary active:scale-95" aria-label={showPin ? 'Hide PIN' : 'Show PIN'}>
            {showPin ? <VisibilityOffIcon sx={{ fontSize: 15 }} /> : <VisibilityIcon sx={{ fontSize: 15 }} />}
          </button>
        </span>
      ),
    })
  }

  if (voucher.link?.trim()) {
    metaItems.push({
      key: 'link',
      node: (
        <a
          href={voucher.link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-primary hover:underline active:scale-95"
          onClick={(e) => e.stopPropagation()}
        >
          Link ↗
        </a>
      ),
    })
  }

  if (voucher.notes?.trim()) {
    metaItems.push({
      key: 'notes',
      node: (
        <span className={`max-w-[200px] truncate text-sm sm:max-w-xs ${text}`} title={voucher.notes}>
          {voucher.notes}
        </span>
      ),
    })
  }

  return (
    <li
      id={`voucher-${voucher.id}`}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`rounded-xl border px-3 py-3 transition-all ${
        isDragging ? 'opacity-50' : ''
      } ${isDragOver ? 'border-primary ring-1 ring-primary/40' : ''} ${border} ${
        isHighlighted ? 'animate-[pulse_1.5s_ease-in-out_2]' : ''
      }`}
    >
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          className={`flex h-9 w-7 shrink-0 cursor-grab items-center justify-center rounded active:cursor-grabbing ${muted} hover:opacity-80`}
          aria-label={`Drag ${title}`}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <DragIndicatorIcon sx={{ fontSize: 20 }} />
        </button>

        {voucher.imageData ? (
          <button
            type="button"
            onClick={() => onImageClick(voucher.imageData!)}
            className="group relative h-14 w-14 shrink-0 overflow-hidden rounded-lg active:scale-95"
            aria-label={`View image for ${title}`}
          >
            <img
              key={`${voucher.id}-${voucher.updatedAt}`}
              src={voucher.imageData}
              alt=""
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition-all group-hover:bg-black/30 group-hover:opacity-100">
              <VisibilityIcon sx={{ fontSize: 18 }} />
            </span>
          </button>
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon sx={{ fontSize: 28 }} />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className={`truncate font-headline text-base font-bold leading-snug ${text}`}>{title}</p>
          <div className={`mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm ${muted}`}>
            <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${chip}`}>
              <Icon sx={{ fontSize: 13 }} />
              {VOUCHER_TYPE_LABELS[type]}
            </span>
            {showBrand && <span className="truncate">{brand}</span>}
            {expiry && (
              <span className={`inline-flex items-baseline gap-1 ${URGENCY_CHIP[expiry.urgency]}`}>
                <span className="font-headline text-base font-bold leading-none">{expiry.main}</span>
                {expiry.sub && (
                  <span className="text-[11px] font-semibold uppercase tracking-wide opacity-90">{expiry.sub}</span>
                )}
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-center px-2 text-center min-w-[4.5rem]">
          {valueStr ? (
            <span className="font-headline text-xl font-extrabold leading-none text-primary">{valueStr}</span>
          ) : (
            <span className={`text-sm font-medium ${muted}`}>—</span>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-center gap-1">
          <button
            type="button"
            onClick={onEdit}
            className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all active:scale-95 ${
              isEditing ? 'bg-primary/20 text-primary' : isDark ? 'hover:bg-white/10 text-[#aaabaf]' : 'hover:bg-gray-100 text-gray-500'
            }`}
            aria-label={isEditing ? 'Editing' : 'Edit voucher'}
          >
            <EditIcon sx={{ fontSize: 18 }} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className={`flex h-9 w-9 items-center justify-center rounded-lg text-error transition-all active:scale-95 ${
              isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
            }`}
            aria-label={`Delete ${title}`}
          >
            <DeleteOutlineIcon sx={{ fontSize: 18 }} />
          </button>
        </div>
      </div>

      {metaItems.length > 0 && (
        <div
          className={`mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 border-t pt-2 text-sm ${
            isDark ? 'border-white/5' : 'border-gray-100'
          }`}
        >
          {metaItems.map((item, i) => (
            <span key={item.key} className="inline-flex items-center">
              {i > 0 && <span className={`mr-2.5 ${muted}`} aria-hidden>·</span>}
              {item.node}
            </span>
          ))}
        </div>
      )}
    </li>
  )
}

function WalletBar({ vouchers, isDark }: { vouchers: StoredVoucher[]; isDark: boolean }) {
  const insights = walletInsights(vouchers)
  const muted = isDark ? 'text-[#aaabaf]' : 'text-gray-500'
  const text = isDark ? 'text-[#e8e8ec]' : 'text-gray-900'

  const totalStr =
    insights.totals.length > 0
      ? insights.totals
          .map(({ currency, amount }) => {
            const sym = CURRENCY_SYMBOLS[currency] ?? '$'
            return `${sym}${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
          })
          .join(' + ')
      : null

  const parts: string[] = []
  parts.push(`${insights.count} voucher${insights.count !== 1 ? 's' : ''} saved`)
  if (insights.withValue > 0 && insights.withValue < insights.count) {
    parts.push(`${insights.withValue} with value`)
  }
  if (insights.topType && insights.topTypeCount > 0) {
    const label = VOUCHER_TYPE_LABELS[insights.topType as VoucherType] ?? insights.topType
    parts.push(`${insights.topTypeCount} ${label}${insights.topTypeCount !== 1 ? 's' : ''}`)
  }
  if (insights.expiringSoon > 0) {
    parts.push(`${insights.expiringSoon} expiring this week`)
  } else if (insights.expiringMonth > 0) {
    parts.push(`${insights.expiringMonth} expiring this month`)
  }
  if (insights.expired > 0) {
    parts.push(`${insights.expired} expired`)
  }

  return (
    <div
      className={`mb-3 rounded-xl border px-4 py-3 ${
        isDark ? 'border-primary/20 bg-primary/5' : 'border-primary/15 bg-primary/5'
      }`}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-xl" aria-hidden>🐷</span>
        {totalStr && (
          <p className={`font-headline text-lg font-extrabold text-primary`}>{totalStr}</p>
        )}
        <p className={`text-sm font-medium ${text}`}>
          {totalStr ? 'total wallet value' : 'Your wallet'}
        </p>
      </div>
      <p className={`mt-1 text-sm leading-snug ${muted}`}>{parts.join(' · ')}</p>
    </div>
  )
}

interface VoucherListProps {
  vouchers: StoredVoucher[]
  editingId: string | null
  highlightId: string | null
  isDark?: boolean
  onEdit: (voucher: StoredVoucher) => void
  onDelete: (id: string) => void
  onReorder: (orderedIds: string[]) => void
}

export function VoucherList({
  vouchers,
  editingId,
  highlightId,
  isDark = true,
  onEdit,
  onDelete,
  onReorder,
}: VoucherListProps) {
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [revealedPins, setRevealedPins] = useState<Set<string>>(new Set())
  const [revealedCodes, setRevealedCodes] = useState<Set<string>>(new Set())
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const muted = isDark ? 'text-[#747579]' : 'text-gray-400'
  const text = isDark ? 'text-[#e8e8ec]' : 'text-gray-900'

  function handleDrop(targetId: string) {
    if (!dragId || dragId === targetId) {
      setDragId(null)
      setDragOverId(null)
      return
    }
    const ids = vouchers.map((v) => v.id)
    const fromIndex = ids.indexOf(dragId)
    const toIndex = ids.indexOf(targetId)
    if (fromIndex === -1 || toIndex === -1) return
    const next = [...ids]
    next.splice(fromIndex, 1)
    next.splice(toIndex, 0, dragId)
    onReorder(next)
    setDragId(null)
    setDragOverId(null)
  }

  function toggleReveal(set: Set<string>, id: string, setter: (s: Set<string>) => void) {
    const next = new Set(set)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setter(next)
  }

  return (
    <section className="mt-10" aria-label="Your vouchers">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className={`font-headline text-xl font-bold ${text}`}>
          <WalletIcon sx={{ fontSize: 22, verticalAlign: 'middle', marginRight: 0.5, color: '#ff89ad' }} />
          Your Vouchers
          <span className={`ml-1.5 text-sm font-medium ${muted}`}>({vouchers.length})</span>
        </h2>
        {vouchers.length > 1 && (
          <span className={`text-xs uppercase tracking-wide ${muted}`}>Drag to sort</span>
        )}
      </div>

      {vouchers.length > 0 && <WalletBar vouchers={vouchers} isDark={isDark} />}

      {vouchers.length === 0 ? (
        <div
          className={`rounded-xl border border-dashed px-6 py-8 text-center ${
            isDark ? 'border-white/15 bg-[#171a1d]/60 text-[#aaabaf]' : 'border-gray-200 bg-white text-gray-500'
          }`}
        >
          <p className="font-medium">No vouchers yet</p>
          <p className="mt-1 text-sm">Save one above — it shows up here.</p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {vouchers.map((voucher) => (
            <VoucherCard
              key={voucher.id}
              voucher={voucher}
              isDark={isDark}
              isEditing={editingId === voucher.id}
              isHighlighted={highlightId === voucher.id}
              isDragging={dragId === voucher.id}
              isDragOver={dragOverId === voucher.id}
              showCode={revealedCodes.has(voucher.id)}
              showPin={revealedPins.has(voucher.id)}
              onToggleCode={() => toggleReveal(revealedCodes, voucher.id, setRevealedCodes)}
              onTogglePin={() => toggleReveal(revealedPins, voucher.id, setRevealedPins)}
              onEdit={() => onEdit(voucher)}
              onDelete={() => onDelete(voucher.id)}
              onImageClick={setPreviewImage}
              onDragStart={() => setDragId(voucher.id)}
              onDragOver={(e) => {
                e.preventDefault()
                if (dragId && dragId !== voucher.id) setDragOverId(voucher.id)
              }}
              onDrop={() => handleDrop(voucher.id)}
              onDragEnd={() => { setDragId(null); setDragOverId(null) }}
            />
          ))}
        </ul>
      )}

      <Transition appear show={!!previewImage} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setPreviewImage(null)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/85 backdrop-blur-sm" aria-hidden />
          </Transition.Child>
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="relative max-h-[90vh] max-w-lg">
                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="absolute -right-2 -top-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[#1d2024] text-white shadow-lg active:scale-95"
                  aria-label="Close image preview"
                >
                  <CloseIcon sx={{ fontSize: 22 }} />
                </button>
                {previewImage && (
                  <img
                    src={previewImage}
                    alt="Voucher full size"
                    className="max-h-[85vh] w-full rounded-xl object-contain shadow-2xl"
                  />
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </section>
  )
}
