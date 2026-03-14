import Head from 'next/head';
import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import {
  addCoupon,
  updateCoupon,
  deleteCoupon,
  type UserCoupon,
} from '@/common/api';
import { useUserDataContext } from '@/common/context/userContext';

const sectionCardClass =
  'rounded-lg border border-gray-200 dark:border-gray-600 bg-white/80 dark:bg-gray-800/80 p-4 sm:p-5 shadow-sm';

const inputClass =
  'w-full min-h-[44px] rounded border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm';

/** Image to show: Storage URL or inline data URL */
function getCouponImageSrc(c: UserCoupon): string | null {
  return c.receiptImageUrl ?? c.receiptImageData ?? null;
}

export default function Credits() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const { userData, setUserData } = useUserDataContext();

  const coupons = userData.coupons ?? [];
  const couponsLoading = userData.couponsLoading ?? false;
  const [couponForm, setCouponForm] = useState({
    storeName: '',
    amount: '',
    endDate: '',
    couponCode: '',
    receiptFile: null as File | null,
  });
  const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(null);
  const [addingCoupon, setAddingCoupon] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);
  const uploadInputRef = React.useRef<HTMLInputElement>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);

  const email = session?.user?.email ?? '';

  const handleEditCoupon = (c: UserCoupon) => {
    setEditingCouponId(c._id);
    setCouponForm({
      storeName: c.storeName,
      amount: c.amount ?? '',
      endDate: c.endDate ?? '',
      couponCode: c.couponCode ?? '',
      receiptFile: null,
    });
    setReceiptPreviewUrl(c.receiptImageUrl ?? c.receiptImageData ?? null);
    setFormError(null);
  };

  const handleCancelEdit = () => {
    setEditingCouponId(null);
    setCouponForm({ storeName: '', amount: '', endDate: '', couponCode: '', receiptFile: null });
    setReceiptPreviewUrl(null);
    setFormError(null);
  };

  const handleSubmitCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const storeName = couponForm.storeName.trim();
    if (!email) return;
    if (!storeName) {
      setFormError(t('credits.validationStoreNameRequired'));
      return;
    }
    setAddingCoupon(true);
    try {
      let receiptImage: string | undefined;
      if (couponForm.receiptFile) {
        receiptImage = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result as string);
          r.onerror = reject;
          r.readAsDataURL(couponForm.receiptFile!);
        });
      }
      if (editingCouponId) {
        const updated = await updateCoupon({
          userEmail: email,
          couponId: editingCouponId,
          storeName,
          amount: couponForm.amount.trim() || undefined,
          endDate: couponForm.endDate || undefined,
          couponCode: couponForm.couponCode.trim() || undefined,
          receiptImage,
        });
        if (updated) {
          setUserData((prev) => ({
            ...prev,
            coupons: (prev.coupons ?? []).map((x) => (x._id === editingCouponId ? updated : x)),
          }));
          handleCancelEdit();
        } else {
          setFormError(t('credits.saveError'));
        }
      } else {
        const added = await addCoupon({
          userEmail: email,
          storeName,
          amount: couponForm.amount.trim() || undefined,
          endDate: couponForm.endDate || undefined,
          couponCode: couponForm.couponCode.trim() || undefined,
          receiptImage,
        });
        if (added) {
          setUserData((prev) => ({
            ...prev,
            coupons: [added, ...(prev.coupons ?? [])],
          }));
          setCouponForm({ storeName: '', amount: '', endDate: '', couponCode: '', receiptFile: null });
          setReceiptPreviewUrl(null);
        } else {
          setFormError(t('credits.saveError'));
        }
      }
    } catch {
      setFormError(t('credits.saveError'));
    } finally {
      setAddingCoupon(false);
    }
  };

  const handleDeleteCouponClick = (couponId: string) => {
    setDeleteConfirmId(couponId);
  };

  const handleDeleteCouponConfirm = async () => {
    const couponId = deleteConfirmId;
    setDeleteConfirmId(null);
    if (!email || !couponId) return;
    setDeletingId(couponId);
    try {
      const ok = await deleteCoupon({ userEmail: email, couponId });
      if (ok) {
        setUserData((prev) => ({
          ...prev,
          coupons: (prev.coupons ?? []).filter((c) => c._id !== couponId),
        }));
      }
    } finally {
      setDeletingId(null);
    }
  };

  if (!session?.user) return null;

  return (
    <>
      {deleteConfirmId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-confirm-title"
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <h2 id="delete-confirm-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t('credits.deleteConfirmTitle', 'Are you sure?')}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('credits.deleteConfirm')}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {t('credits.cancel')}
              </button>
              <button
                type="button"
                onClick={handleDeleteCouponConfirm}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white"
              >
                {t('credits.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
      <Head>
        <title>Credits | FID</title>
        <meta name="description" content="Manage your credits, coupons and receipt-based savings in one place." />
      </Head>
      <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 text-left">
      <section className={`${sectionCardClass} min-h-[320px]`}>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
          {t('credits.coupons')}
        </h2>
        {couponsLoading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('credits.couponsLoading')}</p>
        ) : coupons.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {t('credits.noCoupons')}
          </p>
        ) : (
          <>
          <ul className="space-y-3 mb-5">
            {coupons.map((c) => {
              const imageSrc = getCouponImageSrc(c);
              return (
                <li
                  key={c._id}
                  className={`flex items-center gap-3 rounded-lg border p-3 sm:p-4 ${editingCouponId === c._id ? 'border-blue-500 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50'}`}
                >
                  {imageSrc ? (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setImageModalUrl(imageSrc); }}
                      className="shrink-0 rounded overflow-hidden border border-gray-200 dark:border-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      aria-label={t('credits.viewReceipt')}
                    >
                      <img
                        src={imageSrc}
                        alt={t('credits.receiptPreview', { defaultValue: 'Receipt preview' })}
                        className="w-14 h-14 sm:w-16 sm:h-16 object-cover"
                      />
                    </button>
                  ) : null}
                  <div className="min-w-0 flex-1 py-1">
                    <p className="text-sm sm:text-base font-medium text-gray-800 dark:text-gray-200 truncate">
                      {c.storeName}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      {[c.amount && `${t('credits.couponAmount')}: ${c.amount}`, c.endDate && `${t('credits.couponEndDate')}: ${c.endDate}`, c.couponCode && `${t('credits.couponCode')}: ${c.couponCode}`].filter(Boolean).join(' · ') || '\u2014'}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0 border-l border-gray-200 dark:border-gray-600 pl-3">
                    <button
                      type="button"
                      onClick={() => handleEditCoupon(c)}
                      className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline text-left"
                    >
                      {t('credits.edit')}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleDeleteCouponClick(c._id); }}
                      disabled={deletingId === c._id}
                      className="text-xs text-red-600 dark:text-red-400 hover:underline disabled:opacity-50 text-left"
                    >
                      {deletingId === c._id ? t('credits.deleting') : t('credits.delete')}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          {imageModalUrl && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
              onClick={() => setImageModalUrl(null)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Escape' && setImageModalUrl(null)}
              aria-label={t('credits.close')}
            >
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setImageModalUrl(null); }}
                className="absolute top-4 right-4 z-[60] w-10 h-10 rounded-full bg-white/90 dark:bg-gray-800 text-gray-800 dark:text-gray-100 flex items-center justify-center text-xl font-bold hover:bg-gray-100 dark:hover:bg-gray-700 shadow-lg"
                aria-label={t('credits.close')}
              >
                ×
              </button>
              <div className="relative max-w-full max-h-[90vh] flex items-center justify-center">
                <img
                  src={imageModalUrl}
                  alt={t('credits.viewReceipt', { defaultValue: 'Receipt image' })}
                  className="max-w-full max-h-[90vh] object-contain rounded shadow-lg"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}
          </>
        )}
        <form onSubmit={handleSubmitCoupon} className="space-y-3 border-t border-gray-200 dark:border-gray-600 pt-4">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {editingCouponId ? t('credits.editCoupon') : t('credits.addCoupon')}
          </p>
          {formError && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {formError}
            </p>
          )}
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              {t('credits.couponStoreNamePlaceholder')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={couponForm.storeName}
              onChange={(e) => { setCouponForm((f) => ({ ...f, storeName: e.target.value })); setFormError(null); }}
              placeholder={t('credits.couponStoreNamePlaceholder')}
              className={inputClass}
              aria-required="true"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              {t('credits.couponAmountPlaceholder')} ({t('credits.optional')})
            </label>
            <input
              type="text"
              value={couponForm.amount}
              onChange={(e) => setCouponForm((f) => ({ ...f, amount: e.target.value }))}
              placeholder={t('credits.couponAmountPlaceholder')}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              {t('credits.couponEndDate')} ({t('credits.optional')})
            </label>
            <input
              type="date"
              value={couponForm.endDate}
              onChange={(e) => setCouponForm((f) => ({ ...f, endDate: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              {t('credits.couponCodeOptional')}
            </label>
            <input
              type="text"
              value={couponForm.couponCode}
              onChange={(e) => setCouponForm((f) => ({ ...f, couponCode: e.target.value }))}
              placeholder={t('credits.couponCodePlaceholder')}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              {t('credits.couponReceiptOptional')}
            </label>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex-1 rounded border border-gray-300 dark:border-gray-500 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium py-2"
              >
                {t('credits.takePhoto')}
              </button>
              <button
                type="button"
                onClick={() => uploadInputRef.current?.click()}
                className="flex-1 rounded border border-gray-300 dark:border-gray-500 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium py-2"
              >
                {t('credits.uploadImage')}
              </button>
            </div>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setCouponForm((f) => ({ ...f, receiptFile: file }));
                  const reader = new FileReader();
                  reader.onload = () => setReceiptPreviewUrl(reader.result as string);
                  reader.readAsDataURL(file);
                }
                e.target.value = '';
              }}
            />
            <input
              ref={uploadInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setCouponForm((f) => ({ ...f, receiptFile: file }));
                  const reader = new FileReader();
                  reader.onload = () => setReceiptPreviewUrl(reader.result as string);
                  reader.readAsDataURL(file);
                }
                e.target.value = '';
              }}
            />
            {receiptPreviewUrl && (
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setImageModalUrl(receiptPreviewUrl)}
                  className="shrink-0 rounded overflow-hidden border border-gray-200 dark:border-gray-500"
                >
                  <img src={receiptPreviewUrl} alt={t('credits.receiptPreview', { defaultValue: 'Receipt preview' })} className="w-14 h-14 object-cover" />
                </button>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {t('credits.receiptPreview')}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setCouponForm((f) => ({ ...f, receiptFile: null }));
                    setReceiptPreviewUrl(null);
                  }}
                  className="text-xs text-red-600 dark:text-red-400 hover:underline"
                >
                  {t('credits.remove')}
                </button>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {editingCouponId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="flex-1 rounded border border-gray-300 dark:border-gray-500 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium py-2"
              >
                {t('credits.cancel')}
              </button>
            )}
            <button
              type="submit"
              disabled={addingCoupon}
              className={`${editingCouponId ? 'flex-1' : 'w-full'} rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium py-2`}
            >
              {addingCoupon ? t('credits.addingCoupon') : editingCouponId ? t('credits.updateCoupon') : t('credits.saveCoupon')}
            </button>
          </div>
        </form>
      </section>
      </div>
    </>
  );
}

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale)),
    },
  };
}
