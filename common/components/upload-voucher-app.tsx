import { Dialog, Transition } from '@headlessui/react'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import CloseIcon from '@mui/icons-material/Close'
import DocumentScannerIcon from '@mui/icons-material/DocumentScanner'
import EditNoteIcon from '@mui/icons-material/EditNote'
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import {
  fetchUserVouchers,
  removeUserVoucher,
  reorderUserVouchersApi,
  saveUserVoucher,
} from '@/common/lib/voucher-firebase'
import {
  deleteVoucher as deleteLocalVoucher,
  loadVouchers,
  reorderVouchers,
} from '@/common/lib/voucher-storage'
import {
  uploadVoucherDefaultValues,
  uploadVoucherSchema,
  type ScanVoucherResult,
  type StoredVoucher,
  type UploadVoucherFormValues,
  type VoucherType,
} from '@/common/schemas/upload-voucher-schema'
import { SaveConfetti } from '@/common/components/save-confetti'
import { VoucherList } from '@/common/components/voucher-list'
import { VoucherScanner } from '@/common/components/voucher-scanner'
import { VoucherTypePicker } from '@/common/components/voucher-type-picker'
import { formatVoucherValue } from '@/common/lib/voucher-display'

const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'USD ($)' },
  { code: 'EUR', symbol: '€', label: 'EUR (€)' },
  { code: 'GBP', symbol: '£', label: 'GBP (£)' },
  { code: 'ILS', symbol: '₪', label: 'ILS (₪)' },
]

const inputBaseClass =
  'w-full min-h-[48px] rounded-full border border-gray-200 bg-gray-100 px-5 font-body text-gray-900 placeholder:text-gray-400 transition-all input-focus-glow dark:border-white/10 dark:bg-surface-container-highest dark:text-on-surface dark:placeholder:text-outline'

const labelClass = 'ml-4 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-on-surface-variant'

type EntryMode = 'manual' | 'scan'

interface FieldErrors {
  [key: string]: string | undefined
}

interface UploadVoucherAppProps {
  isDark?: boolean
}

