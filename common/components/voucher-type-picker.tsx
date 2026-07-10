import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard'
import CheckIcon from '@mui/icons-material/Check'
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber'
import LocalOfferIcon from '@mui/icons-material/LocalOffer'
import {
  VOUCHER_TYPE_LABELS,
  VOUCHER_TYPES,
  type VoucherType,
} from '@/common/schemas/upload-voucher-schema'

const VOUCHER_TYPE_ICONS: Record<VoucherType, typeof LocalOfferIcon> = {
  coupon: LocalOfferIcon,
  voucher: ConfirmationNumberIcon,
  credit: AccountBalanceWalletIcon,
  gift_card: CardGiftcardIcon,
}

interface VoucherTypePickerProps {
  value: VoucherType
  onChange: (type: VoucherType) => void
  error?: string
}

export function VoucherTypePicker({ value, onChange, error }: VoucherTypePickerProps) {
  return (
    <fieldset className="space-y-3">
      <legend className="ml-1 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-on-surface-variant">
        Voucher Type
      </legend>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {VOUCHER_TYPES.map((type) => {
          const Icon = VOUCHER_TYPE_ICONS[type]
          const selected = value === type
          return (
            <button
              key={type}
              type="button"
              role="checkbox"
              aria-checked={selected}
              onClick={() => onChange(type)}
              className={`relative flex min-h-[108px] flex-col items-center justify-center gap-2.5 rounded-2xl border-2 px-3 py-5 transition-all active:scale-95 ${
                selected
                  ? 'border-primary bg-primary/10 text-primary shadow-[0_0_20px_rgba(255,137,173,0.15)] dark:bg-primary/15'
                  : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-primary/40 dark:border-white/10 dark:bg-surface-container-high dark:text-on-surface-variant dark:hover:border-primary/40'
              }`}
            >
              {selected && (
                <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-on-primary">
                  <CheckIcon sx={{ fontSize: 16 }} />
                </span>
              )}
              <span
                className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                  selected ? 'bg-primary/20' : 'bg-gray-100 dark:bg-white/10'
                }`}
              >
                <Icon sx={{ fontSize: 36 }} />
              </span>
              <span className="text-center text-xs font-bold leading-tight sm:text-sm">
                {VOUCHER_TYPE_LABELS[type]}
              </span>
            </button>
          )
        })}
      </div>
      {error && <p className="ml-1 text-xs text-error">{error}</p>}
    </fieldset>
  )
}
