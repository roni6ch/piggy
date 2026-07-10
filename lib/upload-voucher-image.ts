import { getStorageBucket } from '@/lib/firebase-admin'

const MAX_DATA_SIZE = 500 * 1024

export interface UploadedVoucherImage {
  imageUrl?: string
  imageData?: string
}

export async function uploadVoucherImage({
  email,
  receiptImage,
}: {
  email: string
  receiptImage: string
}): Promise<UploadedVoucherImage> {
  let imageUrl: string | undefined
  let imageData: string | undefined

  const storage = getStorageBucket()
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET
  if (storage && bucketName) {
    try {
      const bucket = storage.bucket(bucketName)
      const base64Data = receiptImage.replace(/^data:image\/\w+;base64,/, '')
      const buffer = Buffer.from(base64Data, 'base64')
      const filename = `users/${email}/vouchers/${Date.now()}.jpg`
      const file = bucket.file(filename)
      await file.save(buffer, {
        metadata: { contentType: 'image/jpeg' },
      })
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000),
      })
      imageUrl = url
    } catch (e) {
      console.error('Voucher image upload failed:', e)
    }
  }

  if (!imageUrl && receiptImage.length < MAX_DATA_SIZE) {
    imageData = receiptImage
  }

  return { imageUrl, imageData }
}