export function UploadVoucherApp({ isDark = true }: UploadVoucherAppProps) {
  const { data: session } = useSession()
  const [vouchers, setVouchers] = useState<StoredVoucher[]>([])
  const [entryMode, setEntryMode] = useState<EntryMode>('manual')
  const [form, setForm] = useState<UploadVoucherFormValues>(uploadVoucherDefaultValues)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [showSerial, setShowSerial] = useState(false)
  const [showPin, setShowPin] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [savedVoucher, setSavedVoucher] = useState<StoredVoucher | null>(null)
  const [lastSaveWasEdit, setLastSaveWasEdit] = useState(false)
  const [confettiTrigger, setConfettiTrigger] = useState(0)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [highlightId, setHighlightId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const expirationDateRef = useRef<HTMLInputElement>(null)

  const userEmail = session?.user?.email

  useEffect(() => {
    if (!userEmail) {
      setVouchers(loadVouchers())
      return
    }

    let cancelled = false
    fetchUserVouchers({ userEmail })
      .then((remote) => {
        if (!cancelled) setVouchers(remote)
      })
      .catch(() => {
        if (!cancelled) setVouchers(loadVouchers())
      })

    return () => {
      cancelled = true
    }
  }, [userEmail])

  const updateField = useCallback(<K extends keyof UploadVoucherFormValues>(key: K, value: UploadVoucherFormValues[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined, form: undefined }))
  }, [])

  const resetForm = useCallback(() => {
    setForm(uploadVoucherDefaultValues)
    setEditingId(null)
    setShowSerial(false)
    setShowPin(false)
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const handleImageFile = useCallback((file: File | null) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, image: 'Please upload an image file (JPG, PNG, WebP)' }))
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, image: 'Image must be under 5 MB' }))
      return
    }
    setImageFile(file)
    setErrors((prev) => ({ ...prev, image: undefined }))
    const reader = new FileReader()
    reader.onload = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files?.[0]
      if (file) handleImageFile(file)
    },
    [handleImageFile]
  )

  const clearImage = useCallback(() => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const validate = useCallback((): boolean => {
    const result = uploadVoucherSchema.safeParse(form)
    if (result.success) {
      setErrors({})
      return true
    }
    const fieldErrors: FieldErrors = {}
    for (const issue of result.error.issues) {
      const key = issue.path[0]
      if (typeof key === 'string' && !fieldErrors[key]) fieldErrors[key] = issue.message
    }
    setErrors(fieldErrors)
    return false
  }, [form])

  const scrollToVoucher = (id: string) => {
    setTimeout(() => {
      document.getElementById(`voucher-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 150)
  }

  const handleEdit = (voucher: StoredVoucher) => {
    setEditingId(voucher.id)
    setEntryMode('manual')
    setForm({
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
    })
    setImagePreview(voucher.imageData ?? null)
    setImageFile(null)
    setErrors({})
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleReorder = async (orderedIds: string[]) => {
    setVouchers((prev) => {
      const byId = new Map(prev.map((v) => [v.id, v]))
      return orderedIds.map((id) => byId.get(id)).filter(Boolean) as StoredVoucher[]
    })
    if (userEmail) {
      await reorderUserVouchersApi({ userEmail, orderedIds })
      return
    }
    reorderVouchers(orderedIds)
  }

  const openDatePicker = () => {
    const input = expirationDateRef.current
    if (!input) return
    if (typeof input.showPicker === 'function') {
      input.showPicker()
    } else {
      input.focus()
      input.click()
    }
  }

  const handleDelete = async (id: string) => {
    if (userEmail) {
      const ok = await removeUserVoucher({ userEmail, voucherId: id })
      if (!ok) return
      setVouchers((prev) => prev.filter((v) => v.id !== id))
    } else {
      deleteLocalVoucher(id)
      setVouchers(loadVouchers())
    }
    if (editingId === id) resetForm()
  }

  const handleScanComplete = (result: ScanVoucherResult, imageData: string) => {
    setForm((prev) => ({
      ...prev,
      voucherType: result.voucherType ?? prev.voucherType,
      title: result.title ?? prev.title,
      brandName: result.brandName ?? prev.brandName,
      serialNumber: result.serialNumber ?? prev.serialNumber,
      pinCode: result.pinCode ?? prev.pinCode,
      value: result.value ?? prev.value,
      currency: result.currency ?? prev.currency,
      expirationDate: result.expirationDate ?? prev.expirationDate,
      link: result.link ?? prev.link,
      notes: result.notes ?? prev.notes,
    }))
    setImagePreview(imageData)
    setImageFile(null)
    setEntryMode('manual')
    setErrors({})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    if (!userEmail) {
      setErrors({ form: 'Sign in to save vouchers to your cloud wallet.' })
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      let receiptImage: string | null | undefined = undefined
      if (imageFile) {
        receiptImage = await new Promise<string>((resolve, reject) => {
          const r = new FileReader()
          r.onload = () => resolve(r.result as string)
          r.onerror = reject
          r.readAsDataURL(imageFile)
        })
      } else if (imagePreview) {
        receiptImage = imagePreview
      } else if (editingId) {
        receiptImage = null
      }

      const wasEditing = !!editingId
      const saved = await saveUserVoucher({
        userEmail,
        values: form,
        receiptImage,
        voucherId: editingId ?? undefined,
      })

      setVouchers((prev) => {
        if (wasEditing) {
          return prev.map((v) => (v.id === saved.id ? saved : v))
        }
        return [saved, ...prev.filter((v) => v.id !== saved.id)]
      })

      setSavedVoucher(saved)
      setLastSaveWasEdit(wasEditing)
      setHighlightId(saved.id)
      setShowSuccess(true)
      setConfettiTrigger((n) => n + 1)
      resetForm()
      scrollToVoucher(saved.id)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      setErrors({ form: message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const cardClass = isDark
    ? 'rounded-2xl border border-white/10 bg-[#171a1d]/80 p-6 shadow-[0_0_40px_rgba(255,107,157,0.08)] backdrop-blur-xl sm:p-10'
    : 'rounded-2xl border border-gray-200 bg-white p-6 shadow-lg sm:p-10'

  return (
    <>
      <SaveConfetti trigger={confettiTrigger} />
      <div className={cardClass}>
        <div className="mb-8 text-center">
          <h2 className={`font-headline text-xl font-bold sm:text-2xl ${isDark ? 'text-[#e8e8ec]' : 'text-gray-900'}`}>
            Add a Voucher
          </h2>
          <p className={`mt-2 text-sm ${isDark ? 'text-[#aaabaf]' : 'text-gray-500'}`}>
            Scan or enter manually — coupons, gift cards, store credits.
          </p>
        </div>

      {/* Entry mode tabs */}
      <div
        className={`mb-8 flex rounded-full border p-1 ${
          isDark ? 'border-white/10 bg-[#1d2024]' : 'border-gray-200 bg-gray-100'
        }`}
      >
        <button
          type="button"
          onClick={() => setEntryMode('scan')}
          className={`flex flex-1 min-h-[44px] items-center justify-center gap-2 rounded-full text-sm font-semibold transition-all active:scale-95 ${
            entryMode === 'scan'
              ? isDark
                ? 'bg-[#23262a] text-primary shadow-sm'
                : 'bg-white text-primary shadow-sm'
              : isDark
                ? 'text-[#aaabaf]'
                : 'text-gray-500'
          }`}
        >
          <DocumentScannerIcon sx={{ fontSize: 18 }} />
          Scan
        </button>
        <button
          type="button"
          onClick={() => setEntryMode('manual')}
          className={`flex flex-1 min-h-[44px] items-center justify-center gap-2 rounded-full text-sm font-semibold transition-all active:scale-95 ${
            entryMode === 'manual'
              ? isDark
                ? 'bg-[#23262a] text-primary shadow-sm'
                : 'bg-white text-primary shadow-sm'
              : isDark
                ? 'text-[#aaabaf]'
                : 'text-gray-500'
          }`}
        >
          <EditNoteIcon sx={{ fontSize: 18 }} />
          Manual
        </button>
      </div>

      {entryMode === 'scan' ? (
        <VoucherScanner onScanComplete={handleScanComplete} onCancel={() => setEntryMode('manual')} />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {editingId && (
            <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 dark:bg-primary/10">
              <p className="text-sm font-semibold text-primary">Editing voucher</p>
              <button
                type="button"
                onClick={resetForm}
                className="text-sm font-medium text-gray-500 underline-offset-2 hover:underline active:scale-95 dark:text-on-surface-variant"
              >
                Cancel
              </button>
            </div>
          )}

          {errors.form && (
            <div className="rounded-xl border border-error/30 bg-error-container/20 px-4 py-3 text-sm text-error" role="alert">
              {errors.form}
            </div>
          )}

          <VoucherTypePicker
            value={(form.voucherType ?? 'gift_card') as VoucherType}
            onChange={(type) => updateField('voucherType', type)}
            error={errors.voucherType}
          />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="voucher-title" className={labelClass}>Title / Name</label>
              <input
                id="voucher-title"
                type="text"
                value={form.title ?? ''}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder='e.g. "Zara Gift Card"'
                className={inputBaseClass}
              />
              {errors.title && <p className="ml-4 mt-1 text-xs text-error">{errors.title}</p>}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="brand-name" className={labelClass}>Company / Brand</label>
              <input
                id="brand-name"
                type="text"
                value={form.brandName ?? ''}
                onChange={(e) => updateField('brandName', e.target.value)}
                placeholder="e.g. Zara"
                className={inputBaseClass}
              />
              {errors.brandName && <p className="ml-4 mt-1 text-xs text-error">{errors.brandName}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="serial-number" className={labelClass}>Serial Number / Code</label>
              <div className="relative">
                <input
                  id="serial-number"
                  type={showSerial ? 'text' : 'password'}
                  value={form.serialNumber ?? ''}
                  onChange={(e) => updateField('serialNumber', e.target.value)}
                  placeholder="Enter code"
                  className={`${inputBaseClass} pr-12`}
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowSerial((s) => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-transform active:scale-95 dark:text-on-surface-variant"
                  aria-label={showSerial ? 'Hide serial number' : 'Show serial number'}
                >
                  {showSerial ? <VisibilityOffIcon sx={{ fontSize: 20 }} /> : <VisibilityIcon sx={{ fontSize: 20 }} />}
                </button>
              </div>
              {errors.serialNumber && <p className="ml-4 mt-1 text-xs text-error">{errors.serialNumber}</p>}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="pin-code" className={labelClass}>PIN Code</label>
              <div className="relative">
                <input
                  id="pin-code"
                  type={showPin ? 'text' : 'password'}
                  value={form.pinCode ?? ''}
                  onChange={(e) => updateField('pinCode', e.target.value)}
                  placeholder="Enter PIN"
                  className={`${inputBaseClass} pr-12`}
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowPin((s) => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-transform active:scale-95 dark:text-on-surface-variant"
                  aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
                >
                  {showPin ? <VisibilityOffIcon sx={{ fontSize: 20 }} /> : <VisibilityIcon sx={{ fontSize: 20 }} />}
                </button>
              </div>
              {errors.pinCode && <p className="ml-4 mt-1 text-xs text-error">{errors.pinCode}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="voucher-value" className={labelClass}>Value / Worth</label>
              <div className="flex gap-2">
                <select
                  id="currency"
                  value={form.currency ?? 'USD'}
                  onChange={(e) => updateField('currency', e.target.value)}
                  className="min-h-[48px] w-28 shrink-0 cursor-pointer rounded-full border border-gray-200 bg-gray-100 px-3 text-sm text-gray-900 input-focus-glow dark:border-white/10 dark:bg-surface-container-highest dark:text-on-surface"
                  aria-label="Currency"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
                <input
                  id="voucher-value"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={form.value ?? ''}
                  onChange={(e) => updateField('value', e.target.value)}
                  placeholder="0.00"
                  className={`${inputBaseClass} flex-1`}
                />
              </div>
              {errors.value && <p className="ml-4 mt-1 text-xs text-error">{errors.value}</p>}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="expiration-date" className={labelClass}>Expiration Date</label>
              <div
                role="button"
                tabIndex={0}
                onClick={openDatePicker}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    openDatePicker()
                  }
                }}
                className="cursor-pointer"
              >
                <input
                  ref={expirationDateRef}
                  id="expiration-date"
                  type="date"
                  value={form.expirationDate ?? ''}
                  onChange={(e) => updateField('expirationDate', e.target.value)}
                  onClick={(e) => {
                    e.stopPropagation()
                    openDatePicker()
                  }}
                  className={`${inputBaseClass} cursor-pointer`}
                />
              </div>
              {errors.expirationDate && <p className="ml-4 mt-1 text-xs text-error">{errors.expirationDate}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="voucher-link" className={labelClass}>Link to Voucher</label>
            <input
              id="voucher-link"
              type="url"
              value={form.link ?? ''}
              onChange={(e) => updateField('link', e.target.value)}
              placeholder="https://redeem.example.com/..."
              className={inputBaseClass}
            />
            {errors.link && <p className="ml-4 mt-1 text-xs text-error">{errors.link}</p>}
          </div>

          <div className="space-y-1.5">
            <span className={labelClass}>Voucher Photo</span>
            <div
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click()
              }}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all active:scale-[0.99] ${
                isDragging
                  ? 'border-primary bg-primary/10'
                  : 'border-gray-200 bg-gray-50 hover:border-primary/50 dark:border-white/15 dark:bg-surface-container-high/50 dark:hover:bg-surface-container-high'
              } ${imagePreview ? 'p-3' : 'p-8 md:p-12'}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={(e) => handleImageFile(e.target.files?.[0] ?? null)}
                aria-label="Upload voucher image"
              />
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Voucher preview" className="mx-auto max-h-56 w-full rounded-xl object-contain" />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); clearImage() }}
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-500 transition-all hover:text-error active:scale-95 dark:bg-surface/90 dark:text-on-surface-variant"
                    aria-label="Remove image"
                  >
                    <CloseIcon sx={{ fontSize: 18 }} />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <CloudUploadIcon sx={{ fontSize: 28 }} />
                  </div>
                  <div>
                    <p className="font-label font-semibold text-gray-800 dark:text-on-surface">Drag & drop your voucher photo</p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-on-surface-variant">or click to browse · JPG, PNG, WebP up to 5 MB</p>
                  </div>
                </div>
              )}
            </div>
            {errors.image && <p className="ml-4 mt-1 text-xs text-error">{errors.image}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="notes" className={labelClass}>Additional Notes</label>
            <textarea
              id="notes"
              value={form.notes ?? ''}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Store location, restrictions, how you earned it…"
              rows={3}
              className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-100 px-5 py-4 font-body text-gray-900 placeholder:text-gray-400 input-focus-glow transition-all dark:border-white/10 dark:bg-surface-container-highest dark:text-on-surface dark:placeholder:text-outline"
            />
            {errors.notes && <p className="ml-4 mt-1 text-xs text-error">{errors.notes}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-[56px] rounded-full bg-gradient-to-br from-primary to-primary-container font-headline text-lg font-extrabold text-on-primary shadow-[0_10px_30px_rgba(255,107,157,0.25)] transition-all duration-300 hover:shadow-[0_15px_40px_rgba(255,107,157,0.35)] active:scale-95 disabled:opacity-60 disabled:active:scale-100"
          >
            {isSubmitting ? 'Saving…' : editingId ? 'Update Voucher' : 'Save Voucher'}
          </button>
        </form>
      )}
      </div>

      <VoucherList
        vouchers={vouchers}
        editingId={editingId}
        highlightId={highlightId}
        isDark={isDark}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onReorder={handleReorder}
      />

      <Transition appear show={showSuccess} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowSuccess(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto px-4">
            <div className="flex min-h-full items-center justify-center py-8">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel
                  className={`w-full max-w-md transform rounded-2xl border p-8 text-center shadow-2xl transition-all ${
                    isDark
                      ? 'border-white/10 bg-[#1d2024] text-[#e8e8ec]'
                      : 'border-gray-200 bg-white text-gray-900'
                  }`}
                >
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-secondary/20">
                    <CheckCircleIcon sx={{ fontSize: 40, color: '#59faba' }} />
                  </div>
                  <Dialog.Title className={`font-headline text-2xl font-extrabold ${isDark ? 'text-[#e8e8ec]' : 'text-gray-900'}`}>
                    {lastSaveWasEdit ? 'Voucher Updated!' : 'Voucher Saved!'}
                  </Dialog.Title>
                  <p className={`mt-3 ${isDark ? 'text-[#aaabaf]' : 'text-gray-500'}`}>
                    <span className="font-semibold text-primary">
                      {savedVoucher?.title?.trim() || savedVoucher?.brandName?.trim() || 'Your voucher'}
                    </span>{' '}
                    is in your wallet below.
                  </p>

                  {savedVoucher && (
                    <div
                      className={`mt-4 rounded-xl border px-4 py-3 text-left text-sm ${
                        isDark ? 'border-white/10 bg-[#23262a]' : 'border-gray-100 bg-gray-50'
                      }`}
                    >
                      {savedVoucher.notes?.trim() && (
                        <p className={`mb-1 ${isDark ? 'text-[#aaabaf]' : 'text-gray-500'}`}>
                          <span className="font-semibold">Notes:</span> {savedVoucher.notes}
                        </p>
                      )}
                      {formatVoucherValue(savedVoucher) && (
                        <p className={isDark ? 'text-[#e8e8ec]' : 'text-gray-800'}>
                          <span className={`font-semibold ${isDark ? 'text-[#aaabaf]' : 'text-gray-500'}`}>Value:</span>{' '}
                          {formatVoucherValue(savedVoucher)}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-stretch">
                    <button
                      type="button"
                      onClick={() => {
                        setShowSuccess(false)
                        setHighlightId(null)
                        if (savedVoucher) handleEdit(savedVoucher)
                      }}
                      className={`inline-flex flex-1 min-h-[48px] items-center justify-center gap-2 rounded-full border font-label font-semibold transition-all active:scale-95 ${
                        isDark ? 'border-white/10 bg-[#23262a] text-[#e8e8ec]' : 'border-gray-200 bg-gray-50 text-gray-800'
                      }`}
                    >
                      <EditNoteIcon sx={{ fontSize: 18 }} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSuccess(false)
                        setHighlightId(savedVoucher?.id ?? null)
                        if (savedVoucher) scrollToVoucher(savedVoucher.id)
                      }}
                      className="inline-flex flex-1 min-h-[48px] items-center justify-center gap-2 rounded-full bg-gradient-to-br from-primary to-primary-container font-headline font-bold text-on-primary transition-all active:scale-95"
                    >
                      <FormatListBulletedIcon sx={{ fontSize: 18 }} />
                      View in List
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  )
}
