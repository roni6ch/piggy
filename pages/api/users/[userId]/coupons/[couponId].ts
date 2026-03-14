import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { deleteUserCoupon, updateUserCoupon } from '@/queries/coupons/couponQueries';
import { getStorageBucket } from '@/lib/firebase-admin';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export default async function couponByIdHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const userId = req.query.userId as string;
  const couponId = req.query.couponId as string;
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.email || session.user.email !== userId) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const email = normalizeEmail(userId);

  if (req.method === 'PATCH') {
    const { storeName, amount, endDate, couponCode, receiptImage } = req.body ?? {};
    if (!storeName || typeof storeName !== 'string' || !storeName.trim()) {
      return res.status(400).json({ message: 'storeName is required' });
    }
    let receiptImageUrl: string | undefined;
    let receiptImageData: string | undefined;
    const MAX_DATA_SIZE = 500 * 1024;
    if (receiptImage && typeof receiptImage === 'string') {
      const storage = getStorageBucket();
      const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
      if (storage && bucketName) {
        try {
          const bucket = storage.bucket(bucketName);
          const base64Data = receiptImage.replace(/^data:image\/\w+;base64,/, '');
          const buffer = Buffer.from(base64Data, 'base64');
          const filename = `users/${email}/receipts/${Date.now()}.jpg`;
          const file = bucket.file(filename);
          await file.save(buffer, { metadata: { contentType: 'image/jpeg' } });
          const [url] = await file.getSignedUrl({
            action: 'read',
            expires: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000),
          });
          receiptImageUrl = url;
        } catch (e) {
          console.error('Receipt upload failed:', e);
        }
      }
      if (!receiptImageUrl && receiptImage.length < MAX_DATA_SIZE) receiptImageData = receiptImage;
    }
    try {
      const updated = await updateUserCoupon(email, couponId, {
        storeName: storeName.trim(),
        amount: typeof amount === 'string' ? amount.trim() : '',
        endDate: typeof endDate === 'string' ? endDate.trim() : '',
        couponCode: typeof couponCode === 'string' && couponCode.trim() ? couponCode.trim() : undefined,
        receiptImageUrl,
        receiptImageData,
      });
      if (!updated) return res.status(404).json({ message: 'Coupon not found' });
      return res.status(200).json(updated);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: 'Failed to update coupon' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const deleted = await deleteUserCoupon(email, couponId);
      if (!deleted) return res.status(404).json({ message: 'Coupon not found' });
      return res.status(200).json({ success: true });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: 'Failed to delete coupon' });
    }
  }

  res.setHeader('Allow', ['DELETE', 'PATCH']);
  return res.status(405).json({ message: `Method ${req.method} not allowed` });
}
