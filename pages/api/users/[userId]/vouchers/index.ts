import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { uploadVoucherSchema } from '@/common/schemas/upload-voucher-schema'
import { uploadVoucherImage } from '@/lib/upload-voucher-image'
import { addUserVoucher, getUserVouchers } from '@/queries/vouchers/voucherQueries'

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export default async function vouchersHandler(req: NextApiRequest, res: NextApiResponse) {
  const userId = req.query.userId as string
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user?.email || session.user.email !== userId) {
    return res.status(403).json({ message: 'Forbidden' })
  }

  const email = normalizeEmail(userId)

  if (req.method === 'GET') {
    try {
      const vouchers = await getUserVouchers(email)
      return res.status(200).json(
        vouchers.map((v) => ({
          ...v,
          createdAt: v.createdAt.toISOString(),
          updatedAt: v.updatedAt.toISOString(),
        }))
      )
    } catch (e) {
      console.error(e)
      return res.status(500).json({ message: 'Failed to load vouchers' })
    }
  }

  if (req.method === 'POST') {
    const parsed = uploadVoucherSchema.safeParse(req.body?.values ?? req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Invalid voucher data' })
    }

    let imageUrl: string | undefined
    let imageData: string | undefined
    const receiptImage = req.body?.receiptImage
    if (receiptImage && typeof receiptImage === 'string') {
      const uploaded = await uploadVoucherImage({ email, receiptImage })
      imageUrl = uploaded.imageUrl
      imageData = uploaded.imageData
    }

    try {
      const voucher = await addUserVoucher(email, parsed.data, { imageUrl, imageData })
      return res.status(201).json({
        ...voucher,
        createdAt: voucher.createdAt.toISOString(),
        updatedAt: voucher.updatedAt.toISOString(),
      })
    } catch (e) {
      console.error(e)
      return res.status(500).json({ message: 'Failed to save voucher' })
    }
  }

  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).json({ message: `Method ${req.method} not allowed` })
}
